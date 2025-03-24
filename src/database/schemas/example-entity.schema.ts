import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ExampleEntityDocument = HydratedDocument<ExampleEntity>;

/**
 * Example entity schema with common fields for demonstrating filtering and pagination
 */
@Schema({ timestamps: true })
export class ExampleEntity {
    @Prop({ required: true })
    title: string;
    
    @Prop()
    description?: string;

    @Prop({ default: true })
    isActive: boolean;
    
    @Prop({ default: 0 })
    priority: number;
    
    @Prop({ type: Date })
    dueDate?: Date;
    
    @Prop({ type: Number, default: 0 })
    viewCount: number;
    
    @Prop({ 
        type: String, 
        enum: ['low', 'medium', 'high'], 
        default: 'medium' 
    })
    importance: string;
    
    @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
    metadata: Record<string, any>;
}

export const ExampleEntitySchema = SchemaFactory.createForClass(ExampleEntity);

// Add indexes for optimized querying
ExampleEntitySchema.index({ title: 1 });
ExampleEntitySchema.index({ createdAt: -1 });
ExampleEntitySchema.index({ isActive: 1 });
ExampleEntitySchema.index({ priority: 1 });
ExampleEntitySchema.index({ importance: 1 });
ExampleEntitySchema.index({ dueDate: 1 }); 