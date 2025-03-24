import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '../../schemas/user.schema';

export class UserRoleDto {
  @ApiProperty({
    description: 'The role to assign to the user',
    enum: UserRole,
    example: 'admin',
  })
  @IsEnum(UserRole)
  role: UserRole;
} 