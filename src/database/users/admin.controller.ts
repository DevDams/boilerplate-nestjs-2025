import { Controller, Param, Body, Put, UseGuards, Post, Delete, HttpStatus, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from '../schemas/user.schema';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { UserRoleDto } from './dto/user-role.dto';
import { UserPermissionsDto } from './dto/user-permissions.dto';
import { UserRolesDto } from './dto/user-roles.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { 
    ApiBearerAuth, 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiParam, 
    ApiNotFoundResponse
} from '@nestjs/swagger';

@ApiTags('admin/users')
@ApiBearerAuth('JWT-auth')
@Controller('admin/users')
@UseGuards(RolesGuard, PermissionsGuard)
@Roles('admin')
export class AdminController {
    constructor(private readonly usersService: UsersService) { }

    // Legacy role management
    @Put(':id/role')
    @RequirePermissions('update:users')
    @ApiOperation({ summary: 'Set user role (legacy)', description: 'Sets the legacy role for a user' })
    @ApiParam({ name: 'id', description: 'The ID of the user to update' })
    @ApiResponse({ 
        status: HttpStatus.OK, 
        description: 'Role updated successfully',
        type: UserResponseDto
    })
    @ApiNotFoundResponse({ description: 'User not found' })
    async setUserRole(
        @Param('id') id: string,
        @Body() body: UserRoleDto
    ) {
        const user = await this.usersService.setRole(id, body.role);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    // Direct permissions management
    @Put(':id/permissions')
    @RequirePermissions('update:users')
    @ApiOperation({ summary: 'Set user permissions', description: 'Replaces all direct permissions for a user' })
    @ApiParam({ name: 'id', description: 'The ID of the user to update permissions for' })
    @ApiResponse({ 
        status: HttpStatus.OK, 
        description: 'Permissions updated successfully',
        type: UserResponseDto
    })
    @ApiNotFoundResponse({ description: 'User not found' })
    async setUserPermissions(
        @Param('id') id: string,
        @Body() body: UserPermissionsDto
    ) {
        const user = await this.usersService.setPermissions(id, body.permissions);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    @Put(':id/permissions/add')
    @RequirePermissions('update:users')
    @ApiOperation({ summary: 'Add user permissions', description: 'Adds new direct permissions to a user' })
    @ApiParam({ name: 'id', description: 'The ID of the user to add permissions to' })
    @ApiResponse({ 
        status: HttpStatus.OK, 
        description: 'Permissions added successfully',
        type: UserResponseDto
    })
    @ApiNotFoundResponse({ description: 'User not found' })
    async addUserPermissions(
        @Param('id') id: string,
        @Body() body: UserPermissionsDto
    ) {
        const user = await this.usersService.addPermissions(id, body.permissions);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    @Put(':id/permissions/remove')
    @RequirePermissions('update:users')
    @ApiOperation({ summary: 'Remove user permissions', description: 'Removes direct permissions from a user' })
    @ApiParam({ name: 'id', description: 'The ID of the user to remove permissions from' })
    @ApiResponse({ 
        status: HttpStatus.OK, 
        description: 'Permissions removed successfully',
        type: UserResponseDto
    })
    @ApiNotFoundResponse({ description: 'User not found' })
    async removeUserPermissions(
        @Param('id') id: string,
        @Body() body: UserPermissionsDto
    ) {
        const user = await this.usersService.removePermissions(id, body.permissions);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    // Role-based user management
    @Put(':id/roles')
    @RequirePermissions('assign:roles')
    @ApiOperation({ summary: 'Set user roles', description: 'Replaces all roles for a user' })
    @ApiParam({ name: 'id', description: 'The ID of the user to update roles for' })
    @ApiResponse({ 
        status: HttpStatus.OK, 
        description: 'Roles updated successfully',
        type: UserResponseDto
    })
    @ApiNotFoundResponse({ description: 'User not found' })
    async setUserRoles(
        @Param('id') id: string,
        @Body() body: UserRolesDto
    ) {
        const user = await this.usersService.setUserRoles(id, body.roles);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    @Post(':id/roles')
    @RequirePermissions('assign:roles')
    @ApiOperation({ summary: 'Add user roles', description: 'Adds new roles to a user' })
    @ApiParam({ name: 'id', description: 'The ID of the user to add roles to' })
    @ApiResponse({ 
        status: HttpStatus.OK, 
        description: 'Roles added successfully',
        type: UserResponseDto
    })
    @ApiNotFoundResponse({ description: 'User not found' })
    async addUserRoles(
        @Param('id') id: string,
        @Body() body: UserRolesDto
    ) {
        const user = await this.usersService.addRolesToUser(id, body.roles);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    @Delete(':id/roles')
    @RequirePermissions('assign:roles')
    @ApiOperation({ summary: 'Remove user roles', description: 'Removes roles from a user' })
    @ApiParam({ name: 'id', description: 'The ID of the user to remove roles from' })
    @ApiResponse({ 
        status: HttpStatus.OK, 
        description: 'Roles removed successfully',
        type: UserResponseDto
    })
    @ApiNotFoundResponse({ description: 'User not found' })
    async removeUserRoles(
        @Param('id') id: string,
        @Body() body: UserRolesDto
    ) {
        const user = await this.usersService.removeRolesFromUser(id, body.roles);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
}
