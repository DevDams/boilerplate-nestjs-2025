import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

/**
 * Middleware that adds a unique request ID to each incoming request
 * This helps with request tracing and debugging
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Use existing request ID if present in headers
        const requestId = req.headers['x-request-id'] || this.generateRequestId();

        // Set the request ID in request headers for downstream use
        req.headers['x-request-id'] = requestId;

        // Add the request ID to the response headers
        res.setHeader('X-Request-ID', requestId);

        next();
    }

    /**
     * Generate a unique request ID
     * @returns A unique request ID string
     */
    private generateRequestId(): string {
        return `req-${crypto.randomBytes(16).toString('hex')}`;
    }
} 