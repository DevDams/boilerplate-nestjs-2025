import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../database/schemas/user.schema';
import { RolesService } from '../../database/roles/roles.service';
import { Types } from 'mongoose';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private rolesService: RolesService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are required, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        // If no user is present in the request (not authenticated)
        if (!user) {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        // Check legacy role field (backward compatibility)
        const legacyRoleMatch = requiredRoles.some(role => user.role === role);
        if (legacyRoleMatch) {
            return true;
        }

        // If user has no roles assigned, deny access
        if (!user.roles || user.roles.length === 0) {
            throw new ForbiddenException(`Requires one of these roles: ${requiredRoles.join(', ')}`);
        }

        // Get the user's role keys
        const userRoleKeys: string[] = [];
        // Check if roles are populated objects or just IDs
        for (const role of user.roles) {
            if (typeof role === 'object' && role !== null && 'key' in role) {
                userRoleKeys.push(role.key);
            }
        }

        // If no roles were populated objects, we need to load them
        if (userRoleKeys.length === 0 && user.roles.length > 0) {
            for (const roleId of user.roles) {
                const id = roleId.toString();
                const role = await this.rolesService.findOne(id);
                if (role && role.key) {
                    userRoleKeys.push(role.key);
                }
            }
        }

        // Check if user has at least one of the required roles
        const hasRequiredRole = requiredRoles.some(role => userRoleKeys.includes(role));

        if (!hasRequiredRole) {
            throw new ForbiddenException(`Requires one of these roles: ${requiredRoles.join(', ')}`);
        }

        return true;
    }
} 