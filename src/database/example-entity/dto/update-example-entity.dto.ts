import { PartialType } from '@nestjs/swagger';
import { CreateExampleEntityDto } from './create-example-entity.dto';

/**
 * DTO for updating an example entity
 * Makes all fields from CreateExampleEntityDto optional
 */
export class UpdateExampleEntityDto extends PartialType(CreateExampleEntityDto) {} 