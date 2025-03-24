import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './database/users/users.module';
import { RolesModule } from './database/roles/roles.module';
import { CategoriesModule } from './database/categories/categories.module';
import { ExampleEntityModule } from './database/example-entity/example-entity.module';
import { PaymentsModule } from './database/payments/payments.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { GlobalAuthGuard } from './common/guards/global-auth.guard';
import { StorageModule } from './storage/storage.module';
import { TasksService } from './common/services/tasks.service';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    UsersModule,
    RolesModule,
    CategoriesModule,
    ExampleEntityModule,
    PaymentsModule,
    AuthModule,
    CommonModule,
    StorageModule.forRoot(), // Use local storage by default
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TasksService,
    {
      provide: APP_GUARD,
      useClass: GlobalAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the RequestIdMiddleware to all routes
    consumer.apply(RequestIdMiddleware).forRoutes('*path');
  }
}
