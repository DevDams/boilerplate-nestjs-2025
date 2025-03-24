import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext } from '@nestjs/common';
import { ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
    protected shouldSkip(context: ExecutionContext): Promise<boolean> {
        // Get the request object
        const request = context.switchToHttp().getRequest();
        const { url } = request;
        
        // Define paths to exclude from rate limiting
        const excludePaths = [
            '/api-docs',
            '/swagger',
            '/health'
        ];
        
        // Skip throttling for excluded paths
        if (excludePaths.some(path => url.includes(path))) {
            return Promise.resolve(true);
        }
        
        // Use the parent implementation for other cases
        return super.shouldSkip(context);
    }
} 