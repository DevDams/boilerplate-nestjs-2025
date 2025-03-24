import {
    BadRequestException,
    Controller,
    Get,
    Param,
    Post,
    Res,
    UploadedFile,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { StorageService } from './storage.service';
import { FileUpload } from './storage.interface';
import { FileUploadConfig } from '../config/storage.config';
import {
    ApiTags,
    ApiConsumes,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';

@ApiTags('files')
@Controller('files')
export class StorageController {
    constructor(
        private readonly storageService: StorageService,
        private readonly fileUploadConfig: FileUploadConfig
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload a single file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'File uploaded successfully',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'success' },
                data: {
                    type: 'object',
                    properties: {
                        filename: { type: 'string' },
                        path: { type: 'string' },
                        mimetype: { type: 'string' },
                        size: { type: 'number' },
                        originalname: { type: 'string' },
                    },
                },
            },
        },
    })
    async uploadFile(@UploadedFile() file: FileUpload) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        
        const result = await this.storageService.storeFile(file);
        return {
            status: 'success',
            data: result,
        };
    }

    @Post('upload/multiple')
    @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
    @ApiOperation({ summary: 'Upload multiple files' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Files uploaded successfully',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'success' },
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            filename: { type: 'string' },
                            path: { type: 'string' },
                            mimetype: { type: 'string' },
                            size: { type: 'number' },
                            originalname: { type: 'string' },
                        },
                    },
                },
            },
        },
    })
    async uploadMultipleFiles(@UploadedFiles() files: FileUpload[]) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided');
        }

        const results = await Promise.all(
            files.map(file => this.storageService.storeFile(file))
        );

        return {
            status: 'success',
            data: results,
        };
    }

    @Get(':path')
    @ApiOperation({ summary: 'Get a file by path' })
    @ApiParam({ name: 'path', description: 'The path of the file to retrieve' })
    @ApiResponse({ status: 200, description: 'File retrieved successfully' })
    @ApiResponse({ status: 404, description: 'File not found' })
    async getFile(@Param('path') filePath: string, @Res() res: Response) {
        try {
            const stream = await this.storageService.getFileStream(filePath);
            stream.pipe(res);
        } catch (error) {
            res.status(404).send({
                status: 'error',
                message: 'File not found',
            });
        }
    }
} 