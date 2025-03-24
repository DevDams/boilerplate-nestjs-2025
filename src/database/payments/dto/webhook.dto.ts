import { IsEnum, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum WebhookEventType {
    ORDER_CREATED = 'order_created',
    ORDER_REFUNDED = 'order_refunded',
    SUBSCRIPTION_CREATED = 'subscription_created',
    SUBSCRIPTION_UPDATED = 'subscription_updated',
    SUBSCRIPTION_CANCELLED = 'subscription_cancelled',
    SUBSCRIPTION_RESUMED = 'subscription_resumed',
    SUBSCRIPTION_EXPIRED = 'subscription_expired',
    SUBSCRIPTION_PAUSED = 'subscription_paused',
    SUBSCRIPTION_UNPAUSED = 'subscription_unpaused',
    SUBSCRIPTION_PAYMENT_SUCCESS = 'subscription_payment_success',
    SUBSCRIPTION_PAYMENT_FAILED = 'subscription_payment_failed',
    SUBSCRIPTION_PAYMENT_RECOVERED = 'subscription_payment_recovered',
}

export class WebhookDto {
    @ApiProperty({
        description: 'The type of the webhook event',
        enum: WebhookEventType,
        example: WebhookEventType.ORDER_CREATED,
    })
    @IsEnum(WebhookEventType)
    @IsNotEmpty()
    event: WebhookEventType;

    @ApiProperty({
        description: 'Meta information about the webhook',
    })
    @IsObject()
    meta: {
        test_mode: boolean;
        event_name: string;
        custom_data?: Record<string, any>;
    };

    @ApiProperty({
        description: 'The actual data of the webhook event',
    })
    @IsObject()
    data: Record<string, any>;
}

export class WebhookSignatureDto {
    @ApiProperty({
        description: 'Signature header for verifying the webhook',
    })
    @IsString()
    @IsNotEmpty()
    signature: string;
} 