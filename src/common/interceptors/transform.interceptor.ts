import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

/**
 * Interface for standardized API response
 */
export interface Response<T> {
    data: T;
    meta: {
        timestamp: string;
        requestId: string | null;
        path: string;
    };
}

/**
 * Global interceptor that transforms all API responses into a standardized format
 * This ensures a consistent structure for all successful responses
 */
@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        const request = context.switchToHttp().getRequest<Request>();

        return next.handle().pipe(
            map((data) => {
                // Skip transformation for file download responses or explicitly excluded responses
                if (data && data.__raw) {
                    return data;
                }

                return {
                    data,
                    meta: {
                        timestamp: new Date().toISOString(),
                        requestId: request.headers['x-request-id'] || null,
                        path: request.url,
                    },
                };
            }),
        );
    }
} 