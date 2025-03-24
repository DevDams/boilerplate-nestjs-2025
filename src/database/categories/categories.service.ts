import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryQueryDto } from './dto/category-query.dto';
import { QueryService } from '../../common/services/query.service';
import { PageQueryDto } from '../../common/dto/query-options.dto';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectModel(Category.name) private readonly categoryModel: Model<CategoryDocument>,
        private readonly queryService: QueryService
    ) { }

    async create(createCategoryDto: CreateCategoryDto): Promise<CategoryDocument> {
        const createdCategory = new this.categoryModel(createCategoryDto);
        return createdCategory.save();
    }

    async findAll(queryOptions: CategoryQueryDto = {}) {
        return this.findWithFilters(queryOptions);
    }

    async findOne(id: string, fields?: string): Promise<CategoryDocument | null> {
        const projection = fields ? this.buildProjection(fields) : {};
        return this.categoryModel.findById(id, projection).exec();
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryDocument | null> {
        return this.categoryModel.findByIdAndUpdate(
            id,
            updateCategoryDto,
            { new: true }
        ).exec();
    }

    async remove(id: string): Promise<CategoryDocument | null> {
        return this.categoryModel.findByIdAndDelete(id).exec();
    }

    /**
     * Find categories with advanced filtering, sorting, and pagination
     */
    async findWithFilters(queryOptions: CategoryQueryDto = {}) {
        // Build additional filters specific to CategoryQueryDto
        const additionalFilters: FilterQuery<Category> = {};

        // Apply minimum order filter
        if (queryOptions.minOrder !== undefined) {
            additionalFilters.order = additionalFilters.order || {};
            additionalFilters.order.$gte = queryOptions.minOrder;
        }

        // Apply maximum order filter
        if (queryOptions.maxOrder !== undefined) {
            additionalFilters.order = additionalFilters.order || {};
            additionalFilters.order.$lte = queryOptions.maxOrder;
        }

        // Use the query service for cursor-based pagination with type assertion
        // to bypass TypeScript's model type incompatibility
        return this.queryService.executeCursorPaginatedQuery(
            this.categoryModel as any,
            queryOptions,
            additionalFilters
        );
    }

    /**
     * Helper method to build MongoDB projection from fields string
     */
    private buildProjection(fields: string): Record<string, 1> {
        const fieldList = fields.split(',').map(field => field.trim());
        const projection: Record<string, 1> = {};

        fieldList.forEach(field => {
            projection[field] = 1;
        });

        return projection;
    }

    /**
     * Find categories with standard page-based pagination
     */
    async findWithPagePagination(queryOptions: PageQueryDto) {
        // Build additional filters specific to CategoryQueryDto
        const additionalFilters: FilterQuery<Category> = {};

        // Apply category-specific filters if available
        if ('minOrder' in queryOptions && queryOptions.minOrder !== undefined) {
            additionalFilters.order = additionalFilters.order || {};
            additionalFilters.order.$gte = queryOptions.minOrder;
        }

        if ('maxOrder' in queryOptions && queryOptions.maxOrder !== undefined) {
            additionalFilters.order = additionalFilters.order || {};
            additionalFilters.order.$lte = queryOptions.maxOrder;
        }

        // Use the query service for page-based pagination
        return this.queryService.executePagedQuery(
            this.categoryModel as any,
            queryOptions,
            additionalFilters
        );
    }
} 