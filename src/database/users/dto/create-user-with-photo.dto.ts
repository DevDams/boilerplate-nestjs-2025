import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../schemas/user.schema';

export class CreateUserWithPhotoDto {
    @ApiProperty({ example: 'John Doe' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 'john@example.com' })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({ required: false, example: 'password123' })
    @IsOptional()
    @IsString()
    password?: string;

    @ApiProperty({
        required: false,
        enum: UserRole,
        example: UserRole.USER
    })
    @IsOptional()
    role?: UserRole;

    @ApiProperty({ required: false, type: [String], example: ['60a1b456c95f2c0012345678'] })
    @IsOptional()
    roles?: string[];

    @ApiProperty({ required: false, type: [String], example: ['read:users', 'update:own'] })
    @IsOptional()
    permissions?: string[];

    // The photo file will be handled by the controller's file interceptor
} 