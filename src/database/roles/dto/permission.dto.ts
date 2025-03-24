import { IsArray, IsNotEmpty } from 'class-validator';
import { Permission } from '../../schemas/user.schema';

export class PermissionDto {
  @IsArray()
  @IsNotEmpty()
  permissions: Permission[];
} 