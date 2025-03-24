import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UserRolesDto {
  @ApiProperty({
    description: 'List of role IDs to assign to the user',
    example: ['6123456789abcdef12345678', '6123456789abcdef12345679'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];
} 