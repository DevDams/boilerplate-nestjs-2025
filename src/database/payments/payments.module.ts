import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Subscription, SubscriptionSchema } from '../schemas/subscription.schema';
import { Payment, PaymentSchema } from '../schemas/payment.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { WebhooksController } from './webhooks.controller';

@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([
            { name: Subscription.name, schema: SubscriptionSchema },
            { name: Payment.name, schema: PaymentSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [PaymentsController, WebhooksController],
    providers: [PaymentsService],
    exports: [PaymentsService],
})
export class PaymentsModule { } 