import { Injectable } from '@nestjs/common';
import { FilterQuery, Model, Document, ProjectionType } from 'mongoose';
import { QueryOptionsDto, SortOrder, PageQueryDto } from '../dto/query-options.dto';

@Injectable()
export class QueryService {
    /**
     * Build a MongoDB filter query based on query parameters
     */
    buildFilterQuery<T>(queryOptions: any, additionalFilters: FilterQuery<T> = {}): FilterQuery<T> {
        const filter = { ...additionalFilters } as FilterQuery<T>;

        // Handle search parameter
        if (queryOptions.search && typeof queryOptions.search === 'string') {
            filter['$or'] = [
                { name: { $regex: queryOptions.search, $options: 'i' } },
                { description: { $regex: queryOptions.search, $options: 'i' } }
            ];
        }

        // Handle active status filter
        if (queryOptions.isActive !== undefined) {
            (filter as any).isActive = queryOptions.isActive;
        }

        return filter;
    }

    /**
     * Build a MongoDB cursor-based query
     */
    buildCursorQuery<T>(
        queryOptions: QueryOptionsDto,
        additionalFilters: FilterQuery<T> = {},
        lastItem?: Record<string, any> | null
    ): FilterQuery<T> {
        const filter = this.buildFilterQuery<T>(queryOptions, additionalFilters);

        // Add cursor-based filtering if a cursor is provided
        if (queryOptions.cursor && lastItem) {
            const sortField = queryOptions.sortBy || 'createdAt';
            const sortOrder = queryOptions.sortOrder || SortOrder.DESC;

            // Build the cursor query based on sort direction
            if (sortOrder === SortOrder.DESC) {
                (filter as any)[sortField] = { $lt: lastItem[sortField] };
            } else {
                (filter as any)[sortField] = { $gt: lastItem[sortField] };
            }
        }

        return filter;
    }

    /**
     * Build sort options for MongoDB query
     */
    buildSortOptions(queryOptions: QueryOptionsDto): Record<string, 1 | -1> {
        const sortField = queryOptions.sortBy || 'createdAt';
        const sortOrder = queryOptions.sortOrder === SortOrder.ASC ? 1 : -1;

        return { [sortField]: sortOrder };
    }

    /**
     * Build projection options for MongoDB query
     */
    buildProjection<T>(queryOptions: QueryOptionsDto): ProjectionType<T> {
        if (!queryOptions.fields) return {} as ProjectionType<T>;

        const fields = queryOptions.fields.split(',').map(field => field.trim());
        const projection: Record<string, 1> = {};

        fields.forEach(field => {
            projection[field] = 1;
        });

        return projection as ProjectionType<T>;
    }

    /**
     * Execute a cursor-based paginated query
     */
    async executeCursorPaginatedQuery<T extends Document>(
        model: Model<T>,
        queryOptions: QueryOptionsDto,
        additionalFilters: FilterQuery<T> = {}
    ): Promise<{ data: T[]; nextCursor: string | null; total: number }> {
        const limit = queryOptions.limit || 10;
        let lastItem: Record<string, any> | null = null;

        // If cursor is provided, fetch the last item to use for comparison
        if (queryOptions.cursor) {
            const item = await model.findById(queryOptions.cursor).exec();
            if (item) {
                lastItem = item.toObject();
            }
        }

        // Build the filter query based on cursor and other filters
        const filter = this.buildCursorQuery<T>(queryOptions, additionalFilters, lastItem);
        const sort = this.buildSortOptions(queryOptions);
        const projection = this.buildProjection<T>(queryOptions);

        // Execute the query
        const data = await model
            .find(filter, projection)
            .sort(sort)
            .limit(limit + 1) // Get one extra to determine if there are more results
            .exec();

        // Determine if there are more results and calculate the next cursor
        const hasMore = data.length > limit;
        const results = hasMore ? data.slice(0, limit) : data;

        // Get the next cursor from the last item in results
        let nextCursor: string | null = null;
        if (hasMore && results.length > 0) {
            const lastResultItem = results[results.length - 1];
            if (lastResultItem._id) {
                nextCursor = lastResultItem._id.toString();
            }
        }

        // Get total count (for informational purposes)
        const total = await model.countDocuments(this.buildFilterQuery<T>(queryOptions, additionalFilters)).exec();

        return {
            data: results,
            nextCursor,
            total
        };
    }

    /**
     * Execute a standard pagination query using page and size
     */
    async executePagedQuery<T extends Document>(
        model: Model<T>,
        queryOptions: PageQueryDto,
        additionalFilters: FilterQuery<T> = {}
    ): Promise<{ data: T[]; totalPages: number; currentPage: number; totalItems: number }> {
        const page = queryOptions.page || 1;
        const size = queryOptions.size || 10;
        const skip = (page - 1) * size;
        
        // Build the filter query based on filters
        const filter = this.buildFilterQuery<T>(queryOptions, additionalFilters);
        const sort = this.buildSortOptions(queryOptions);
        const projection = this.buildProjection<T>(queryOptions);
        
        // Execute the query
        const data = await model
            .find(filter, projection)
            .sort(sort)
            .skip(skip)
            .limit(size)
            .exec();
        
        // Get total count for pagination info
        const totalItems = await model.countDocuments(filter).exec();
        const totalPages = Math.ceil(totalItems / size);
        
        return {
            data,
            currentPage: page,
            totalPages,
            totalItems
        };
    }
} 