import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { IStorageProvider } from './storage.interface';
import { StorageController } from './storage.controller';
import { FileUploadConfig } from '../config/storage.config';
import { StorageProviders, createStorageProvider } from './providers';

@Module({})
export class StorageModule {
    /**
     * Register the storage module with a provider based on configuration
     */
    static forRoot(): DynamicModule {
        const providers: Provider[] = [
            FileUploadConfig,
            ...StorageProviders,
            StorageService,
        ];

        return {
            global: true,
            module: StorageModule,
            imports: [
                ConfigModule,
                MulterModule.registerAsync({
                    imports: [ConfigModule, StorageModule],
                    inject: [FileUploadConfig],
                    useFactory: (fileUploadConfig: FileUploadConfig) => {
                        return fileUploadConfig.createMemoryStorageOptions();
                    }
                }),
            ],
            providers,
            controllers: [StorageController],
            exports: [StorageService, FileUploadConfig],
        };
    }

    /**
     * Register the storage module with a custom provider
     * @param options Configuration for the custom provider
     */
    static forRootAsync(options: {
        useFactory: (...args: any[]) => IStorageProvider | Promise<IStorageProvider>;
        inject?: any[];
        imports?: any[];
    }): DynamicModule {
        const providers: Provider[] = [
            FileUploadConfig,
            {
                provide: 'STORAGE_PROVIDER',
                useFactory: options.useFactory,
                inject: options.inject || [],
            },
            StorageService,
        ];

        return {
            global: true,
            module: StorageModule,
            imports: [
                ...(options.imports || []),
                MulterModule.registerAsync({
                    imports: [ConfigModule, StorageModule],
                    inject: [FileUploadConfig],
                    useFactory: (fileUploadConfig: FileUploadConfig) => {
                        return fileUploadConfig.createMemoryStorageOptions();
                    }
                }),
            ],
            providers,
            controllers: [StorageController],
            exports: [StorageService, FileUploadConfig],
        };
    }
} 