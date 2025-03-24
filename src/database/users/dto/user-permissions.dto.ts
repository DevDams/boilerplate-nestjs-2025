import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UserPermissionsDto {
  @ApiProperty({
    description: 'List of permission identifiers for the user',
    example: ['read:users', 'read:own', 'update:own'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
} 