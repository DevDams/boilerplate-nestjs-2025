import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CheckoutType {
    SUBSCRIPTION = 'subscription',
    PAYMENT = 'payment',
}

export class CreateCheckoutDto {
    @ApiProperty({
        description: 'Type of checkout (subscription or one-time payment)',
        enum: CheckoutType,
        example: CheckoutType.SUBSCRIPTION,
    })
    @IsEnum(CheckoutType)
    @IsNotEmpty()
    type: CheckoutType;

    @ApiProperty({
        description: 'Variant ID of the product in Lemon Squeezy',
        example: '123456',
    })
    @IsString()
    @IsNotEmpty()
    variantId: string;

    @ApiProperty({
        description: 'Custom success URL to redirect after successful payment',
        example: 'https://example.com/payment/success',
        required: false,
    })
    @IsString()
    @IsOptional()
    successUrl?: string;

    @ApiProperty({
        description: 'Custom cancel URL to redirect after canceled payment',
        example: 'https://example.com/payment/cancel',
        required: false,
    })
    @IsString()
    @IsOptional()
    cancelUrl?: string;

    @ApiProperty({
        description: 'Name of the customer (needed for Lemon Squeezy checkout)',
        example: 'John Doe',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Email of the customer (needed for Lemon Squeezy checkout)',
        example: 'john@example.com',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Custom checkout data passed to Lemon Squeezy',
        required: false,
    })
    @IsOptional()
    customData?: Record<string, any>;
} 