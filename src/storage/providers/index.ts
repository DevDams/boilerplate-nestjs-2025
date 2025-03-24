import { ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from './local-storage.provider';
import { R2StorageProvider } from './r2-storage.provider';
import { IStorageProvider } from '../storage.interface';

/**
 * Factory function to create the appropriate storage provider based on configuration
 */
export const createStorageProvider = (configService: ConfigService): IStorageProvider => {
    const storageType = configService.get<string>('upload.storageType');

    if (storageType === 'r2') {
        // Use R2 storage if configured
        return new R2StorageProvider(configService);
    }

    // Default to local storage
    return new LocalStorageProvider(configService);
};

/**
 * Provider definition for storage providers
 */
export const StorageProviders = [
    {
        provide: 'STORAGE_PROVIDER',
        useFactory: (configService: ConfigService) => createStorageProvider(configService),
        inject: [ConfigService],
    }
]; 