import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
    @ApiProperty({
        description: 'Category ID',
        example: '60d21b4667d0d8992e610c85',
    })
    _id: string;

    @ApiProperty({
        description: 'Name of the category',
        example: 'Electronics',
    })
    name: string;

    @ApiPropertyOptional({
        description: 'Description of the category',
        example: 'Electronic devices and accessories',
    })
    description?: string;

    @ApiProperty({
        description: 'Whether the category is active',
        example: true,
    })
    isActive: boolean;

    @ApiProperty({
        description: 'Order of the category (for display purposes)',
        example: 1,
    })
    order: number;

    @ApiPropertyOptional({
        description: 'URL to the category image',
        example: 'https://example.com/images/electronics.jpg',
    })
    imageUrl?: string;

    @ApiPropertyOptional({
        description: 'Additional metadata for the category',
        example: { featured: true, color: '#FF5733' },
    })
    metadata?: Record<string, any>;

    @ApiProperty({
        description: 'Creation date',
        example: '2023-01-01T00:00:00.000Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Last update date',
        example: '2023-01-01T00:00:00.000Z',
    })
    updatedAt: Date;
}

export class PaginatedCategoriesResponseDto {
    @ApiProperty({
        description: 'Array of categories',
        type: [CategoryResponseDto],
    })
    data: CategoryResponseDto[];

    @ApiPropertyOptional({
        description: 'Cursor for the next page of results',
        example: '60d21b4667d0d8992e610c85',
    })
    nextCursor: string | null;

    @ApiProperty({
        description: 'Total number of categories matching the query (without pagination)',
        example: 42,
    })
    total: number;
}

export class PagedCategoriesResponseDto {
    @ApiProperty({
        description: 'Array of categories',
        type: [CategoryResponseDto],
    })
    data: CategoryResponseDto[];

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
        description: 'Total number of categories matching the query',
        example: 42,
    })
    totalItems: number;
} 