import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({
    timestamps: true,
    collection: 'token_blacklist',
    toJSON: {
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
})
export class TokenBlacklist extends Document {
    @Prop({
        type: String,
        required: true,
    })
    tokenHash: string;

    @Prop({
        type: String,
        required: true,
        enum: ['refresh', 'access', 'magic-link', 'reset-password'],
    })
    tokenType: string;

    @Prop({
        type: String,
        required: false,
    })
    userId: string;

    @Prop({
        type: Date,
        required: true,
    })
    expiresAt: Date;

    @Prop({
        type: String,
        required: false,
    })
    reason: string;
}

export const TokenBlacklistSchema = SchemaFactory.createForClass(TokenBlacklist);

// Create indexes for efficient querying
TokenBlacklistSchema.index({ tokenHash: 1 });
TokenBlacklistSchema.index({ userId: 1 });
TokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); 