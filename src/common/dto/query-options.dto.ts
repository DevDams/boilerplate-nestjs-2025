import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min, IsArray, ValidateNested, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export class PaginationDto {
    @ApiPropertyOptional({
        description: 'Number of items to return (default: 10, max: 100)',
        default: 10,
        minimum: 1,
        maximum: 100,
    })
    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Cursor for pagination (usually an ID or timestamp from the last item)',
    })
    @IsString()
    @IsOptional()
    cursor?: string;
}

export class SortingDto {
    @ApiPropertyOptional({
        description: 'Field to sort by',
        example: 'createdAt',
    })
    @IsString()
    @IsOptional()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        description: 'Sort order',
        enum: SortOrder,
        default: SortOrder.DESC,
    })
    @IsEnum(SortOrder)
    @IsOptional()
    sortOrder?: SortOrder = SortOrder.DESC;
}

export class FieldSelectionDto {
    @ApiPropertyOptional({
        description: 'Fields to include in the response (comma-separated)',
        example: 'name,description,createdAt',
    })
    @IsString()
    @IsOptional()
    fields?: string;
}

export class FilterDto {
    @ApiPropertyOptional({
        description: 'Search term to filter results',
    })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiPropertyOptional({
        description: 'Show only active items',
        default: true,
    })
    @IsOptional()
    @Type(() => Boolean)
    isActive?: boolean;
}

export class QueryOptionsDto extends PaginationDto {
    @ApiPropertyOptional({
        description: 'Field to sort by',
        example: 'createdAt',
    })
    @IsString()
    @IsOptional()
    sortBy?: string = 'createdAt';

    @ApiPropertyOptional({
        description: 'Sort order',
        enum: SortOrder,
        default: SortOrder.DESC,
    })
    @IsEnum(SortOrder)
    @IsOptional()
    sortOrder?: SortOrder = SortOrder.DESC;

    @ApiPropertyOptional({
        description: 'Fields to include in the response (comma-separated)',
        example: 'name,description,createdAt',
    })
    @IsString()
    @IsOptional()
    fields?: string;

    @ApiPropertyOptional({
        description: 'Search term to filter results',
    })
    @IsString()
    @IsOptional()
    search?: string;
}

export class PageQueryDto extends QueryOptionsDto {
    @ApiProperty({
        description: 'Page number (starts at 1)',
        required: false,
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @ApiProperty({
        description: 'Number of items per page',
        required: false,
        default: 10,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100) // Reasonable limit to prevent performance issues
    @Type(() => Number)
    size?: number = 10;
} 