import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenBlacklist, TokenBlacklistSchema } from '../schemas/token-blacklist.schema';
import { TokenBlacklistService } from './token-blacklist.service';
import { CommonModule } from '../../common/common.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: TokenBlacklist.name, schema: TokenBlacklistSchema },
        ]),
        forwardRef(() => CommonModule),
    ],
    providers: [TokenBlacklistService],
    exports: [TokenBlacklistService],
})
export class TokenBlacklistModule { } 