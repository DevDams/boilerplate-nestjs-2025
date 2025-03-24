import { Stream } from 'stream';

/**
 * File interface that matches Express.Multer.File structure
 */
export interface FileUpload {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer?: Buffer;
}

/**
 * Storage file metadata interface
 */
export interface StorageFileInfo {
    filename: string;
    path: string;
    mimetype: string;
    size: number;
    originalname?: string;
}

/**
 * Storage provider interface
 */
export interface IStorageProvider {
    /**
     * Store a file in the storage provider
     * @param file The file to store
     * @param path Optional path where to store the file
     */
    storeFile(file: FileUpload, path?: string): Promise<StorageFileInfo>;

    /**
     * Store a buffer in the storage provider
     * @param buffer The buffer to store
     * @param filename The filename to use
     * @param mimetype The mimetype of the file
     * @param path Optional path where to store the file
     */
    storeBuffer(buffer: Buffer, filename: string, mimetype: string, path?: string): Promise<StorageFileInfo>;

    /**
     * Get a file from the storage provider
     * @param filePath The path of the file to get
     */
    getFile(filePath: string): Promise<Buffer>;

    /**
     * Get a file as a stream from the storage provider
     * @param filePath The path of the file to get
     */
    getFileStream(filePath: string): Promise<Stream>;

    /**
     * Delete a file from the storage provider
     * @param filePath The path of the file to delete
     */
    deleteFile(filePath: string): Promise<boolean>;
} 