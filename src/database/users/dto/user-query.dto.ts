import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { QueryOptionsDto, PageQueryDto } from '../../../common/dto/query-options.dto';
import { UserRole } from '../../schemas/user.schema';

export class UserQueryDto extends QueryOptionsDto {
    @ApiPropertyOptional({
        description: 'Filter by active status',
        example: 'true',
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Filter by email verification status',
        example: 'true',
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    isEmailVerified?: boolean;
    
    @ApiPropertyOptional({
        description: 'Filter by role',
        enum: UserRole,
        example: UserRole.ADMIN,
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}

export class UserPageQueryDto extends PageQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by active status',
        example: 'true',
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Filter by email verification status',
        example: 'true',
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    isEmailVerified?: boolean;
    
    @ApiPropertyOptional({
        description: 'Filter by role',
        enum: UserRole,
        example: UserRole.ADMIN,
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
} 