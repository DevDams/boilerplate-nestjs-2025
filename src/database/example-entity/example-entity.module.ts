import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExampleEntityController } from './example-entity.controller';
import { ExampleEntityService } from './example-entity.service';
import { ExampleEntity, ExampleEntitySchema } from '../schemas/example-entity.schema';
import { CommonModule } from '../../common/common.module';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';

/**
 * Example module demonstrating filtering, sorting, and pagination capabilities
 * Serves as a template that can be copied and modified for new modules
 */
@Module({
    imports: [
        // Register the schema with Mongoose
        MongooseModule.forFeature([
            { name: ExampleEntity.name, schema: ExampleEntitySchema },
        ]),
        // Import CommonModule for access to the QueryService
        CommonModule,
        // Import RolesModule for guards to work
        RolesModule,
        // Import UsersModule for PermissionsGuard to work
        forwardRef(() => UsersModule),
    ],
    controllers: [ExampleEntityController],
    providers: [ExampleEntityService],
    exports: [ExampleEntityService],
})
export class ExampleEntityModule { } 