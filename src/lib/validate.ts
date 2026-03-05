// lib/validate.ts
// Zod-based request body validation utility for Next.js App Router API routes.
//
// Usage:
//   import { parseBody } from '@/lib/validate';
//   import { z } from 'zod';
//
//   const schema = z.object({ title: z.string().min(1), tags: z.array(z.string()).min(1) });
//
//   export const POST = apiHandler(async (req) => {
//     const body = await parseBody(req, schema);
//     // body is fully typed from the schema
//   });

import { NextRequest } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';
import { badRequest } from './api-handler';

// ─── Body Parser ──────────────────────────────────────────────────────────────

/**
 * Parses and validates the JSON request body against a Zod schema.
 * Throws a 400 ApiError on malformed JSON or validation failure.
 * Throws a ZodError (caught by apiHandler) on schema mismatch for field-level errors.
 */
export async function parseBody<T>(
    req: NextRequest,
    schema: ZodSchema<T>,
): Promise<T> {
    let raw: unknown;

    try {
        raw = await req.json();
    } catch {
        throw badRequest('Request body must be valid JSON');
    }

    // parse() throws ZodError — apiHandler maps this to a 400 with field-level details
    return schema.parse(raw);
}

// ─── Query Param Parser ───────────────────────────────────────────────────────

/**
 * Parses and validates URL search params against a Zod schema.
 * Converts all param values to strings first (URL params are always strings).
 * Throws a 400 ApiError on validation failure.
 */
export function parseQuery<T>(
    req: NextRequest,
    schema: ZodSchema<T>,
): T {
    const { searchParams } = req.nextUrl;
    const raw = Object.fromEntries(searchParams.entries());

    try {
        return schema.parse(raw);
    } catch (err) {
        if (err instanceof ZodError) {
            throw badRequest(
                `Invalid query parameters: ${err.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
                'INVALID_QUERY',
            );
        }
        throw err;
    }
}

// ─── Common Reusable Schemas ──────────────────────────────────────────────────

/** UUID string validator */
export const uuidSchema = z.string().uuid('Must be a valid UUID');

/** Pagination query params schema — used on list endpoints */
export const paginationSchema = z.object({
    page: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 1))
        .pipe(z.number().int().min(1)),
    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 20))
        .pipe(z.number().int().min(1).max(100)),
});

/** Tag name — used in questions and tag filtering */
export const tagNameSchema = z
    .string()
    .min(1, 'Tag cannot be empty')
    .max(50, 'Tag name is too long')
    .regex(/^[a-z0-9-]+$/, 'Tags must be lowercase alphanumeric with hyphens');
