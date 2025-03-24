import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export interface CategoryDocument extends HydratedDocument<Category> { }

@Schema({ timestamps: true }) // timestamps will help with cursor-based pagination
export class Category {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop()
    description?: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: 0 })
    order: number;

    @Prop()
    imageUrl?: string;

    @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
    metadata: Record<string, any>;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Add indexes for optimized querying
CategorySchema.index({ name: 1 });
CategorySchema.index({ createdAt: -1 });
CategorySchema.index({ order: 1 }); 