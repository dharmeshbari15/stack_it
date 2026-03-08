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
import { ApiResponse } from '@/types/api';

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
export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
    return NextResponse.json({ success: true, data }, { status }) as NextResponse<ApiResponse<T>>;
}

/** Returns a standardized JSON error response. */
export function apiError(error: ApiError): NextResponse<ApiResponse<never>> {
    return NextResponse.json(
        {
            success: false,
            error: {
                message: error.message,
                code: error.code,
            },
        },
        { status: error.statusCode },
    ) as NextResponse<ApiResponse<never>>;
}

// ─── Route Handler Wrapper ────────────────────────────────────────────────────

/**
 * Definition for a Next.js App Router route handler.
 * @template TParams - Type of the route parameters
 * @template TResponse - Type of the data returned on success
 */
export type RouteHandler<TParams = any, TResponse = any> = (
    req: NextRequest,
    context: { params: Promise<TParams> },
) => Promise<NextResponse<ApiResponse<TResponse>> | Response>;

/**
 * Wraps a Next.js App Router route handler with standardized error handling.
 * Catches ApiError, ZodError, and unexpected errors automatically.
 */
export function apiHandler<TParams = any, TResponse = any>(
    handler: RouteHandler<TParams, TResponse>
): (req: NextRequest, context: { params: Promise<TParams> }) => Promise<Response> {
    return async (req, context) => {
        try {
            return await handler(req, context);
        } catch (err: any) {
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
                ) as NextResponse<ApiResponse<never>>;
            }

            // DB connectivity issues should not leak internal host details to clients.
            const message = err instanceof Error ? err.message : String(err);
            if (
                err?.code === 'P1001' ||
                /Can't reach database server|connect ECONNREFUSED|ECONNREFUSED|DATABASE_URL|connection refused/i.test(
                    message
                )
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            message:
                                'Service temporarily unavailable. Please try again in a few moments.',
                            code: 'DB_UNAVAILABLE',
                        },
                    },
                    { status: 503 },
                ) as NextResponse<ApiResponse<never>>;
            }

            // Unexpected error — log it and return a generic 500
            console.error('[API Error]', err);
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        message: err.message || 'An unexpected error occurred',
                        code: 'INTERNAL_ERROR',
                    },
                },
                { status: 500 },
            ) as NextResponse<ApiResponse<never>>;
        }
    };
}
