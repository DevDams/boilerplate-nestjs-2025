# NestJS API Boilerplate

A modern, secure, and feature-rich NestJS API boilerplate with MongoDB integration, advanced authentication, file storage, and optimized query capabilities.

## Stack

- **Backend Framework**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation API**: Swagger/OpenAPI
- **File Storage**: Modular abstraction (local and Cloudflare R2 support)
- **Validation**: class-validator and ValidationPipe
- **Security**: Helmet, CORS, password hashing
- **Scheduling**: @nestjs/schedule for scheduled tasks
- **Email**: Integrated email service
- **Payments**: Lemon Squeezy integration for subscriptions and one-time payments

## Main Features

1. **API Configuration**
   - Modular NestJS architecture
   - Comprehensive Swagger documentation
   - Configurable environment variables

2. **Advanced Security**
   - JWT authentication with refresh tokens
   - Role and permission-based authorization
   - Fine-grained access control
   - Protection against common attacks with Helmet
   - Token blacklist management
   - Account lockout after failed login attempts

3. **Role and Permission System**
   - Hierarchical role management
   - Granular permission controls
   - Role-based access control (RBAC)
   - Permission-based feature access
   - Default roles (Admin, User, Editor)
   - Custom role creation

4. **MongoDB Integration**
   - Optimized schemas: Users, Roles, Categories, etc.
   - Repository pattern for data access
   - Proper schema validation and indexing

5. **Advanced Query Features**
   - Cursor-based pagination for optimal performance
   - Traditional page-based pagination
   - Filtering, sorting and search
   - Field selection (projection)
   - Query performance optimization

6. **File Management**
   - File upload and management
   - Storage abstraction (local/cloud)
   - Support for Cloudflare R2 Storage
   - Signed URLs for secure access
   - File metadata handling
   - Flexible file access control

7. **Payment Integration**
   - Lemon Squeezy integration for payments
   - Subscription management (create, update, cancel)
   - One-time payment processing
   - Webhook handling for payment events
   - Customer portal integration
   - Payment history tracking

8. **Standardized Responses**
   - Uniform response format
   - Global error handling
   - Transformation interceptors

## Project Configuration

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB (local or remote)
- (Optional) Cloudflare account for R2 Storage
- (Optional) Lemon Squeezy account for payments

### Environment Variables

Create a `.env` file at the project root based on `.env.example`:

```
# Application
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/nestjs-boilerplate

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Storage (local or cloudflare)
STORAGE_TYPE=local
STORAGE_LOCAL_PATH=./uploads

# Cloudflare R2 (if STORAGE_TYPE=cloudflare)
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=your_public_url
R2_USE_SIGNED_URLS=false
R2_URL_EXPIRATION_SECONDS=3600

# Lemon Squeezy (for payment integration)
LEMON_SQUEEZY_API_KEY=your_api_key
LEMON_SQUEEZY_STORE_ID=your_store_id
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret
```

## Installation and Startup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start in development mode**
   ```bash
   npm run start:dev
   ```

3. **Start in production mode**
   ```bash
   npm run build
   npm run start:prod
   ```

4. **Access API documentation**
   Open your browser at: `http://localhost:3000/api/docs`

## Project Structure

```
src/
├── auth/                    # Authentication module
├── common/                  # Utilities, interceptors, shared filters
│   ├── decorators/          # Custom decorators
│   ├── guards/              # Authorization guards
│   └── services/            # Shared services
├── config/                  # Application configuration
├── database/                # Database modules
│   ├── categories/          # Categories module
│   ├── example-entity/      # Example entity with advanced querying
│   ├── payments/            # Payment processing module
│   ├── roles/               # Roles management module
│   ├── schemas/             # Mongoose schemas
│   ├── token-blacklist/     # Token blacklist module
│   └── users/               # Users module
├── storage/                 # File storage module
│   ├── providers/           # Storage provider implementations
│   └── storage.service.ts   # Unified storage service
├── app.module.ts            # Main module
└── main.ts                  # Application entry point
```

## Development Guide

### Creating a New Module

1. **Create a new directory in `src/database/`**
   ```bash
   mkdir -p src/database/my-feature
   ```

2. **Create the essential files**
   ```bash
   touch src/database/my-feature/my-feature.module.ts
   touch src/database/my-feature/my-feature.controller.ts
   touch src/database/my-feature/my-feature.service.ts
   mkdir -p src/database/my-feature/dto
   ```

3. **Create the Mongoose schema in `src/database/schemas/`**
   ```bash
   touch src/database/schemas/my-feature.schema.ts
   ```

4. **Example module structure**:

   ```typescript
   // my-feature.module.ts
   import { Module, forwardRef } from '@nestjs/common';
   import { MongooseModule } from '@nestjs/mongoose';
   import { MyFeature, MyFeatureSchema } from '../schemas/my-feature.schema';
   import { MyFeatureController } from './my-feature.controller';
   import { MyFeatureService } from './my-feature.service';
   import { CommonModule } from '../../common/common.module';
   import { RolesModule } from '../roles/roles.module';
   import { UsersModule } from '../users/users.module';

   @Module({
     imports: [
       MongooseModule.forFeature([
         { name: MyFeature.name, schema: MyFeatureSchema },
       ]),
       CommonModule,
       RolesModule,
       forwardRef(() => UsersModule), // Avoid circular dependency
     ],
     controllers: [MyFeatureController],
     providers: [MyFeatureService],
     exports: [MyFeatureService],
   })
   export class MyFeatureModule {}
   ```

5. **Import your module in `app.module.ts`**

### Implementing Role and Permission Guards

Use the built-in guards to protect your endpoints:

```typescript
// my-feature.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('my-features')
@UseGuards(RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class MyFeatureController {
  @Get()
  @Roles('admin', 'editor')
  @RequirePermissions('read:my-features')
  findAll() {
    // Your code here
  }
}
```

### Implementing Cursor-Based Pagination

Use the QueryService from CommonModule to implement cursor-based pagination:

```typescript
// my-feature.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MyFeature } from '../schemas/my-feature.schema';
import { QueryService } from '../../common/services/query.service';
import { QueryOptionsDto } from '../../common/dto/query-options.dto';

@Injectable()
export class MyFeatureService {
  constructor(
    @InjectModel(MyFeature.name) private myFeatureModel: Model<MyFeature>,
    private queryService: QueryService,
  ) {}

  async findAll(queryOptions: QueryOptionsDto) {
    return this.queryService.executeCursorPaginatedQuery(
      this.myFeatureModel,
      queryOptions,
    );
  }
}
```

### Implementing File Storage

Use StorageService to easily handle file uploads:

```typescript
import { Injectable } from '@nestjs/common';
import { StorageService } from '../../storage/storage.service';

@Injectable()
export class MyService {
  constructor(private storageService: StorageService) {}

  async uploadUserProfile(userId: string, file: Express.Multer.File) {
    const fileInfo = await this.storageService.storeFile(file, 'user-profiles');
    // Save file info to database
    return fileInfo;
  }
}
```

### Implementing Payments with Lemon Squeezy

Create a checkout session for a subscription or one-time payment:

```typescript
import { Injectable } from '@nestjs/common';
import { PaymentsService } from '../../database/payments/payments.service';
import { CreateCheckoutDto, CheckoutType } from '../../database/payments/dto/create-checkout.dto';

@Injectable()
export class SubscriptionService {
  constructor(private paymentsService: PaymentsService) {}

  async createSubscription(userId: string, email: string, name: string) {
    const checkoutDto: CreateCheckoutDto = {
      type: CheckoutType.SUBSCRIPTION,
      variantId: 'your_subscription_variant_id',
      email,
      name,
      successUrl: 'https://yourapp.com/subscription/success',
      customData: {
        userId,
        plan: 'premium'
      }
    };
    
    return this.paymentsService.createCheckout(userId, checkoutDto);
  }
}
```

## Tests

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

For production deployment:

1. Make sure environment variables are correctly configured
2. Build the application: `npm run build`
3. Use a process manager like PM2: `pm2 start dist/main.js --name api`

## Best Practices

1. **Respect NestJS modular architecture**
2. **Use DTOs** for input validation
3. **Document your endpoints** with Swagger
4. **Implement tests** for each feature
5. **Use global exception filters** to handle errors
6. **Follow forward references pattern** for circular dependencies
7. **Use proper error handling** for database operations

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Mongoose Documentation](https://mongoosejs.com/docs/guide.html)
- [JWT Documentation](https://jwt.io/introduction)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Lemon Squeezy API Documentation](https://docs.lemonsqueezy.com/api)
