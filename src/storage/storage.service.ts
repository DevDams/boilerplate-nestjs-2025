import { Inject, Injectable } from '@nestjs/common';
import { Stream } from 'stream';
import { FileUpload, IStorageProvider, StorageFileInfo } from './storage.interface';

@Injectable()
export class StorageService {
    constructor(
        @Inject('STORAGE_PROVIDER') private readonly storageProvider: IStorageProvider,
    ) { }

    /**
     * Store a file in the storage provider
     * @param file The file to store
     * @param path Optional path where to store the file
     */
    async storeFile(file: FileUpload, path?: string): Promise<StorageFileInfo> {
        return this.storageProvider.storeFile(file, path);
    }

    /**
     * Store a buffer in the storage provider
     * @param buffer The buffer to store
     * @param filename The filename to use
     * @param mimetype The mimetype of the file
     * @param path Optional path where to store the file
     */
    async storeBuffer(
        buffer: Buffer,
        filename: string,
        mimetype: string,
        path?: string
    ): Promise<StorageFileInfo> {
        return this.storageProvider.storeBuffer(buffer, filename, mimetype, path);
    }

    /**
     * Get a file from the storage provider
     * @param filePath The path of the file to get
     */
    async getFile(filePath: string): Promise<Buffer> {
        return this.storageProvider.getFile(filePath);
    }

    /**
     * Get a file as a stream from the storage provider
     * @param filePath The path of the file to get
     */
    async getFileStream(filePath: string): Promise<Stream> {
        return this.storageProvider.getFileStream(filePath);
    }

    /**
     * Delete a file from the storage provider
     * @param filePath The path of the file to delete
     */
    async deleteFile(filePath: string): Promise<boolean> {
        return this.storageProvider.deleteFile(filePath);
    }
} 