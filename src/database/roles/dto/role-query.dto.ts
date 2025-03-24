import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { QueryOptionsDto, PageQueryDto } from '../../../common/dto/query-options.dto';

export class RoleQueryDto extends QueryOptionsDto {
    @ApiPropertyOptional({
        description: 'Filter by default role status',
        example: 'true',
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    isDefault?: boolean;

    @ApiPropertyOptional({
        description: 'Filter by system role status',
        example: 'true',
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    isSystem?: boolean;
}

export class RolePageQueryDto extends PageQueryDto {
    @ApiPropertyOptional({
        description: 'Filter by default role status',
        example: 'true',
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    isDefault?: boolean;

    @ApiPropertyOptional({
        description: 'Filter by system role status',
        example: 'true',
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    isSystem?: boolean;
} 