import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    REFUNDED = 'refunded',
    PARTIALLY_REFUNDED = 'partially_refunded',
    FAILED = 'failed',
}

export interface PaymentDocument extends HydratedDocument<Payment> { }

@Schema({ timestamps: true })
export class Payment {
    @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
    userId: MongooseSchema.Types.ObjectId;

    @Prop({ required: true })
    lemonSqueezyCustomerId: string;

    @Prop({ required: true })
    lemonSqueezyOrderId: string;

    @Prop({ required: true })
    lemonSqueezyProductId: string;

    @Prop({ required: true })
    lemonSqueezyVariantId: string;

    @Prop({
        type: String,
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    status: PaymentStatus;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    currency: string;

    @Prop()
    receiptUrl: string;

    @Prop()
    refundedAmount: number;

    @Prop()
    refundedAt: Date;

    @Prop({ type: MongooseSchema.Types.Mixed })
    metadata: Record<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment); 