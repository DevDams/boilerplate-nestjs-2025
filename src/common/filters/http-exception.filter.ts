import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP exception filter that standardizes error responses
 * throughout the application
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = exception.getStatus();

        // Get exception details
        const exceptionResponse = exception.getResponse() as
            | string
            | { message: string | string[]; statusCode: number; error: string };

        // Extract error message from exception
        let errorMessage: string | string[];
        let errorName: string;

        if (typeof exceptionResponse === 'string') {
            errorMessage = exceptionResponse;
            errorName = exception.constructor.name;
        } else {
            errorMessage = exceptionResponse.message;
            errorName = exceptionResponse.error || exception.constructor.name;
        }

        // Create standardized error response
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            error: {
                name: errorName,
                message: errorMessage,
            },
            requestId: request.headers['x-request-id'] || null,
        };

        // Log error details for non-404 errors
        if (status !== HttpStatus.NOT_FOUND) {
            const logContext = {
                ip: request.ip,
                userAgent: request.headers['user-agent'],
                method: request.method,
                url: request.url,
            };

            if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
                this.logger.error(
                    `${status} ${errorName}: ${errorMessage}`,
                    exception.stack,
                    logContext,
                );
            } else {
                this.logger.warn(
                    `${status} ${errorName}: ${errorMessage}`,
                    logContext,
                );
            }
        }

        // Send standardized error response
        response.status(status).json(errorResponse);
    }
} 