# Example Entity Module

This is a template module demonstrating how to implement filtering, sorting, and pagination in NestJS with MongoDB. Use this as a starting point for creating new modules with these capabilities.

## Features

- **CRUD Operations**: Create, read, update, and delete entities
- **Advanced Filtering**: Filter by various criteria, including ranges and enums
- **Dual Pagination Options**:
  - Cursor-based pagination for optimal performance on large datasets
  - Traditional page-based pagination with page and size parameters
- **Field Selection**: Select which fields to return in the response
- **Sorting**: Sort results by any field in ascending or descending order
- **Swagger Documentation**: Comprehensive API documentation
- **Input Validation**: Proper validation using class-validator

## How to Use This Template

1. **Copy the Structure**: Duplicate this directory for your new module
   cp -r src/database/example-entity src/database/your-entity
2. **Rename Files**: Replace `example-entity` with your entity name
   - Replace all occurrences of "example-entity" with "your-entity"
   - Replace all occurrences of "ExampleEntity" with "YourEntity"
3. **Create Schema**: Define your entity schema in `src/database/schemas/`
   cp src/database/schemas/example-entity.schema.ts src/database/schemas/your-entity.schema.ts
4. **Update Imports**: Update imports in all files to match your module name
5. **Customize Fields**: Modify the DTOs to match your entity's fields
6. **Add to App Module**: Import your new module in the app.module.ts file

## Directory Structure

```
example-entity/
├── dto/
│   ├── create-example-entity.dto.ts    # Creation DTO
│   ├── update-example-entity.dto.ts    # Update DTO
│   ├── example-entity-query.dto.ts     # Query params DTOs
│   └── example-entity-response.dto.ts  # Response DTOs
├── example-entity.controller.ts        # Controller with endpoints
├── example-entity.module.ts            # Module configuration
├── example-entity.service.ts           # Business logic
└── README.md                           # This documentation
```

## Available Query Parameters

### Common to Both Pagination Types:

- **search**: Text search across title and description fields
- **isActive**: Filter by active status (boolean)
- **importance**: Filter by importance level (enum: 'low', 'medium', 'high')
- **minPriority/maxPriority**: Filter by priority range
- **dueDateBefore/dueDateAfter**: Filter by due date range
- **sortBy**: Field to sort by (any field in schema)
- **sortOrder**: Sort direction ('asc' or 'desc')
- **fields**: Comma-separated list of fields to return (projection)

### Cursor-Based Pagination (`/example-entities`):

- **limit**: Number of items per page
- **cursor**: ID of the last item from the previous page

### Page-Based Pagination (`/example-entities/paged`):

- **page**: Page number (starts at 1)
- **size**: Number of items per page

## Example Requests

### Cursor-based pagination with filtering

```
GET /example-entities?limit=10&importance=high&minPriority=5&sortBy=dueDate&sortOrder=asc
```

### Page-based pagination with filtering

```
GET /example-entities/paged?page=1&size=20&isActive=true&dueDateAfter=2023-01-01
```

### Get single entity with selected fields

```
GET /example-entities/60d21b4667d0d8992e610c85?fields=title,description,priority
```

## Tips for Implementation

1. **Entity-Specific Filters**: Add entity-specific filters in the `buildEntityFilters` method
2. **Validation**: Add proper validation to all DTOs
3. **Swagger Documentation**: Keep the API documentation up to date
4. **Indexes**: Add indexes on MongoDB fields used for filtering/sorting for optimal performance
5. **Error Handling**: Handle all possible error cases
