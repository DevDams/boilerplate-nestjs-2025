import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { QueryOptionsDto, PageQueryDto } from '../../../common/dto/query-options.dto';

/**
 * Enum for importance levels
 */
export enum ImportanceLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
}

/**
 * DTO for cursor-based pagination with entity-specific filters
 */
export class ExampleEntityQueryDto extends QueryOptionsDto {
    @ApiPropertyOptional({
        description: 'Filter by active status',
        example: 'true',
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Filter by minimum priority',
        example: 1,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    minPriority?: number;

    @ApiPropertyOptional({
        description: 'Filter by maximum priority',
        example: 10,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    maxPriority?: number;

    @ApiPropertyOptional({
        description: 'Filter by importance level',
        enum: ImportanceLevel,
        example: ImportanceLevel.HIGH,
    })
    @IsOptional()
    @IsEnum(ImportanceLevel)
    importance?: ImportanceLevel;

    @ApiPropertyOptional({
        description: 'Filter by due date before (ISO format)',
        example: '2023-12-31T23:59:59Z',
    })
    @IsOptional()
    @IsDateString()
    dueDateBefore?: string;

    @ApiPropertyOptional({
        description: 'Filter by due date after (ISO format)',
        example: '2023-01-01T00:00:00Z',
    })
    @IsOptional()
    @IsDateString()
    dueDateAfter?: string;
}

/**
 * DTO for page-based pagination with entity-specific filters
 */
export class ExampleEntityPageQueryDto extends PageQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by active status',
        example: 'true',
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Filter by minimum priority',
        example: 1,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    minPriority?: number;

    @ApiPropertyOptional({
        description: 'Filter by maximum priority',
        example: 10,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    maxPriority?: number;

    @ApiPropertyOptional({
        description: 'Filter by importance level',
        enum: ImportanceLevel,
        example: ImportanceLevel.HIGH,
    })
    @IsOptional()
    @IsEnum(ImportanceLevel)
    importance?: ImportanceLevel;

    @ApiPropertyOptional({
        description: 'Filter by due date before (ISO format)',
        example: '2023-12-31T23:59:59Z',
    })
    @IsOptional()
    @IsDateString()
    dueDateBefore?: string;

    @ApiPropertyOptional({
        description: 'Filter by due date after (ISO format)',
        example: '2023-01-01T00:00:00Z',
    })
    @IsOptional()
    @IsDateString()
    dueDateAfter?: string;
} 