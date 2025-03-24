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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto, CategoryPageQueryDto } from './dto/category-query.dto';
import {
    CategoryResponseDto,
    PaginatedCategoriesResponseDto,
    PagedCategoriesResponseDto
} from './dto/category-response.dto';
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

@ApiTags('categories')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
@UseGuards(RolesGuard, PermissionsGuard)
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    @RequirePermissions('create:categories')
    @ApiOperation({ summary: 'Create category', description: 'Creates a new category' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Category created successfully',
        type: CategoryResponseDto
    })
    async create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }

    @Get()
    @RequirePermissions('read:categories')
    @ApiOperation({
        summary: 'Get all categories',
        description: 'Returns a paginated list of categories with filtering, sorting, and field selection'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Categories retrieved successfully',
        type: PaginatedCategoriesResponseDto
    })
    async findAll(@Query() query: CategoryQueryDto) {
        return this.categoriesService.findAll(query);
    }

    @Get(':id')
    @RequirePermissions('read:categories')
    @ApiOperation({ summary: 'Get a category by ID', description: 'Returns a single category by ID' })
    @ApiParam({ name: 'id', description: 'The ID of the category to retrieve' })
    @ApiQuery({
        name: 'fields',
        required: false,
        description: 'Comma-separated list of fields to include in the response',
        example: 'name,description,isActive'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Category retrieved successfully',
        type: CategoryResponseDto
    })
    @ApiNotFoundResponse({ description: 'Category not found' })
    async findOne(
        @Param('id') id: string,
        @Query('fields') fields?: string
    ) {
        const category = await this.categoriesService.findOne(id, fields);
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return category;
    }

    @Patch(':id')
    @RequirePermissions('update:categories')
    @ApiOperation({ summary: 'Update a category', description: 'Updates a category by ID' })
    @ApiParam({ name: 'id', description: 'The ID of the category to update' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Category updated successfully',
        type: CategoryResponseDto
    })
    @ApiNotFoundResponse({ description: 'Category not found' })
    async update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto
    ) {
        const updatedCategory = await this.categoriesService.update(id, updateCategoryDto);
        if (!updatedCategory) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return updatedCategory;
    }

    @Delete(':id')
    @RequirePermissions('delete:categories')
    @ApiOperation({ summary: 'Delete a category', description: 'Deletes a category by ID' })
    @ApiParam({ name: 'id', description: 'The ID of the category to delete' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Category deleted successfully',
        type: CategoryResponseDto
    })
    @ApiNotFoundResponse({ description: 'Category not found' })
    async remove(@Param('id') id: string) {
        const deletedCategory = await this.categoriesService.remove(id);
        if (!deletedCategory) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return deletedCategory;
    }

    @Get('paged')
    @RequirePermissions('read:categories')
    @ApiOperation({
        summary: 'Get all categories with page-based pagination',
        description: 'Returns a paginated list of categories using standard page and size parameters'
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Categories retrieved successfully',
        type: PagedCategoriesResponseDto
    })
    async findAllPaged(@Query() query: CategoryPageQueryDto) {
        return this.categoriesService.findWithPagePagination(query);
    }
} 