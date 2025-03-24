import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryOptionsDto, PageQueryDto } from '../../../common/dto/query-options.dto';

export class CategoryQueryDto extends QueryOptionsDto {
    @ApiPropertyOptional({
        description: 'Filter by minimum order value',
    })
    @IsOptional()
    @Type(() => Number)
    minOrder?: number;

    @ApiPropertyOptional({
        description: 'Filter by maximum order value',
    })
    @IsOptional()
    @Type(() => Number)
    maxOrder?: number;
}

export class CategoryPageQueryDto extends PageQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by minimum order value',
    })
    @IsOptional()
    @Type(() => Number)
    minOrder?: number;

    @ApiPropertyOptional({
        description: 'Filter by maximum order value',
    })
    @IsOptional()
    @Type(() => Number)
    maxOrder?: number;
} 