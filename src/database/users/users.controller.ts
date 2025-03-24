import { Controller, Get, Post, Body, Param, UseGuards, HttpStatus, NotFoundException, UseInterceptors, UploadedFile, Patch, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../schemas/user.schema';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto, PaginatedUsersResponseDto, PagedUsersResponseDto } from './dto/user-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../../storage/storage.service';
import { FileUpload } from '../../storage/storage.interface';
import { FileUploadConfig } from '../../config/storage.config';
import { CreateUserWithPhotoDto } from './dto/create-user-with-photo.dto';
import { UserQueryDto, UserPageQueryDto } from './dto/user-query.dto';
import { 
  ApiBearerAuth, 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiNotFoundResponse,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(RolesGuard, PermissionsGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService
  ) {}

  @Post()
  @RequirePermissions('create:users')
  @ApiOperation({ summary: 'Create user', description: 'Creates a new user in the system' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'User created successfully',
    type: UserResponseDto
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermissions('read:users')
  @ApiOperation({
    summary: 'Get all users with filtering and cursor-based pagination',
    description: 'Returns a paginated list of users with filtering and sorting'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: PaginatedUsersResponseDto
  })
  async findAll(@Query() query: UserQueryDto) {
    return this.usersService.findWithFilters(query);
  }

  @Get('paged')
  @RequirePermissions('read:users')
  @ApiOperation({
    summary: 'Get all users with page-based pagination',
    description: 'Returns a paginated list of users using standard page and size parameters'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: PagedUsersResponseDto
  })
  async findAllPaged(@Query() query: UserPageQueryDto) {
    return this.usersService.findWithPagePagination(query);
  }

  @Get(':id')
  @RequirePermissions('read:users')
  @ApiOperation({ summary: 'Get a user by ID', description: 'Returns a single user by their ID' })
  @ApiParam({ name: 'id', description: 'The ID of the user to retrieve' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User retrieved successfully',
    type: UserResponseDto
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  @Patch(':id/photo')
  @UseInterceptors(FileInterceptor('photo'))
  @RequirePermissions('update:users')
  @ApiOperation({ summary: 'Upload user photo', description: 'Uploads a photo for the user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Photo uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        photoUrl: { type: 'string' }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() photo: FileUpload
  ) {
    const user = await this.usersService.findOne(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Store the file in the 'users' directory
    const fileInfo = await this.storageService.storeFile(photo, 'users');
    
    // Update the user's profile with the photo URL
    await this.usersService.updateProfile(id, { photoUrl: fileInfo.path });
    
    return { 
      photoUrl: fileInfo.path
    };
  }

  @Post('with-photo')
  @UseInterceptors(FileInterceptor('photo'))
  @RequirePermissions('create:users')
  @ApiOperation({ summary: 'Create user with photo', description: 'Creates a new user with photo in the system' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
        role: { type: 'string', enum: ['user', 'admin', 'editor'] },
        roles: { type: 'array', items: { type: 'string' } },
        permissions: { type: 'array', items: { type: 'string' } },
        photo: { type: 'string', format: 'binary' },
      },
      required: ['name', 'email'],
    },
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'User created successfully with photo',
    type: UserResponseDto
  })
  async createWithPhoto(
    @Body() createUserDto: CreateUserWithPhotoDto,
    @UploadedFile() photo: FileUpload
  ) {
    // First create the user
    const user = await this.usersService.create(createUserDto);
    
    // If photo is provided, upload it and update the user profile
    if (photo) {
      const fileInfo = await this.storageService.storeFile(photo, 'users');
      await this.usersService.updateProfile(user._id.toString(), { photoUrl: fileInfo.path });
      user.photoUrl = fileInfo.path;
    }
    
    return user;
  }
}
