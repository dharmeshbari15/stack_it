// lib/api-handler.ts
// Standardized API error handler and route wrapper for Next.js App Router.
//
// Usage:
//   export const GET = apiHandler(async (req) => {
//     const data = await prisma.question.findMany();
//     return apiSuccess(data);
//   });

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

// ─── Error Types ──────────────────────────────────────────────────────────────

/** A typed HTTP API error that can be thrown from any route handler. */
export class ApiError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly code?: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// ─── Factory Helpers ──────────────────────────────────────────────────────────

/** 400 Bad Request */
export const badRequest = (message = 'Bad request', code?: string) =>
    new ApiError(400, message, code);

/** 401 Unauthorized */
export const unauthorized = (message = 'Authentication required') =>
    new ApiError(401, message, 'UNAUTHORIZED');

/** 403 Forbidden */
export const forbidden = (message = 'You do not have permission to do this') =>
    new ApiError(403, message, 'FORBIDDEN');

/** 404 Not Found */
export const notFound = (resource = 'Resource') =>
    new ApiError(404, `${resource} not found`, 'NOT_FOUND');

/** 409 Conflict */
export const conflict = (message = 'Conflict', code?: string) =>
    new ApiError(409, message, code);

/** 500 Internal Server Error */
export const internalError = (message = 'Internal server error') =>
    new ApiError(500, message, 'INTERNAL_ERROR');

// ─── Response Helpers ─────────────────────────────────────────────────────────

/** Returns a standardized JSON success response. */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
    return NextResponse.json({ success: true, data }, { status });
}

/** Returns a standardized JSON error response. */
export function apiError(error: ApiError): NextResponse {
    return NextResponse.json(
        {
            success: false,
            error: {
                message: error.message,
                code: error.code,
            },
        },
        { status: error.statusCode },
    );
}

// ─── Route Handler Wrapper ────────────────────────────────────────────────────

type RouteHandler<T = any> = (
    req: NextRequest,
    context: { params: Promise<T> },
) => Promise<any>;

/**
 * Wraps a Next.js App Router route handler with standardized error handling.
 * Catches ApiError, ZodError, and unexpected errors automatically.
 *
 * @example
 * export const GET = apiHandler(async (req) => {
 *   const data = await prisma.question.findMany();
 *   return apiSuccess(data);
 * });
 */
export function apiHandler(handler: RouteHandler): RouteHandler {
    return async (req, context) => {
        try {
            return await handler(req, context);
        } catch (err) {
            // Known API error — return the structured response directly
            if (err instanceof ApiError) {
                return apiError(err);
            }

            // Zod validation error — map field errors to a 400 response
            if (err instanceof ZodError) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            message: 'Validation failed',
                            code: 'VALIDATION_ERROR',
                            fields: err.flatten().fieldErrors,
                        },
                    },
                    { status: 400 },
                );
            }

            // Unexpected error — log it and return a generic 500
            console.error('[API Error]', err);
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        message: 'An unexpected error occurred',
                        code: 'INTERNAL_ERROR',
                    },
                },
                { status: 500 },
            );
        }
    };
}
