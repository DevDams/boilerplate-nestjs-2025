import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImportanceLevel } from './example-entity-query.dto';

/**
 * Response DTO for a single example entity
 */
export class ExampleEntityResponseDto {
    @ApiProperty({
        description: 'Entity ID',
        example: '60d21b4667d0d8992e610c85',
    })
    _id: string;

    @ApiProperty({
        description: 'Title of the entity',
        example: 'Example Title',
    })
    title: string;

    @ApiPropertyOptional({
        description: 'Description of the entity',
        example: 'This is an example description',
    })
    description?: string;

    @ApiProperty({
        description: 'Whether the entity is active',
        example: true,
    })
    isActive: boolean;

    @ApiProperty({
        description: 'Priority level (0-100)',
        example: 10,
    })
    priority: number;

    @ApiPropertyOptional({
        description: 'Due date for the entity',
        example: '2023-12-31T23:59:59Z',
    })
    dueDate?: Date;

    @ApiProperty({
        description: 'Number of views',
        example: 42,
    })
    viewCount: number;

    @ApiProperty({
        description: 'Importance level',
        enum: ImportanceLevel,
        example: ImportanceLevel.MEDIUM,
    })
    importance: ImportanceLevel;

    @ApiPropertyOptional({
        description: 'Additional metadata',
        example: { category: 'example', tags: ['test', 'demo'] },
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

/**
 * Response DTO for cursor-based pagination
 */
export class PaginatedExampleEntitiesResponseDto {
    @ApiProperty({
        description: 'Array of example entities',
        type: [ExampleEntityResponseDto],
    })
    data: ExampleEntityResponseDto[];

    @ApiPropertyOptional({
        description: 'Cursor for the next page of results',
        example: '60d21b4667d0d8992e610c85',
    })
    nextCursor: string | null;

    @ApiProperty({
        description: 'Total number of entities matching the query',
        example: 42,
    })
    total: number;
}

/**
 * Response DTO for page-based pagination
 */
export class PagedExampleEntitiesResponseDto {
    @ApiProperty({
        description: 'Array of example entities',
        type: [ExampleEntityResponseDto],
    })
    data: ExampleEntityResponseDto[];

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
        description: 'Total number of entities matching the query',
        example: 42,
    })
    totalItems: number;
} 