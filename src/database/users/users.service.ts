import { Injectable, Inject, forwardRef, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { User, UserDocument, UserRole, Permission } from '../schemas/user.schema';
import { RolesService } from '../roles/roles.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserQueryDto, UserPageQueryDto } from './dto/user-query.dto';
import { QueryService } from '../../common/services/query.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @Inject(forwardRef(() => RolesService)) private readonly rolesService: RolesService,
    private readonly queryService: QueryService,
  ) { }

  async create(createUserDto: {
    name: string;
    email: string;
    password?: string;
    role?: UserRole;
    roles?: string[];
    permissions?: string[]
  }): Promise<UserDocument> {
    const userData = { ...createUserDto };

    // If roles are provided, validate and convert them to ObjectIds
    if (createUserDto.roles && createUserDto.roles.length > 0) {
      const roleIds = createUserDto.roles.filter(id => Types.ObjectId.isValid(id))
        .map(id => new Types.ObjectId(id));
      userData.roles = roleIds as any; // Type assertion to avoid TypeScript error
    } else {
      // Assign default role if no roles provided
      const defaultRole = await this.rolesService.getDefaultRole();
      if (defaultRole) {
        userData.roles = [defaultRole._id as any]; // Type assertion
      }
    }

    const createdUser = new this.userModel(userData);
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().populate('roles').exec();
  }

  async findOne(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).populate('roles').exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).populate('roles').exec();
  }

  async saveMagicLinkToken(userId: string, token: string, expires?: Date): Promise<void> {
    const expiryDate = expires || new Date(Date.now() + 30 * 60 * 1000); // Default 30 minutes
    await this.userModel.updateOne(
      { _id: userId },
      {
        magicLinkToken: token,
        magicLinkExpires: expiryDate
      }
    ).exec();
  }

  async clearMagicLinkToken(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $unset: {
          magicLinkToken: 1,
          magicLinkExpires: 1
        }
      }
    ).exec();
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    // Find the user first so the password hash middleware will run
    const user = await this.userModel.findById(userId);
    if (user) {
      user.password = newPassword;
      // Clear the magic link token
      user.magicLinkToken = undefined;
      user.magicLinkExpires = undefined;
      await user.save();
    }
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        isEmailVerified: true,
        $unset: {
          magicLinkToken: 1,
          magicLinkExpires: 1
        }
      }
    ).exec();
  }

  /**
   * Saves a refresh token for a user
   * @param userId The user ID
   * @param refreshToken The refresh token to save (or null to clear)
   * @returns The updated user
   */
  async saveRefreshToken(userId: string, refreshToken: string | null): Promise<UserDocument | null> {
    // If null, clear the token, otherwise save it
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        refreshToken,
        refreshTokenExpires: refreshToken
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          : null
      },
      { new: true }
    ).exec();
  }

  /**
   * Records a failed login attempt for a user
   * @param userId The user ID
   * @returns The updated user with incremented failed login attempts
   */
  async recordFailedLoginAttempt(userId: string): Promise<UserDocument | null> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) return null;

    const maxAttempts = 5; // Configure as needed
    const lockoutMinutes = 15;

    // Increment failed attempts
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    // If max attempts reached, lock the account
    if (user.failedLoginAttempts >= maxAttempts) {
      user.lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
    }

    return user.save();
  }

  /**
   * Resets the failed login attempts counter for a user
   * @param userId The user ID
   * @returns The updated user with reset login attempts
   */
  async resetFailedLoginAttempts(userId: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { failedLoginAttempts: 0, lockoutUntil: null },
      { new: true }
    ).exec();
  }

  // Legacy Role management (to maintain backward compatibility)
  async setRole(userId: string, role: UserRole): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).exec();
  }

  // Direct Permission management
  async addPermissions(userId: string, permissions: string[]): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { permissions: { $each: permissions } } },
      { new: true }
    ).exec();
  }

  async removePermissions(userId: string, permissions: string[]): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { permissions: { $in: permissions } } },
      { new: true }
    ).exec();
  }

  async setPermissions(userId: string, permissions: string[]): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { permissions },
      { new: true }
    ).exec();
  }

  // Role-based user management
  async addRolesToUser(userId: string, roleIds: string[]): Promise<UserDocument | null> {
    const validRoleIds = roleIds.filter(id => Types.ObjectId.isValid(id)).map(id => new Types.ObjectId(id));

    if (validRoleIds.length === 0) {
      return null;
    }

    return this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { roles: { $each: validRoleIds } } },
      { new: true }
    ).populate('roles').exec();
  }

  async removeRolesFromUser(userId: string, roleIds: string[]): Promise<UserDocument | null> {
    const validRoleIds = roleIds.filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    if (validRoleIds.length === 0) {
      return null;
    }

    return this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { roles: { $in: validRoleIds } } },
      { new: true }
    ).populate('roles').exec();
  }

  async setUserRoles(userId: string, roleIds: string[]): Promise<UserDocument | null> {
    const validRoleIds = roleIds.filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));

    return this.userModel.findByIdAndUpdate(
      userId,
      { roles: validRoleIds },
      { new: true }
    ).populate('roles').exec();
  }

  // Get all user permissions (combination of direct permissions and role-based permissions)
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId).populate('roles').exec();
    if (!user) {
      return [];
    }

    // Start with direct user permissions
    const directPermissions = user.permissions || [];

    // Add permissions from all roles
    const rolePermissions = user.roles
      ? (user.roles as any[]).flatMap(role => role.permissions || [])
      : [];

    // Combine and remove duplicates
    return Array.from(new Set([...directPermissions, ...rolePermissions]));
  }

  // User profile management
  async updateProfile(userId: string, profileData: Partial<User>): Promise<UserDocument | null> {
    // Only allow updating specific fields related to profile
    const allowedFields = {
      name: profileData.name,
      email: profileData.email,
      photoUrl: profileData.photoUrl,
    };

    // Remove undefined fields
    Object.keys(allowedFields).forEach(key => {
      if (allowedFields[key] === undefined) {
        delete allowedFields[key];
      }
    });

    return this.userModel.findByIdAndUpdate(
      userId,
      { $set: allowedFields },
      { new: true }
    ).exec();
  }

  /**
   * Find users with advanced filtering, sorting, and pagination
   */
  async findWithFilters(queryOptions: UserQueryDto = {}) {
    // Build additional filters specific to UserQueryDto
    const additionalFilters: FilterQuery<User> = {};

    // Use the query service for cursor-based pagination
    return this.queryService.executeCursorPaginatedQuery(
      this.userModel as any,
      queryOptions,
      additionalFilters
    );
  }

  /**
   * Find users with standard page-based pagination
   */
  async findWithPagePagination(queryOptions: UserPageQueryDto) {
    // Build additional filters specific to UserQueryDto
    const additionalFilters: FilterQuery<User> = {};

    // Use the query service for page-based pagination
    return this.queryService.executePagedQuery(
      this.userModel as any,
      queryOptions,
      additionalFilters
    );
  }
} 