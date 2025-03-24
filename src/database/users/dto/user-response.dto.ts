import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../schemas/user.schema';
import { RoleResponseDto } from '../../roles/dto/role-response.dto';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the user',
    example: '6123456789abcdef12345678',
  })
  _id: string;

  @ApiProperty({
    description: 'The name of the user',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Whether the user is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether the user email is verified',
    example: true,
  })
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'Legacy role of the user',
    enum: UserRole,
    example: 'user',
  })
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Roles assigned to the user',
    type: [RoleResponseDto],
  })
  roles?: RoleResponseDto[];

  @ApiPropertyOptional({
    description: 'Direct permissions assigned to the user',
    example: ['read:own', 'update:own'],
    type: [String],
  })
  permissions?: string[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-04-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-04-01T12:00:00.000Z',
  })
  updatedAt: Date;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({
    description: 'Array of users',
    type: [UserResponseDto],
  })
  data: UserResponseDto[];

  @ApiPropertyOptional({
    description: 'Cursor for the next page of results',
    example: '60d21b4667d0d8992e610c85',
  })
  nextCursor: string | null;

  @ApiProperty({
    description: 'Total number of users matching the query (without pagination)',
    example: 42,
  })
  total: number;
}

export class PagedUsersResponseDto {
  @ApiProperty({
    description: 'Array of users',
    type: [UserResponseDto],
  })
  data: UserResponseDto[];

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Total number of users matching the query',
    example: 42,
  })
  totalItems: number;
} 