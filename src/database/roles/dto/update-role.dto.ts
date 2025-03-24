import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsBoolean, IsOptional, MinLength } from 'class-validator';
import { Permission } from '../../schemas/user.schema';

export class UpdateRoleDto {
  @ApiPropertyOptional({
    description: 'The name of the role',
    example: 'Content Manager',
  })
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Unique key identifier for the role',
    example: 'content-manager',
  })
  @IsString()
  @IsOptional()
  key?: string;

  @ApiPropertyOptional({
    description: 'Description of what the role does',
    example: 'Can manage all content in the system',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'List of permission keys assigned to this role',
    example: ['read:users', 'update:content', 'publish:content'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Whether this is the default role for new users',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
} 