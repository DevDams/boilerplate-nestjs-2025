import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Stream, Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { FileUpload, IStorageProvider, StorageFileInfo } from '../storage.interface';

@Injectable()
export class R2StorageProvider implements IStorageProvider {
    private readonly s3Client: S3Client;
    private readonly bucketName: string;
    private readonly publicUrl: string;
    private readonly useSignedUrls: boolean;
    private readonly urlExpirationSeconds: number;

    constructor(private configService: ConfigService) {
        const endpoint = this.configService.get<string>('upload.r2.endpoint');
        const accessKeyId = this.configService.get<string>('upload.r2.accessKeyId');
        const secretAccessKey = this.configService.get<string>('upload.r2.secretAccessKey');
        const bucketName = this.configService.get<string>('upload.r2.bucketName');

        // Validate required config values
        if (!endpoint) throw new Error('R2 endpoint is required');
        if (!accessKeyId) throw new Error('R2 accessKeyId is required');
        if (!secretAccessKey) throw new Error('R2 secretAccessKey is required');
        if (!bucketName) throw new Error('R2 bucketName is required');

        // Initialize R2 client
        this.s3Client = new S3Client({
            region: 'auto', // Cloudflare R2 uses 'auto' region
            endpoint,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });

        this.bucketName = bucketName;
        this.publicUrl = this.configService.get<string>('upload.r2.publicUrl') || '';
        this.useSignedUrls = this.configService.get<boolean>('upload.r2.useSignedUrls') || false;
        this.urlExpirationSeconds = this.configService.get<number>('upload.r2.urlExpirationSeconds') || 3600; // 1 hour default
    }

    /**
     * Generate a unique filename to prevent collisions
     * @param originalname The original filename
     */
    private generateUniqueFilename(originalname: string): string {
        const extension = originalname.split('.').pop() || '';
        const filename = originalname.replace(`.${extension}`, '');
        const sanitizedFilename = filename
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');
        const uuid = uuidv4();

        return `${sanitizedFilename}-${uuid}.${extension}`;
    }

    /**
     * Get the full path (key) for the object in R2
     * @param subpath Optional subpath in the bucket
     * @param filename The filename
     */
    private getObjectKey(subpath: string | undefined, filename: string): string {
        if (subpath) {
            // Make sure the subpath doesn't start with a slash but ends with one
            const normalizedSubpath = subpath
                .replace(/^\/+/, '')
                .replace(/\/*$/, '/');
            return `${normalizedSubpath}${filename}`;
        }
        return filename;
    }

    /**
     * Generate URL for the stored object
     * @param objectKey The object key in R2
     */
    private async getObjectUrl(objectKey: string): Promise<string> {
        if (this.useSignedUrls) {
            // Generate a pre-signed URL with expiration
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: objectKey,
            });
            return await getSignedUrl(this.s3Client, command, {
                expiresIn: this.urlExpirationSeconds
            });
        } else if (this.publicUrl) {
            // Use the public URL
            return `${this.publicUrl.replace(/\/$/, '')}/${objectKey}`;
        }

        // Return the object key as the path if no public URL or signed URLs
        return objectKey;
    }

    /**
     * Store a file in Cloudflare R2
     * @param file The file to store
     * @param subpath Optional subpath in the bucket
     */
    async storeFile(file: FileUpload, subpath?: string): Promise<StorageFileInfo> {
        if (!file.buffer) {
            // If file has a path but no buffer, we need to read it
            if (file.path) {
                const fs = await import('fs/promises');
                file.buffer = await fs.readFile(file.path);
            } else {
                throw new Error('File has no buffer or path');
            }
        }

        const uniqueFilename = this.generateUniqueFilename(file.originalname);
        const objectKey = this.getObjectKey(subpath, uniqueFilename);

        // Upload the file to R2
        await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: objectKey,
            Body: file.buffer,
            ContentType: file.mimetype,
            ContentLength: file.size,
            Metadata: {
                originalname: file.originalname,
            },
        }));

        // Generate the URL or path for the stored file
        const path = await this.getObjectUrl(objectKey);

        return {
            filename: uniqueFilename,
            path,
            mimetype: file.mimetype,
            size: file.size,
            originalname: file.originalname,
        };
    }

    /**
     * Store a buffer in Cloudflare R2
     * @param buffer The buffer to store
     * @param filename The filename to use
     * @param mimetype The mimetype of the file
     * @param subpath Optional subpath in the bucket
     */
    async storeBuffer(
        buffer: Buffer,
        filename: string,
        mimetype: string,
        subpath?: string
    ): Promise<StorageFileInfo> {
        const uniqueFilename = this.generateUniqueFilename(filename);
        const objectKey = this.getObjectKey(subpath, uniqueFilename);

        // Upload the buffer to R2
        await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: objectKey,
            Body: buffer,
            ContentType: mimetype,
            ContentLength: buffer.length,
            Metadata: {
                originalname: filename,
            },
        }));

        // Generate the URL or path for the stored file
        const path = await this.getObjectUrl(objectKey);

        return {
            filename: uniqueFilename,
            path,
            mimetype,
            size: buffer.length,
            originalname: filename,
        };
    }

    /**
     * Get a file from Cloudflare R2
     * @param objectKey The key of the object to get
     */
    async getFile(objectKey: string): Promise<Buffer> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: objectKey,
            });

            const response = await this.s3Client.send(command);

            // Convert the response body to a buffer
            if (response.Body instanceof Readable) {
                const chunks: Buffer[] = [];
                for await (const chunk of response.Body) {
                    chunks.push(Buffer.from(chunk));
                }
                return Buffer.concat(chunks);
            } else {
                throw new Error('Response body is not readable');
            }
        } catch (error) {
            if ((error as any).name === 'NoSuchKey') {
                throw new Error(`File not found: ${objectKey}`);
            }
            throw error;
        }
    }

    /**
     * Get a file as a stream from Cloudflare R2
     * @param objectKey The key of the object to get
     */
    async getFileStream(objectKey: string): Promise<Stream> {
        try {
            // First check if the object exists
            await this.s3Client.send(new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: objectKey,
            }));

            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: objectKey,
            });

            const response = await this.s3Client.send(command);

            if (response.Body instanceof Readable) {
                return response.Body;
            } else {
                throw new Error('Response body is not readable');
            }
        } catch (error) {
            if ((error as any).name === 'NoSuchKey' || (error as any).name === 'NotFound') {
                throw new Error(`File not found: ${objectKey}`);
            }
            throw error;
        }
    }

    /**
     * Delete a file from Cloudflare R2
     * @param objectKey The key of the object to delete
     */
    async deleteFile(objectKey: string): Promise<boolean> {
        try {
            await this.s3Client.send(new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: objectKey,
            }));
            return true;
        } catch (error) {
            return false;
        }
    }
} 