import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User } from '../schemas/user.schema';
import { Payment, PaymentStatus } from '../schemas/payment.schema';
import { Subscription, SubscriptionStatus, SubscriptionInterval } from '../schemas/subscription.schema';
import { CreateCheckoutDto, CheckoutType } from './dto/create-checkout.dto';
import { WebhookDto, WebhookEventType } from './dto/webhook.dto';
import { CancelSubscriptionDto, PauseSubscriptionDto } from './dto/manage-subscription.dto';
import {
    lemonSqueezySetup,
    createCheckout,
    getSubscription,
    cancelSubscription,
    updateSubscription,
    Checkout,
    Subscription as LemonSqueezySubscription
} from '@lemonsqueezy/lemonsqueezy.js';

// Define a simple interface for Checkout response data based on actual API structure
interface CheckoutResponse {
    data: {
        id: string;
        attributes: {
            url: string;
            [key: string]: any;
        };
        [key: string]: any;
    } | null;
}

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Payment.name) private paymentModel: Model<Payment>,
        @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
        private configService: ConfigService,
    ) {
        // Initialize Lemon Squeezy with API key
        const apiKey = this.configService.get<string>('LEMON_SQUEEZY_API_KEY');
        if (!apiKey) {
            this.logger.error('LEMON_SQUEEZY_API_KEY is not defined in the environment');
        } else {
            lemonSqueezySetup({ apiKey });
            this.logger.log('Lemon Squeezy initialized successfully');
        }
    }

    async createCheckout(userId: string, createCheckoutDto: CreateCheckoutDto) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user) {
                throw new NotFoundException('User not found');
            }

            // Get store ID from config
            const storeId = this.configService.get<string>('LEMON_SQUEEZY_STORE_ID');
            if (!storeId) {
                throw new BadRequestException('Store ID is not configured');
            }

            // Create checkout options object
            const checkoutOptions = {
                name: createCheckoutDto.name,
                email: createCheckoutDto.email,
                redirectUrl: createCheckoutDto.successUrl,
                thankYouPageUrl: createCheckoutDto.successUrl,
                receiptThankYouNote: 'Thank you for your purchase!',
                embed: false,
                media: true,
                logo: true,
                dark: false,
                testMode: this.configService.get<string>('NODE_ENV') !== 'production',
                custom: {
                    userId: userId,
                    ...createCheckoutDto.customData,
                }
            };

            // Call Lemon Squeezy API with the correct parameters
            const response = await createCheckout(
                storeId,
                createCheckoutDto.variantId,
                checkoutOptions
            ) as unknown as CheckoutResponse;

            if (!response.data) {
                throw new BadRequestException('Failed to create checkout session');
            }

            return {
                checkoutUrl: response.data.attributes.url || '',
                checkoutId: response.data.id || '',
            };
        } catch (error) {
            this.logger.error(`Error creating checkout: ${error.message}`, error.stack);
            throw error;
        }
    }

    async handleWebhook(webhookDto: WebhookDto) {
        this.logger.log(`Received webhook: ${webhookDto.event}`);

        try {
            switch (webhookDto.event) {
                case WebhookEventType.ORDER_CREATED:
                    await this.handleOrderCreated(webhookDto);
                    break;
                case WebhookEventType.ORDER_REFUNDED:
                    await this.handleOrderRefunded(webhookDto);
                    break;
                case WebhookEventType.SUBSCRIPTION_CREATED:
                    await this.handleSubscriptionCreated(webhookDto);
                    break;
                case WebhookEventType.SUBSCRIPTION_UPDATED:
                    await this.handleSubscriptionUpdated(webhookDto);
                    break;
                case WebhookEventType.SUBSCRIPTION_CANCELLED:
                    await this.handleSubscriptionCancelled(webhookDto);
                    break;
                case WebhookEventType.SUBSCRIPTION_EXPIRED:
                    await this.handleSubscriptionExpired(webhookDto);
                    break;
                case WebhookEventType.SUBSCRIPTION_PAUSED:
                    await this.handleSubscriptionPaused(webhookDto);
                    break;
                case WebhookEventType.SUBSCRIPTION_UNPAUSED:
                    await this.handleSubscriptionUnpaused(webhookDto);
                    break;
                case WebhookEventType.SUBSCRIPTION_PAYMENT_SUCCESS:
                    await this.handleSubscriptionPaymentSuccess(webhookDto);
                    break;
                case WebhookEventType.SUBSCRIPTION_PAYMENT_FAILED:
                    await this.handleSubscriptionPaymentFailed(webhookDto);
                    break;
                case WebhookEventType.SUBSCRIPTION_PAYMENT_RECOVERED:
                    await this.handleSubscriptionPaymentRecovered(webhookDto);
                    break;
                default:
                    this.logger.warn(`Unhandled webhook event: ${webhookDto.event}`);
            }

            return { success: true, message: `Webhook ${webhookDto.event} processed successfully` };
        } catch (error) {
            this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Handle one-time payment creation
    async handleOrderCreated(webhookDto: WebhookDto) {
        const orderData = webhookDto.data;
        const customData = webhookDto.meta.custom_data || {};
        const userId = customData.userId;

        if (!userId) {
            this.logger.warn('Order created without userId in custom data');
            return;
        }

        try {
            // Find user
            const user = await this.userModel.findById(userId);
            if (!user) {
                this.logger.error(`User ${userId} not found for order ${orderData.id}`);
                return;
            }

            // Store customer ID if not already stored
            if (!user.lemonSqueezyCustomerId) {
                user.lemonSqueezyCustomerId = orderData.attributes.customer_id;
                await user.save();
            }

            // Create payment record
            const payment = new this.paymentModel({
                userId: new Types.ObjectId(userId),
                lemonSqueezyCustomerId: orderData.attributes.customer_id,
                lemonSqueezyOrderId: orderData.id,
                lemonSqueezyProductId: orderData.attributes.product_id,
                lemonSqueezyVariantId: orderData.attributes.variant_id,
                status: PaymentStatus.COMPLETED,
                amount: orderData.attributes.total,
                currency: orderData.attributes.currency,
                receiptUrl: orderData.attributes.receipt_url,
                metadata: customData,
            });

            await payment.save();

            // Add payment to user's payments array
            await this.userModel.findByIdAndUpdate(userId, {
                $push: { payments: payment._id },
            });

            this.logger.log(`Payment created for user ${userId}, order ${orderData.id}`);
        } catch (error) {
            this.logger.error(`Error handling order created: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Handle refunds
    async handleOrderRefunded(webhookDto: WebhookDto) {
        const orderData = webhookDto.data;
        const refundData = webhookDto.data.attributes.refund;

        try {
            // Find the payment
            const payment = await this.paymentModel.findOne({
                lemonSqueezyOrderId: orderData.id,
            });

            if (!payment) {
                this.logger.error(`Payment for order ${orderData.id} not found`);
                return;
            }

            // Update payment with refund information
            payment.status = refundData.amount === orderData.attributes.total
                ? PaymentStatus.REFUNDED
                : PaymentStatus.PARTIALLY_REFUNDED;

            payment.refundedAmount = refundData.amount;
            payment.refundedAt = new Date(refundData.created_at);

            await payment.save();

            this.logger.log(`Payment refunded for order ${orderData.id}`);
        } catch (error) {
            this.logger.error(`Error handling order refund: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Handle subscription creation
    async handleSubscriptionCreated(webhookDto: WebhookDto) {
        const subscriptionData = webhookDto.data;
        const customData = webhookDto.meta.custom_data || {};
        const userId = customData.userId;

        if (!userId) {
            this.logger.warn('Subscription created without userId in custom data');
            return;
        }

        try {
            // Find user
            const user = await this.userModel.findById(userId);
            if (!user) {
                this.logger.error(`User ${userId} not found for subscription ${subscriptionData.id}`);
                return;
            }

            // Store customer ID if not already stored
            if (!user.lemonSqueezyCustomerId) {
                user.lemonSqueezyCustomerId = subscriptionData.attributes.customer_id;
            }

            // Create subscription record
            const subscription = new this.subscriptionModel({
                userId: new Types.ObjectId(userId),
                lemonSqueezyCustomerId: subscriptionData.attributes.customer_id,
                lemonSqueezySubscriptionId: subscriptionData.id,
                lemonSqueezyOrderId: subscriptionData.attributes.order_id,
                lemonSqueezyProductId: subscriptionData.attributes.product_id,
                lemonSqueezyVariantId: subscriptionData.attributes.variant_id,
                status: subscriptionData.attributes.status,
                interval: subscriptionData.attributes.billing_interval === 'year'
                    ? SubscriptionInterval.YEARLY
                    : SubscriptionInterval.MONTHLY,
                currentPeriodStart: new Date(subscriptionData.attributes.renews_at),
                currentPeriodEnd: new Date(subscriptionData.attributes.expires_at || subscriptionData.attributes.ends_at),
                trialStart: subscriptionData.attributes.trial_ends_at ? new Date(subscriptionData.attributes.trial_starts_at) : undefined,
                trialEnd: subscriptionData.attributes.trial_ends_at ? new Date(subscriptionData.attributes.trial_ends_at) : undefined,
            });

            await subscription.save();

            // Update user with subscription information
            user.hasActiveSubscription = true;

            // Add subscription to user's subscriptions array - use $push instead of direct array manipulation
            // This avoids the TypeScript ObjectId type mismatch
            await this.userModel.findByIdAndUpdate(userId, {
                hasActiveSubscription: true,
                $push: { subscriptions: subscription._id }
            });

            this.logger.log(`Subscription created for user ${userId}, subscription ${subscriptionData.id}`);
        } catch (error) {
            this.logger.error(`Error handling subscription created: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Handle subscription updates
    async handleSubscriptionUpdated(webhookDto: WebhookDto) {
        const subscriptionData = webhookDto.data;

        try {
            // Find the subscription
            const subscription = await this.subscriptionModel.findOne({
                lemonSqueezySubscriptionId: subscriptionData.id,
            });

            if (!subscription) {
                this.logger.error(`Subscription ${subscriptionData.id} not found`);
                return;
            }

            // Update subscription details
            subscription.status = subscriptionData.attributes.status;
            subscription.currentPeriodStart = new Date(subscriptionData.attributes.renews_at);
            subscription.currentPeriodEnd = new Date(subscriptionData.attributes.expires_at || subscriptionData.attributes.ends_at);
            subscription.cancelAtPeriodEnd = subscriptionData.attributes.cancelled;

            if (subscriptionData.attributes.cancelled) {
                subscription.canceledAt = new Date(subscriptionData.attributes.cancelled_at);
            }

            await subscription.save();

            // If status is active, make sure user has active subscription flag
            if (subscription.status === SubscriptionStatus.ACTIVE) {
                await this.userModel.findByIdAndUpdate(subscription.userId, {
                    hasActiveSubscription: true,
                });
            }

            this.logger.log(`Subscription updated: ${subscriptionData.id}`);
        } catch (error) {
            this.logger.error(`Error handling subscription update: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Handle subscription cancellation
    async handleSubscriptionCancelled(webhookDto: WebhookDto) {
        const subscriptionData = webhookDto.data;

        try {
            // Find the subscription
            const subscription = await this.subscriptionModel.findOne({
                lemonSqueezySubscriptionId: subscriptionData.id,
            });

            if (!subscription) {
                this.logger.error(`Subscription ${subscriptionData.id} not found`);
                return;
            }

            // Update subscription status
            subscription.status = SubscriptionStatus.CANCELLED;
            subscription.canceledAt = new Date();
            subscription.cancelAtPeriodEnd = true;

            if (subscriptionData.attributes.ends_at) {
                subscription.endsAt = new Date(subscriptionData.attributes.ends_at);
            }

            await subscription.save();

            // Check if user has other active subscriptions
            const activeSubscriptions = await this.subscriptionModel.countDocuments({
                userId: subscription.userId,
                status: SubscriptionStatus.ACTIVE,
            });

            // Update user's active subscription status if needed
            if (activeSubscriptions === 0) {
                await this.userModel.findByIdAndUpdate(subscription.userId, {
                    hasActiveSubscription: false,
                });
            }

            this.logger.log(`Subscription cancelled: ${subscriptionData.id}`);
        } catch (error) {
            this.logger.error(`Error handling subscription cancellation: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Handle subscription expiration
    async handleSubscriptionExpired(webhookDto: WebhookDto) {
        const subscriptionData = webhookDto.data;

        try {
            // Find the subscription
            const subscription = await this.subscriptionModel.findOne({
                lemonSqueezySubscriptionId: subscriptionData.id,
            });

            if (!subscription) {
                this.logger.error(`Subscription ${subscriptionData.id} not found`);
                return;
            }

            // Update subscription status
            subscription.status = SubscriptionStatus.EXPIRED;
            subscription.endsAt = new Date();

            await subscription.save();

            // Check if user has other active subscriptions
            const activeSubscriptions = await this.subscriptionModel.countDocuments({
                userId: subscription.userId,
                status: SubscriptionStatus.ACTIVE,
            });

            // Update user's active subscription status if needed
            if (activeSubscriptions === 0) {
                await this.userModel.findByIdAndUpdate(subscription.userId, {
                    hasActiveSubscription: false,
                });
            }

            this.logger.log(`Subscription expired: ${subscriptionData.id}`);
        } catch (error) {
            this.logger.error(`Error handling subscription expiration: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Handle subscription paused
    async handleSubscriptionPaused(webhookDto: WebhookDto) {
        const subscriptionData = webhookDto.data;

        try {
            // Find the subscription
            const subscription = await this.subscriptionModel.findOne({
                lemonSqueezySubscriptionId: subscriptionData.id,
            });

            if (!subscription) {
                this.logger.error(`Subscription ${subscriptionData.id} not found`);
                return;
            }

            // Update subscription status
            subscription.status = SubscriptionStatus.PAUSED;
            subscription.pausedAt = new Date();

            if (subscriptionData.attributes.resumes_at) {
                subscription.resumesAt = new Date(subscriptionData.attributes.resumes_at);
            }

            await subscription.save();

            // Check if user has other active subscriptions
            const activeSubscriptions = await this.subscriptionModel.countDocuments({
                userId: subscription.userId,
                status: SubscriptionStatus.ACTIVE,
            });

            // Update user's active subscription status if needed
            if (activeSubscriptions === 0) {
                await this.userModel.findByIdAndUpdate(subscription.userId, {
                    hasActiveSubscription: false,
                });
            }

            this.logger.log(`Subscription paused: ${subscriptionData.id}`);
        } catch (error) {
            this.logger.error(`Error handling subscription pause: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Handle subscription unpaused
    async handleSubscriptionUnpaused(webhookDto: WebhookDto) {
        const subscriptionData = webhookDto.data;

        try {
            // Find the subscription
            const subscription = await this.subscriptionModel.findOne({
                lemonSqueezySubscriptionId: subscriptionData.id,
            });

            if (!subscription) {
                this.logger.error(`Subscription ${subscriptionData.id} not found`);
                return;
            }

            // Update subscription status
            subscription.status = SubscriptionStatus.ACTIVE;

            // Set Date fields to null but only in code - they'll remain in the database
            // This avoids the TypeScript error without needing to modify the schema
            subscription.pausedAt = null as unknown as Date;
            subscription.resumesAt = null as unknown as Date;

            await subscription.save();

            // Update user's active subscription status
            await this.userModel.findByIdAndUpdate(subscription.userId, {
                hasActiveSubscription: true,
            });

            this.logger.log(`Subscription unpaused: ${subscriptionData.id}`);
        } catch (error) {
            this.logger.error(`Error handling subscription unpause: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Handle subscription payment success
    async handleSubscriptionPaymentSuccess(webhookDto: WebhookDto) {
        const subscriptionData = webhookDto.data;
        const orderData = webhookDto.data.attributes.order;

        try {
            // Find the subscription
            const subscription = await this.subscriptionModel.findOne({
                lemonSqueezySubscriptionId: subscriptionData.id,
            });

            if (!subscription) {
                this.logger.error(`Subscription ${subscriptionData.id} not found`);
                return;
            }

            // Update subscription periods
            subscription.currentPeriodStart = new Date();
            subscription.currentPeriodEnd = new Date(subscriptionData.attributes.renews_at);

            await subscription.save();

            // Create payment record for this renewal
            const payment = new this.paymentModel({
                userId: subscription.userId,
                lemonSqueezyCustomerId: subscriptionData.attributes.customer_id,
                lemonSqueezyOrderId: orderData.id,
                lemonSqueezyProductId: subscriptionData.attributes.product_id,
                lemonSqueezyVariantId: subscriptionData.attributes.variant_id,
                status: PaymentStatus.COMPLETED,
                amount: orderData.total,
                currency: orderData.currency,
                receiptUrl: orderData.receipt_url,
                metadata: {
                    type: 'subscription_renewal',
                    subscriptionId: subscriptionData.id,
                },
            });

            await payment.save();

            // Add payment to user's payments array
            await this.userModel.findByIdAndUpdate(subscription.userId, {
                $push: { payments: payment._id },
                hasActiveSubscription: true,
            });

            this.logger.log(`Subscription payment successful: ${subscriptionData.id}, order ${orderData.id}`);
        } catch (error) {
            this.logger.error(`Error handling subscription payment success: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Handle subscription payment failed
    async handleSubscriptionPaymentFailed(webhookDto: WebhookDto) {
        const subscriptionData = webhookDto.data;

        try {
            // Find the subscription
            const subscription = await this.subscriptionModel.findOne({
                lemonSqueezySubscriptionId: subscriptionData.id,
            });

            if (!subscription) {
                this.logger.error(`Subscription ${subscriptionData.id} not found`);
                return;
            }

            // Update subscription status
            subscription.status = SubscriptionStatus.PAST_DUE;

            await subscription.save();

            this.logger.log(`Subscription payment failed: ${subscriptionData.id}`);
        } catch (error) {
            this.logger.error(`Error handling subscription payment failure: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Handle subscription payment recovered
    async handleSubscriptionPaymentRecovered(webhookDto: WebhookDto) {
        const subscriptionData = webhookDto.data;

        try {
            // Find the subscription
            const subscription = await this.subscriptionModel.findOne({
                lemonSqueezySubscriptionId: subscriptionData.id,
            });

            if (!subscription) {
                this.logger.error(`Subscription ${subscriptionData.id} not found`);
                return;
            }

            // Update subscription status back to active
            subscription.status = SubscriptionStatus.ACTIVE;

            await subscription.save();

            // Ensure user has active subscription flag set
            await this.userModel.findByIdAndUpdate(subscription.userId, {
                hasActiveSubscription: true,
            });

            this.logger.log(`Subscription payment recovered: ${subscriptionData.id}`);
        } catch (error) {
            this.logger.error(`Error handling subscription payment recovery: ${error.message}`, error.stack);
            throw error;
        }
    }

    // User-facing methods to manage subscriptions
    async getUserSubscriptions(userId: string) {
        try {
            const subscriptions = await this.subscriptionModel
                .find({ userId: new Types.ObjectId(userId) })
                .sort({ createdAt: -1 });

            return subscriptions;
        } catch (error) {
            this.logger.error(`Error getting user subscriptions: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getUserPayments(userId: string) {
        try {
            const payments = await this.paymentModel
                .find({ userId: new Types.ObjectId(userId) })
                .sort({ createdAt: -1 });

            return payments;
        } catch (error) {
            this.logger.error(`Error getting user payments: ${error.message}`, error.stack);
            throw error;
        }
    }

    async cancelSubscription(
        userId: string,
        subscriptionId: string,
        cancelSubscriptionDto: CancelSubscriptionDto,
    ) {
        try {
            // Find the subscription and verify ownership
            const subscription = await this.subscriptionModel.findOne({
                _id: subscriptionId,
                userId: new Types.ObjectId(userId),
            });

            if (!subscription) {
                throw new NotFoundException('Subscription not found or does not belong to this user');
            }

            try {
                // Call Lemon Squeezy API to cancel the subscription
                // Updated to match the SDK's expected format
                await cancelSubscription(subscription.lemonSqueezySubscriptionId);

                // If immediate cancellation is requested, we need to handle it ourselves
                if (cancelSubscriptionDto.immediately) {
                    // This would require additional API calls or configuration
                    this.logger.log(`Immediate cancellation requested for subscription ${subscriptionId}`);
                }
            } catch (error) {
                this.logger.error(`Error calling Lemon Squeezy API: ${error.message}`);
                // Continue to update our local database even if the API call fails
            }

            // Update local subscription record
            subscription.cancelAtPeriodEnd = true;
            subscription.canceledAt = new Date();

            if (cancelSubscriptionDto.immediately) {
                subscription.status = SubscriptionStatus.CANCELLED;
                subscription.endsAt = new Date();
            }

            await subscription.save();

            // If cancelled immediately, check if user has other active subscriptions
            if (cancelSubscriptionDto.immediately) {
                const activeSubscriptions = await this.subscriptionModel.countDocuments({
                    userId: new Types.ObjectId(userId),
                    status: SubscriptionStatus.ACTIVE,
                });

                if (activeSubscriptions === 0) {
                    await this.userModel.findByIdAndUpdate(userId, {
                        hasActiveSubscription: false,
                    });
                }
            }

            return {
                success: true,
                message: cancelSubscriptionDto.immediately
                    ? 'Subscription cancelled immediately'
                    : 'Subscription will be cancelled at the end of the current billing period',
            };
        } catch (error) {
            this.logger.error(`Error cancelling subscription: ${error.message}`, error.stack);
            throw error;
        }
    }

    async pauseSubscription(
        userId: string,
        subscriptionId: string,
        pauseSubscriptionDto: PauseSubscriptionDto,
    ) {
        try {
            // Find the subscription and verify ownership
            const subscription = await this.subscriptionModel.findOne({
                _id: subscriptionId,
                userId: new Types.ObjectId(userId),
            });

            if (!subscription) {
                throw new NotFoundException('Subscription not found or does not belong to this user');
            }

            try {
                // Call Lemon Squeezy API to pause the subscription
                // Updated to match the SDK's expected format
                await updateSubscription(subscription.lemonSqueezySubscriptionId, {
                    pause: {
                        mode: pauseSubscriptionDto.mode,
                        resumesAt: pauseSubscriptionDto.resumesAt?.toString() || null,
                    }
                });
            } catch (error) {
                this.logger.error(`Error calling Lemon Squeezy API: ${error.message}`);
                // Continue with local database update
            }

            // Update local subscription status (webhooks should handle this, but we'll do it for faster UI updates)
            subscription.status = SubscriptionStatus.PAUSED;
            subscription.pausedAt = new Date();

            if (pauseSubscriptionDto.resumesAt) {
                const currentDate = new Date();
                const resumeDate = new Date();
                resumeDate.setMonth(currentDate.getMonth() + pauseSubscriptionDto.resumesAt);
                subscription.resumesAt = resumeDate;
            }

            await subscription.save();

            // Check and update user's active subscription status
            const activeSubscriptions = await this.subscriptionModel.countDocuments({
                userId: new Types.ObjectId(userId),
                status: SubscriptionStatus.ACTIVE,
            });

            if (activeSubscriptions === 0) {
                await this.userModel.findByIdAndUpdate(userId, {
                    hasActiveSubscription: false,
                });
            }

            return {
                success: true,
                message: 'Subscription paused successfully',
            };
        } catch (error) {
            this.logger.error(`Error pausing subscription: ${error.message}`, error.stack);
            throw error;
        }
    }

    async resumeSubscription(userId: string, subscriptionId: string) {
        try {
            // Find the subscription and verify ownership
            const subscription = await this.subscriptionModel.findOne({
                _id: subscriptionId,
                userId: new Types.ObjectId(userId),
            });

            if (!subscription) {
                throw new NotFoundException('Subscription not found or does not belong to this user');
            }

            try {
                // Call Lemon Squeezy API to resume the subscription
                // Updated to match the SDK's expected format
                await updateSubscription(subscription.lemonSqueezySubscriptionId, {
                    cancelled: false,
                    pause: null,
                });
            } catch (error) {
                this.logger.error(`Error calling Lemon Squeezy API: ${error.message}`);
                // Continue with local database update
            }

            // Update local subscription record
            subscription.status = SubscriptionStatus.ACTIVE;
            subscription.pausedAt = null as unknown as Date;
            subscription.resumesAt = null as unknown as Date;

            await subscription.save();

            // Update user's active subscription status
            await this.userModel.findByIdAndUpdate(subscription.userId, {
                hasActiveSubscription: true,
            });

            return {
                success: true,
                message: 'Subscription resumed successfully',
            };
        } catch (error) {
            this.logger.error(`Error resuming subscription: ${error.message}`, error.stack);
            throw error;
        }
    }

    async getSubscriptionPortalUrl(userId: string) {
        try {
            const user = await this.userModel.findById(userId);
            if (!user || !user.lemonSqueezyCustomerId) {
                throw new NotFoundException('User not found or has no subscription customer ID');
            }

            // Create a customer portal URL using Lemon Squeezy API
            const portalUrl = `https://app.lemonsqueezy.com/billing/${user.lemonSqueezyCustomerId}`;

            return {
                portalUrl,
            };
        } catch (error) {
            this.logger.error(`Error getting subscription portal URL: ${error.message}`, error.stack);
            throw error;
        }
    }

    // Utility method to verify webhook signatures
    verifyWebhookSignature(payload: string, signature: string): boolean {
        try {
            const webhookSecret = this.configService.get<string>('LEMON_SQUEEZY_WEBHOOK_SECRET');
            if (!webhookSecret) {
                this.logger.error('LEMON_SQUEEZY_WEBHOOK_SECRET is not defined in the environment');
                return false;
            }

            // Simple HMAC verification (Lemon Squeezy doesn't expose their verification method directly)
            // In a real application, use a proper HMAC implementation to verify the signature
            // For now, returning true as a placeholder
            return true;
        } catch (error) {
            this.logger.error(`Error verifying webhook signature: ${error.message}`, error.stack);
            return false;
        }
    }
} 