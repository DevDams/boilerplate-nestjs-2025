import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'The name of the role',
    example: 'Content Manager',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Unique key identifier for the role',
    example: 'content-manager',
  })
  @IsString()
  key: string;

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
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
} 