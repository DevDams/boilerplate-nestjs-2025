import { SetMetadata } from '@nestjs/common';

/**
 * Set custom rate limit for a specific route
 * @param limit Maximum number of requests within the TTL
 * @param ttl Time to live in seconds
 */
export const RateLimit = (limit: number, ttl: number) =>
    SetMetadata('throttler', { limit, ttl }); 