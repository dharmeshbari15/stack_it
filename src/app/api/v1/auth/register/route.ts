// app/api/v1/auth/register/route.ts
// POST /api/v1/auth/register
//
// Creates a new user account with a bcrypt-hashed password.
// Returns the created user's public fields (never the password hash).
//
// Security considerations:
//  - Email and username uniqueness checked with a descriptive 409 conflict error
//  - bcrypt cost factor 12 — strong against brute-force while acceptable latency (~300ms)
//  - Response never includes password_hash
//  - Rate limiting should be applied at the edge (Vercel middleware) in production

import { z } from 'zod';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import {
    apiHandler,
    apiSuccess,
    conflict,
} from '@/lib/api-handler';
import { parseBody } from '@/lib/validate';
import { RegisterUserResponse } from '@/types/api';

// ─── Request Schema ───────────────────────────────────────────────────────────

const registerSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            'Username can only contain letters, numbers, underscores, and hyphens',
        ),
    email: z
        .string()
        .email('Must be a valid email address')
        .max(255, 'Email is too long')
        .toLowerCase(), // normalise to lowercase before storage
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(72, 'Password must be at most 72 characters'), // bcrypt silently truncates at 72 bytes
});

export type RegisterBody = z.infer<typeof registerSchema>;

// ─── Handler ──────────────────────────────────────────────────────────────────

export const POST = apiHandler<any, RegisterUserResponse>(async (req) => {
    const { username, email, password } = await parseBody(req, registerSchema);

    // Check for existing email or username in a single parallel query
    const [emailExists, usernameExists] = await Promise.all([
        prisma.user.findFirst({ where: { email }, select: { id: true } }),
        prisma.user.findFirst({ where: { username }, select: { id: true } }),
    ]);

    if (emailExists) {
        throw conflict('An account with this email already exists', 'EMAIL_TAKEN');
    }
    if (usernameExists) {
        throw conflict('This username is already taken', 'USERNAME_TAKEN');
    }

    // Hash the password with a cost factor of 12 (recommended for 2024+)
    const password_hash = await hash(password, 12);

    // Create the user record
    const user = await prisma.user.create({
        data: {
            username,
            email,
            password_hash,
            // Default role is USER — set by the Prisma schema default
        },
        // Only return public-safe fields; never expose password_hash
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            created_at: true,
        },
    });

    // 201 Created — registration is a resource creation action
    return apiSuccess(user as RegisterUserResponse, 201);
});
