/**
 * Simple in-memory rate limiter for Next.js Middleware.
 * 
 * NOTE: In serverless environments, memory is not shared between instances.
 * This provides "per-instance" rate limiting which is a good first-degree defense
 * without requiring external Redis/KV dependencies.
 */

interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

const stores = new Map<string, { count: number; reset: number }>();

/**
 * Checks if a request from a given identifier (e.g., IP) is within the limit.
 * 
 * @param identifier Unique key (IP address)
 * @param limit Maximum number of requests allowed
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(identifier: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const key = `${identifier}`;

    // Clean up expired entries periodically (simplistic approach)
    // In a real middleware, this Map might grow, but Next.js middleware instances 
    // are short-lived enough that it's usually fine for MVP.

    let record = stores.get(key);

    if (!record || now > record.reset) {
        record = {
            count: 0,
            reset: now + windowMs
        };
    }

    record.count++;
    stores.set(key, record);

    const remaining = Math.max(0, limit - record.count);

    return {
        success: record.count <= limit,
        limit,
        remaining,
        reset: record.reset
    };
}
