import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
    IsString, 
    IsOptional, 
    IsBoolean, 
    IsEnum, 
    IsDateString, 
    IsNumber, 
    Min, 
    Max, 
    IsObject 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ImportanceLevel } from './example-entity-query.dto';

/**
 * DTO for creating a new example entity
 */
export class CreateExampleEntityDto {
    @ApiProperty({
        description: 'Title of the entity',
        example: 'Example Title',
    })
    @IsString()
    title: string;

    @ApiPropertyOptional({
        description: 'Description of the entity',
        example: 'This is an example description',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        description: 'Whether the entity is active',
        example: true,
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'Priority level (0-100)',
        example: 10,
        default: 0,
    })
    @IsNumber()
    @Min(0)
    @Max(100)
    @IsOptional()
    priority?: number;

    @ApiPropertyOptional({
        description: 'Due date for the entity',
        example: '2023-12-31T23:59:59Z',
    })
    @IsDateString()
    @IsOptional()
    dueDate?: string;

    @ApiPropertyOptional({
        description: 'Number of views',
        example: 0,
        default: 0,
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    viewCount?: number;

    @ApiPropertyOptional({
        description: 'Importance level',
        enum: ImportanceLevel,
        example: ImportanceLevel.MEDIUM,
        default: ImportanceLevel.MEDIUM,
    })
    @IsEnum(ImportanceLevel)
    @IsOptional()
    importance?: ImportanceLevel;

    @ApiPropertyOptional({
        description: 'Additional metadata',
        example: { category: 'example', tags: ['test', 'demo'] },
    })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
} 