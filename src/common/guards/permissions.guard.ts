import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserRole } from '../../database/schemas/user.schema';
import { UsersService } from '../../database/users/users.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @Inject(forwardRef(() => UsersService)) private usersService: UsersService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no permissions are required, allow access
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        // If no user is present in the request (not authenticated)
        if (!user) {
            throw new ForbiddenException('You do not have permission to access this resource');
        }

        // Admin role bypass permission checks (legacy compatibility)
        if (user.role === UserRole.ADMIN) {
            return true;
        }

        // Get all user permissions (both direct and from roles)
        const userPermissions = await this.usersService.getUserPermissions(user._id);

        // Check if user has all required permissions
        const hasAllPermissions = requiredPermissions.every(
            permission => userPermissions.includes(permission)
        );

        if (!hasAllPermissions) {
            throw new ForbiddenException(`Missing required permissions: ${requiredPermissions.join(', ')}`);
        }

        return true;
    }
} 