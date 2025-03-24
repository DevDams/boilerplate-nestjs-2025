import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    NotFoundException,
    HttpStatus,
    UseGuards
} from '@nestjs/common';
import { ExampleEntityService } from './example-entity.service';
import { CreateExampleEntityDto } from './dto/create-example-entity.dto';
import { UpdateExampleEntityDto } from './dto/update-example-entity.dto';
import { ExampleEntityQueryDto, ExampleEntityPageQueryDto } from './dto/example-entity-query.dto';
import { 
    ExampleEntityResponseDto, 
    PaginatedExampleEntitiesResponseDto, 
    PagedExampleEntitiesResponseDto 
} from './dto/example-entity-response.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
    ApiBearerAuth,
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiNotFoundResponse,
    ApiQuery
} from '@nestjs/swagger';

@ApiTags('example-entities')
@ApiBearerAuth('JWT-auth')
@Controller('example-entities')
@UseGuards(RolesGuard, PermissionsGuard)
export class ExampleEntityController {
    constructor(private readonly exampleEntityService: ExampleEntityService) {}

    @Post()
    @RequirePermissions('create:example-entities')
    @ApiOperation({ summary: 'Create entity', description: 'Creates a new example entity' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Entity created successfully',
        type: ExampleEntityResponseDto
    })
    async create(@Body() createExampleEntityDto: CreateExampleEntityDto) {
        return this.exampleEntityService.create(createExampleEntityDto);
    }

    @Get()
    @RequirePermissions('read:example-entities')
    @ApiOperation({
        summary: 'Get all entities with cursor-based pagination',
        description: 'Returns a paginated list of entities with filtering, sorting, and cursor-based pagination'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Entities retrieved successfully',
        type: PaginatedExampleEntitiesResponseDto
    })
    async findAll(@Query() query: ExampleEntityQueryDto) {
        return this.exampleEntityService.findWithFilters(query);
    }

    @Get('paged')
    @RequirePermissions('read:example-entities')
    @ApiOperation({
        summary: 'Get all entities with page-based pagination',
        description: 'Returns a paginated list of entities using standard page and size parameters'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Entities retrieved successfully',
        type: PagedExampleEntitiesResponseDto
    })
    async findAllPaged(@Query() query: ExampleEntityPageQueryDto) {
        return this.exampleEntityService.findWithPagePagination(query);
    }

    @Get(':id')
    @RequirePermissions('read:example-entities')
    @ApiOperation({ summary: 'Get an entity by ID', description: 'Returns a single entity by ID' })
    @ApiParam({ name: 'id', description: 'The ID of the entity to retrieve' })
    @ApiQuery({
        name: 'fields',
        required: false,
        description: 'Comma-separated list of fields to include in the response',
        example: 'title,description,isActive'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Entity retrieved successfully',
        type: ExampleEntityResponseDto
    })
    @ApiNotFoundResponse({ description: 'Entity not found' })
    async findOne(
        @Param('id') id: string,
        @Query('fields') fields?: string
    ) {
        const entity = await this.exampleEntityService.findOne(id, fields);
        if (!entity) {
            throw new NotFoundException(`Entity with ID ${id} not found`);
        }
        return entity;
    }

    @Patch(':id')
    @RequirePermissions('update:example-entities')
    @ApiOperation({ summary: 'Update an entity', description: 'Updates an entity by ID' })
    @ApiParam({ name: 'id', description: 'The ID of the entity to update' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Entity updated successfully',
        type: ExampleEntityResponseDto
    })
    @ApiNotFoundResponse({ description: 'Entity not found' })
    async update(
        @Param('id') id: string,
        @Body() updateExampleEntityDto: UpdateExampleEntityDto
    ) {
        const updatedEntity = await this.exampleEntityService.update(id, updateExampleEntityDto);
        if (!updatedEntity) {
            throw new NotFoundException(`Entity with ID ${id} not found`);
        }
        return updatedEntity;
    }

    @Delete(':id')
    @RequirePermissions('delete:example-entities')
    @ApiOperation({ summary: 'Delete an entity', description: 'Deletes an entity by ID' })
    @ApiParam({ name: 'id', description: 'The ID of the entity to delete' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Entity deleted successfully',
        type: ExampleEntityResponseDto
    })
    @ApiNotFoundResponse({ description: 'Entity not found' })
    async remove(@Param('id') id: string) {
        const deletedEntity = await this.exampleEntityService.remove(id);
        if (!deletedEntity) {
            throw new NotFoundException(`Entity with ID ${id} not found`);
        }
        return deletedEntity;
    }
} 