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
 * Global catch-all exception filter that handles any uncaught exceptions
 * and provides a standardized error response
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // Determine status code and error details
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let errorMessage: string | string[] = 'Internal server error';
        let errorName = 'InternalServerError';
        let stack: string | undefined;

        // Handle HttpExceptions differently
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse() as
                | string
                | { message: string | string[]; error: string };

            if (typeof exceptionResponse === 'string') {
                errorMessage = exceptionResponse;
            } else {
                errorMessage = exceptionResponse.message;
                errorName = exceptionResponse.error || exception.constructor.name;
            }
            stack = exception.stack;
        } else if (exception instanceof Error) {
            // Handle standard Error objects
            errorMessage = exception.message;
            errorName = exception.name;
            stack = exception.stack;
        }

        // Format message for display
        const formattedMessage = Array.isArray(errorMessage)
            ? errorMessage.join(', ')
            : errorMessage;

        // Create standardized error response
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            error: {
                name: errorName,
                message: formattedMessage,
            },
            requestId: request.headers['x-request-id'] || null,
        };

        // Log the error with additional context
        const logContext = {
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            method: request.method,
            url: request.url,
        };

        // Log with appropriate severity
        if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `Unhandled exception ${errorName}: ${formattedMessage}`,
                stack,
                logContext,
            );
        } else {
            this.logger.warn(
                `Exception ${errorName}: ${formattedMessage}`,
                logContext,
            );
        }

        // Don't include sensitive error details in production
        if (process.env.NODE_ENV === 'production') {
            if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
                errorResponse.error.message = 'Internal server error';
            }
        }

        // Send standardized error response
        response.status(status).json(errorResponse);
    }
} 