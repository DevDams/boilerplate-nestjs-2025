import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the role',
    example: '6123456789abcdef12345678',
  })
  _id: string;

  @ApiProperty({
    description: 'The name of the role',
    example: 'Admin',
  })
  name: string;

  @ApiProperty({
    description: 'Unique key identifier for the role',
    example: 'admin',
  })
  key: string;

  @ApiPropertyOptional({
    description: 'Description of what the role does',
    example: 'Administrator with full access',
  })
  description?: string;

  @ApiProperty({
    description: 'List of permissions assigned to this role',
    example: ['read:users', 'create:users', 'update:users', 'delete:users'],
    type: [String],
  })
  permissions: string[];

  @ApiProperty({
    description: 'Whether this is the default role for new users',
    example: false,
  })
  isDefault: boolean;

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

export class PaginatedRolesResponseDto {
  @ApiProperty({
    description: 'Array of roles',
    type: [RoleResponseDto],
  })
  data: RoleResponseDto[];

  @ApiPropertyOptional({
    description: 'Cursor for the next page of results',
    example: '60d21b4667d0d8992e610c85',
  })
  nextCursor: string | null;

  @ApiProperty({
    description: 'Total number of roles matching the query (without pagination)',
    example: 10,
  })
  total: number;
}

export class PagedRolesResponseDto {
  @ApiProperty({
    description: 'Array of roles',
    type: [RoleResponseDto],
  })
  data: RoleResponseDto[];

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Total number of roles matching the query',
    example: 10,
  })
  totalItems: number;
} 