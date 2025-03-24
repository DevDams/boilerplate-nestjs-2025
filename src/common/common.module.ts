import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { GlobalAuthGuard } from './guards/global-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { PasswordValidator } from './utils/password-validator.util';
import { TokenService } from './services/token.service';
import { TasksService } from './services/tasks.service';
import { QueryService } from './services/query.service';

@Module({
  imports: [
    forwardRef(() => DatabaseModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'super-secret-key',
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '1d',
        },
      }),
    }),
  ],
  providers: [
    EmailService,
    GlobalAuthGuard,
    RolesGuard,
    PermissionsGuard,
    PasswordValidator,
    TokenService,
    TasksService,
    QueryService
  ],
  exports: [
    EmailService,
    GlobalAuthGuard,
    RolesGuard,
    PermissionsGuard,
    JwtModule,
    PasswordValidator,
    TokenService,
    TasksService,
    QueryService
  ],
})
export class CommonModule { } 