import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category, CategorySchema } from '../schemas/category.schema';
import { QueryService } from '../../common/services/query.service';
import { RolesModule } from '../roles/roles.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Category.name, schema: CategorySchema }
        ]),
        forwardRef(() => RolesModule),
        forwardRef(() => UsersModule),
    ],
    controllers: [CategoriesController],
    providers: [CategoriesService, QueryService],
    exports: [CategoriesService]
})
export class CategoriesModule { } 