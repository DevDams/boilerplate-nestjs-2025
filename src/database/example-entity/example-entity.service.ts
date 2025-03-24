import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { ExampleEntity, ExampleEntityDocument } from '../schemas/example-entity.schema';
import { CreateExampleEntityDto } from './dto/create-example-entity.dto';
import { UpdateExampleEntityDto } from './dto/update-example-entity.dto';
import { ExampleEntityQueryDto, ExampleEntityPageQueryDto } from './dto/example-entity-query.dto';
import { QueryService } from '../../common/services/query.service';

@Injectable()
export class ExampleEntityService {
    constructor(
        @InjectModel(ExampleEntity.name) private exampleEntityModel: Model<ExampleEntityDocument>,
        private readonly queryService: QueryService
    ) {}

    /**
     * Create a new example entity
     */
    async create(createExampleEntityDto: CreateExampleEntityDto): Promise<ExampleEntityDocument> {
        const createdEntity = new this.exampleEntityModel(createExampleEntityDto);
        return createdEntity.save();
    }

    /**
     * Find all example entities with basic filtering
     */
    async findAll(): Promise<ExampleEntityDocument[]> {
        return this.exampleEntityModel.find().exec();
    }

    /**
     * Find a single example entity by ID
     */
    async findOne(id: string, fields?: string): Promise<ExampleEntityDocument | null> {
        const projection = fields ? this.buildProjection(fields) : {};
        return this.exampleEntityModel.findById(id, projection).exec();
    }

    /**
     * Update an example entity
     */
    async update(id: string, updateExampleEntityDto: UpdateExampleEntityDto): Promise<ExampleEntityDocument | null> {
        return this.exampleEntityModel.findByIdAndUpdate(
            id,
            updateExampleEntityDto,
            { new: true }
        ).exec();
    }

    /**
     * Remove an example entity
     */
    async remove(id: string): Promise<ExampleEntityDocument | null> {
        return this.exampleEntityModel.findByIdAndDelete(id).exec();
    }

    /**
     * Find example entities with advanced filtering, sorting, and cursor-based pagination
     */
    async findWithFilters(queryOptions: ExampleEntityQueryDto = {}) {
        // Build additional filters specific to ExampleEntityQueryDto
        const additionalFilters = this.buildEntityFilters(queryOptions);

        // Use the query service for cursor-based pagination
        return this.queryService.executeCursorPaginatedQuery(
            this.exampleEntityModel as any,
            queryOptions,
            additionalFilters
        );
    }

    /**
     * Find example entities with standard page-based pagination
     */
    async findWithPagePagination(queryOptions: ExampleEntityPageQueryDto) {
        // Build additional filters specific to ExampleEntityQueryDto
        const additionalFilters = this.buildEntityFilters(queryOptions);

        // Use the query service for page-based pagination
        return this.queryService.executePagedQuery(
            this.exampleEntityModel as any,
            queryOptions,
            additionalFilters
        );
    }

    /**
     * Helper method to build entity-specific filters
     */
    private buildEntityFilters(queryOptions: ExampleEntityQueryDto | ExampleEntityPageQueryDto): FilterQuery<ExampleEntity> {
        const additionalFilters: FilterQuery<ExampleEntity> = {};

        // Apply priority range filters
        if (queryOptions.minPriority !== undefined) {
            additionalFilters.priority = additionalFilters.priority || {};
            additionalFilters.priority.$gte = queryOptions.minPriority;
        }

        if (queryOptions.maxPriority !== undefined) {
            additionalFilters.priority = additionalFilters.priority || {};
            additionalFilters.priority.$lte = queryOptions.maxPriority;
        }

        // Apply importance filter
        if (queryOptions.importance !== undefined) {
            additionalFilters.importance = queryOptions.importance;
        }

        // Apply due date range filters
        if (queryOptions.dueDateAfter !== undefined) {
            additionalFilters.dueDate = additionalFilters.dueDate || {};
            additionalFilters.dueDate.$gte = new Date(queryOptions.dueDateAfter);
        }

        if (queryOptions.dueDateBefore !== undefined) {
            additionalFilters.dueDate = additionalFilters.dueDate || {};
            additionalFilters.dueDate.$lte = new Date(queryOptions.dueDateBefore);
        }

        return additionalFilters;
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
} 