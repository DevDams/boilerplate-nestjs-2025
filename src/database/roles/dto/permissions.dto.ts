import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class PermissionsDto {
  @ApiProperty({
    description: 'List of permission identifiers',
    example: ['read:users', 'create:users', 'update:own'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
} 