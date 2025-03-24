import { Injectable, NotFoundException, ConflictException, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Role, RoleDocument } from '../schemas/role.schema';
import { Permission } from '../schemas/user.schema';
import { UsersService } from '../users/users.service';
import { RoleQueryDto, RolePageQueryDto } from './dto/role-query.dto';
import { QueryService } from '../../common/services/query.service';

@Injectable()
export class RolesService implements OnModuleInit {
    constructor(
        @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
        @Inject(forwardRef(() => UsersService)) private usersService: UsersService,
        private readonly queryService: QueryService,
    ) { }

    // Initialize default roles when the module is initialized
    async onModuleInit() {
        const count = await this.roleModel.countDocuments().exec();
        if (count === 0) {
            await this.createDefaultRoles();
        }
    }

    private async createDefaultRoles() {
        const userRole = await this.roleModel.create({
            name: 'User',
            key: 'user',
            description: 'Default role for all users',
            permissions: ['read:own', 'update:own'],
            isDefault: true,
        });

        await this.roleModel.create({
            name: 'Admin',
            key: 'admin',
            description: 'Administrator with full access',
            permissions: [
                'read:users',
                'create:users',
                'update:users',
                'delete:users',
                'read:own',
                'update:own',
                'delete:own',
                'read:roles',
                'create:roles',
                'update:roles',
                'delete:roles',
                'assign:roles'
            ],
        });

        await this.roleModel.create({
            name: 'Editor',
            key: 'editor',
            description: 'Can edit content but not manage users',
            permissions: [
                'read:own',
                'update:own',
                'read:users',
            ],
        });

        return userRole;
    }

    async create(createRoleDto: {
        name: string;
        key: string;
        description?: string;
        permissions?: string[];
        isDefault?: boolean;
    }): Promise<RoleDocument> {
        // If this role is set as default, unset default flag on all other roles
        if (createRoleDto.isDefault) {
            await this.roleModel.updateMany(
                { isDefault: true },
                { $set: { isDefault: false } }
            ).exec();
        }

        const createdRole = new this.roleModel(createRoleDto);
        return createdRole.save();
    }

    async findAll(): Promise<Role[]> {
        return this.roleModel.find().exec();
    }

    async findOne(id: string): Promise<RoleDocument | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }
        return this.roleModel.findById(id).exec();
    }

    async findByKey(key: string): Promise<RoleDocument | null> {
        return this.roleModel.findOne({ key }).exec();
    }

    async update(id: string, updateRoleDto: {
        name?: string;
        key?: string;
        description?: string;
        permissions?: string[];
        isDefault?: boolean;
    }): Promise<RoleDocument | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }

        // If this role is set as default, unset default flag on all other roles
        if (updateRoleDto.isDefault) {
            await this.roleModel.updateMany(
                { _id: { $ne: id }, isDefault: true },
                { $set: { isDefault: false } }
            ).exec();
        }

        return this.roleModel.findByIdAndUpdate(id, updateRoleDto, { new: true }).exec();
    }

    async delete(id: string): Promise<RoleDocument | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }

        const role = await this.roleModel.findById(id).exec();

        if (!role) {
            return null;
        }

        // Prevent deleting the default role
        if (role.isDefault) {
            throw new Error('Cannot delete the default role');
        }

        return this.roleModel.findByIdAndDelete(id).exec();
    }

    async getDefaultRole(): Promise<RoleDocument | null> {
        return this.roleModel.findOne({ isDefault: true }).exec();
    }

    async addPermissions(id: string, permissions: string[]): Promise<RoleDocument | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }

        return this.roleModel.findByIdAndUpdate(
            id,
            { $addToSet: { permissions: { $each: permissions } } },
            { new: true }
        ).exec();
    }

    async removePermissions(id: string, permissions: string[]): Promise<RoleDocument | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }

        return this.roleModel.findByIdAndUpdate(
            id,
            { $pull: { permissions: { $in: permissions } } },
            { new: true }
        ).exec();
    }

    async setPermissions(id: string, permissions: string[]): Promise<RoleDocument | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }

        return this.roleModel.findByIdAndUpdate(
            id,
            { permissions },
            { new: true }
        ).exec();
    }

    /**
     * Find roles with advanced filtering, sorting, and pagination
     */
    async findWithFilters(queryOptions: RoleQueryDto = {}) {
        // Build additional filters specific to RoleQueryDto
        const additionalFilters: FilterQuery<Role> = {};

        // Use the query service for cursor-based pagination
        return this.queryService.executeCursorPaginatedQuery(
            this.roleModel as any,
            queryOptions,
            additionalFilters
        );
    }

    /**
     * Find roles with standard page-based pagination
     */
    async findWithPagePagination(queryOptions: RolePageQueryDto) {
        // Build additional filters specific to RoleQueryDto
        const additionalFilters: FilterQuery<Role> = {};

        // Use the query service for page-based pagination
        return this.queryService.executePagedQuery(
            this.roleModel as any,
            queryOptions,
            additionalFilters
        );
    }
} 