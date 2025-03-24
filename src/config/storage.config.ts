import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as multer from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadConfig {
    // Default file size limit: 5MB
    private readonly DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;

    // Default allowed mime types (images)
    private readonly DEFAULT_ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/jpg'
    ];

    constructor(private configService: ConfigService) { }

    /**
     * Gets the max file size from config or returns default
     */
    getMaxFileSize(): number {
        return this.configService.get<number>('upload.maxFileSize') || this.DEFAULT_MAX_FILE_SIZE;
    }

    /**
     * Gets the allowed mime types from config or returns default
     */
    getAllowedMimeTypes(): string[] {
        return this.configService.get<string[]>('upload.allowedMimeTypes') || this.DEFAULT_ALLOWED_MIME_TYPES;
    }

    /**
     * Create multer options for local disk storage
     * @param destination The destination directory
     */
    createMulterOptions(destination?: string): MulterOptions {
        return {
            limits: {
                fileSize: this.getMaxFileSize(),
            },
            fileFilter: (req, file, callback) => {
                // Check if the file type is allowed
                if (this.getAllowedMimeTypes().includes(file.mimetype)) {
                    callback(null, true);
                } else {
                    callback(new Error(`Unsupported file type. Allowed types: ${this.getAllowedMimeTypes().join(', ')}`), false);
                }
            },
            storage: multer.diskStorage({
                destination: (req, file, callback) => {
                    callback(null, destination || path.join(process.cwd(), 'uploads'));
                },
                filename: (req, file, callback) => {
                    const uniqueSuffix = uuidv4();
                    const ext = path.extname(file.originalname);
                    const filename = path.basename(file.originalname, ext)
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '-')
                        .replace(/-+/g, '-');
                    callback(null, `${filename}-${uniqueSuffix}${ext}`);
                },
            }),
        };
    }

    /**
     * Create multer options for memory storage (files stored in buffer)
     */
    createMemoryStorageOptions(): MulterOptions {
        return {
            limits: {
                fileSize: this.getMaxFileSize(),
            },
            fileFilter: (req, file, callback) => {
                // Check if the file type is allowed
                if (this.getAllowedMimeTypes().includes(file.mimetype)) {
                    callback(null, true);
                } else {
                    callback(new Error(`Unsupported file type. Allowed types: ${this.getAllowedMimeTypes().join(', ')}`), false);
                }
            },
            storage: multer.memoryStorage(),
        };
    }
} 