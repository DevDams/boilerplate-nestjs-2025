import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { TokenBlacklistModule } from './token-blacklist/token-blacklist.module';
import { CategoriesModule } from './categories/categories.module';
import { PaymentsModule } from './payments/payments.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('mongodb.uri');
        const user = configService.get<string>('mongodb.user');
        const password = configService.get<string>('mongodb.password');
        const host = configService.get<string>('mongodb.host');
        const port = configService.get<number>('mongodb.port');
        const database = configService.get<string>('mongodb.database');

        // If user and password are provided, use them in the connection string
        const authUrl = user && password
          ? `mongodb://${user}:${password}@${host}:${port}/${database}`
          : uri;

        return {
          uri: authUrl,
        };
      },
    }),
    UsersModule,
    RolesModule,
    TokenBlacklistModule,
    CategoriesModule,
    PaymentsModule,
    forwardRef(() => CommonModule),
  ],
  exports: [
    MongooseModule, 
    UsersModule, 
    RolesModule, 
    TokenBlacklistModule, 
    CategoriesModule,
    PaymentsModule,
  ],
})
export class DatabaseModule { } 