import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export enum SubscriptionStatus {
    ACTIVE = 'active',
    PAST_DUE = 'past_due',
    UNPAID = 'unpaid',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired',
    ON_TRIAL = 'on_trial',
    PAUSED = 'paused',
}

export enum SubscriptionInterval {
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}

export interface SubscriptionDocument extends HydratedDocument<Subscription> { }

@Schema({ timestamps: true })
export class Subscription {
    @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
    userId: MongooseSchema.Types.ObjectId;

    @Prop({ required: true })
    lemonSqueezyCustomerId: string;

    @Prop({ required: true })
    lemonSqueezySubscriptionId: string;

    @Prop({ required: true })
    lemonSqueezyOrderId: string;

    @Prop({ required: true })
    lemonSqueezyProductId: string;

    @Prop({ required: true })
    lemonSqueezyVariantId: string;

    @Prop({
        type: String,
        enum: SubscriptionStatus,
        default: SubscriptionStatus.ACTIVE
    })
    status: SubscriptionStatus;

    @Prop({
        type: String,
        enum: SubscriptionInterval,
        required: true
    })
    interval: SubscriptionInterval;

    @Prop({ type: Date })
    currentPeriodStart: Date;

    @Prop({ type: Date })
    currentPeriodEnd: Date;

    @Prop({ type: Date, required: false })
    trialStart: Date | null;

    @Prop({ type: Date, required: false })
    trialEnd: Date | null;

    @Prop({ default: false })
    cancelAtPeriodEnd: boolean;

    @Prop({ type: Date, required: false })
    canceledAt: Date | null;

    @Prop({ type: Date, required: false })
    pausedAt: Date | null;

    @Prop({ type: Date, required: false })
    resumesAt: Date | null;

    @Prop({ type: Date, required: false })
    endsAt: Date | null;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription); 