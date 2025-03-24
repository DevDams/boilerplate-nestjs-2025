import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  EDITOR = 'editor',
}

// Define permissions as string literals for type safety, but we'll use string[] in the schema
export type Permission = 
  'read:users' | 
  'create:users' | 
  'update:users' | 
  'delete:users' |
  'read:own' |
  'update:own' |
  'delete:own' |
  'read:roles' |
  'create:roles' |
  'update:roles' |
  'delete:roles' |
  'assign:roles' |
  'read:categories' |
  'create:categories' |
  'update:categories' |
  'delete:categories' |
  'read:example-entities' |
  'create:example-entities' |
  'update:example-entities' |
  'delete:example-entities';

export interface UserDocument extends HydratedDocument<User> {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password?: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  // Legacy single role field - keeping for backward compatibility
  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  // New field for multiple roles
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Role' }] })
  roles: MongooseSchema.Types.ObjectId[];

  // Direct permissions in addition to role-based ones
  @Prop({ type: [String], default: [] })
  permissions: string[];

  // User's profile photo URL
  @Prop()
  photoUrl?: string;

  // Refresh token for JWT authentication
  @Prop()
  refreshToken?: string;

  // Token expiration timestamp
  @Prop()
  refreshTokenExpires?: Date;

  // For magic link authentication
  @Prop()
  magicLinkToken?: string;

  @Prop()
  magicLinkExpires?: Date;

  // For account lockout
  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop()
  lockoutUntil?: Date;

  // Lemon Squeezy customer ID
  @Prop()
  lemonSqueezyCustomerId?: string;

  // Active subscriptions
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Subscription' }] })
  subscriptions: MongooseSchema.Types.ObjectId[];

  // Payment history
  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Payment' }] })
  payments: MongooseSchema.Types.ObjectId[];

  // Flag to check if user has an active subscription
  @Prop({ default: false })
  hasActiveSubscription: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add a pre-save hook to hash the password
UserSchema.pre('save', async function (next) {
  const user = this as UserDocument;

  // Only hash the password if it has been modified (or is new)
  if (!user.isModified('password') || !user.password) {
    return next();
  }

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Add a method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  const user = this as UserDocument;
  if (!user.password) return false;
  return bcrypt.compare(candidatePassword, user.password);
}; 