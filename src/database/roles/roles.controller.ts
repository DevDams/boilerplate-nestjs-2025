import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    NotFoundException,
    BadRequestException,
    UseGuards,
    HttpStatus
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { Role } from '../schemas/role.schema';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PermissionsDto } from './dto/permissions.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import {
    ApiBearerAuth,
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiNotFoundResponse,
    ApiBadRequestResponse
} from '@nestjs/swagger';

@ApiTags('roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
@UseGuards(PermissionsGuard)
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Get()
    @RequirePermissions('read:roles')
    @ApiOperation({ summary: 'Get all roles', description: 'Returns a list of all roles in the system' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of roles retrieved successfully',
        type: [RoleResponseDto]
    })
    async findAll(): Promise<Role[]> {
        return this.rolesService.findAll();
    }

    @Get(':id')
    @RequirePermissions('read:roles')
    @ApiOperation({ summary: 'Get a role by ID', description: 'Returns a single role by its ID' })
    @ApiParam({ name: 'id', description: 'The ID of the role to retrieve' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Role retrieved successfully',
        type: RoleResponseDto
    })
    @ApiNotFoundResponse({ description: 'Role not found' })
    async findOne(@Param('id') id: string) {
        const role = await this.rolesService.findOne(id);
        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }
        return role;
    }

    @Post()
    @RequirePermissions('create:roles')
    @ApiOperation({ summary: 'Create a new role', description: 'Creates a new role with the provided data' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Role created successfully',
        type: RoleResponseDto
    })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    async create(@Body() createRoleDto: CreateRoleDto) {
        try {
            return await this.rolesService.create(createRoleDto);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Patch(':id')
    @RequirePermissions('update:roles')
    @ApiOperation({ summary: 'Update a role', description: 'Updates an existing role with the provided data' })
    @ApiParam({ name: 'id', description: 'The ID of the role to update' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Role updated successfully',
        type: RoleResponseDto
    })
    @ApiNotFoundResponse({ description: 'Role not found' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    async update(
        @Param('id') id: string,
        @Body() updateRoleDto: UpdateRoleDto
    ) {
        const role = await this.rolesService.update(id, updateRoleDto);
        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }
        return role;
    }

    @Delete(':id')
    @RequirePermissions('delete:roles')
    @ApiOperation({ summary: 'Delete a role', description: 'Deletes a role by its ID' })
    @ApiParam({ name: 'id', description: 'The ID of the role to delete' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Role deleted successfully',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Role deleted successfully'
                }
            }
        }
    })
    @ApiNotFoundResponse({ description: 'Role not found' })
    @ApiBadRequestResponse({ description: 'Cannot delete default role' })
    async remove(@Param('id') id: string) {
        try {
            const role = await this.rolesService.delete(id);
            if (!role) {
                throw new NotFoundException(`Role with ID ${id} not found`);
            }
            return { message: 'Role deleted successfully' };
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Patch(':id/permissions')
    @RequirePermissions('update:roles')
    @ApiOperation({ summary: 'Set role permissions', description: 'Replaces all permissions for a role' })
    @ApiParam({ name: 'id', description: 'The ID of the role to update permissions for' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Permissions updated successfully',
        type: RoleResponseDto
    })
    @ApiNotFoundResponse({ description: 'Role not found' })
    async setPermissions(
        @Param('id') id: string,
        @Body() body: PermissionsDto
    ) {
        const role = await this.rolesService.setPermissions(id, body.permissions);
        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }
        return role;
    }

    @Patch(':id/permissions/add')
    @RequirePermissions('update:roles')
    @ApiOperation({ summary: 'Add role permissions', description: 'Adds new permissions to a role' })
    @ApiParam({ name: 'id', description: 'The ID of the role to add permissions to' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Permissions added successfully',
        type: RoleResponseDto
    })
    @ApiNotFoundResponse({ description: 'Role not found' })
    async addPermissions(
        @Param('id') id: string,
        @Body() body: PermissionsDto
    ) {
        const role = await this.rolesService.addPermissions(id, body.permissions);
        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }
        return role;
    }

    @Patch(':id/permissions/remove')
    @RequirePermissions('update:roles')
    @ApiOperation({ summary: 'Remove role permissions', description: 'Removes permissions from a role' })
    @ApiParam({ name: 'id', description: 'The ID of the role to remove permissions from' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Permissions removed successfully',
        type: RoleResponseDto
    })
    @ApiNotFoundResponse({ description: 'Role not found' })
    async removePermissions(
        @Param('id') id: string,
        @Body() body: PermissionsDto
    ) {
        const role = await this.rolesService.removePermissions(id, body.permissions);
        if (!role) {
            throw new NotFoundException(`Role with ID ${id} not found`);
        }
        return role;
    }
} 