import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelSubscriptionDto {
    @ApiProperty({
        description: 'Whether to cancel the subscription immediately or at period end',
        example: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    immediately?: boolean;
}

export class PauseSubscriptionDto {
    @ApiProperty({
        description: 'The mode for pausing the subscription',
        example: 'void',
        enum: ['void'],
    })
    @IsString()
    @IsNotEmpty()
    mode: 'void';

    @ApiProperty({
        description: 'Number of billing cycles to pause the subscription for',
        example: 1,
        required: false,
    })
    @IsOptional()
    resumesAt?: number;
}

export class ResumeSubscriptionDto {
    // This is an empty class since no parameters are needed for resuming
} 