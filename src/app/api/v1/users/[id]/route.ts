import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, notFound, unauthorized, badRequest } from '@/lib/api-handler';
import { UserStats, UpdateUserResponse } from '@/types/api';
import { auth } from '@/auth';
import { resolveSessionUserId } from '@/lib/auth-user';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export const GET = apiHandler<{ id: string }, UserStats>(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: userId } = await params;
    const session = await auth();
    const sessionUserId = session?.user ? await resolveSessionUserId(session) : null;
    const isOwner = sessionUserId === userId;

    // Use raw SQL to bypass Prisma model limitations for the new 2FA field
    const users = await prisma.$queryRaw<any[]>`
        SELECT id, username, email, two_factor_enabled, created_at 
        FROM "User" 
        WHERE id = ${userId}
    `;

    const user = users[0];

    if (!user) {
        throw notFound('User');
    }

    const [questionCount, answerCount] = await Promise.all([
        prisma.question.count({
            where: { author_id: userId, deleted_at: null }
        }),
        prisma.answer.count({
            where: { author_id: userId, deleted_at: null }
        })
    ]);

    return apiSuccess({
        id: user.id,
        username: user.username,
        email: isOwner ? user.email : undefined,
        two_factor_enabled: isOwner ? user.two_factor_enabled : undefined,
        created_at: user.created_at,
        _count: {
            questions: questionCount,
            answers: answerCount
        }
    } as UserStats);
});

const updateUserSchema = z.object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    two_factor_enabled: z.boolean().optional(),
});

export const PATCH = apiHandler<{ id: string }, UpdateUserResponse>(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: userId } = await params;
    const session = await auth();

    if (!session?.user) {
        throw unauthorized('You must be signed in.');
    }

    const sessionUserId = await resolveSessionUserId(session);
    if (!sessionUserId || sessionUserId !== userId) {
        throw unauthorized('You can only update your own profile.');
    }

    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);

    // Check for existing username/email via Prisma
    if (validatedData.username) {
        const existing = await prisma.user.findUnique({ where: { username: validatedData.username } });
        if (existing && existing.id !== userId) {
            throw badRequest('Username already taken.');
        }
    }

    if (validatedData.email) {
        const existing = await prisma.user.findUnique({ where: { email: validatedData.email } });
        if (existing && existing.id !== userId) {
            throw badRequest('Email already in use.');
        }
    }

    // Prepare raw update
    if (validatedData.password) {
        const passwordHash = await bcrypt.hash(validatedData.password, 10);
        await prisma.$executeRaw`
            UPDATE "User" SET password_hash = ${passwordHash} WHERE id = ${userId}
        `;
    }

    if (validatedData.username) {
        await prisma.$executeRaw`
            UPDATE "User" SET username = ${validatedData.username} WHERE id = ${userId}
        `;
    }

    if (validatedData.email) {
        await prisma.$executeRaw`
            UPDATE "User" SET email = ${validatedData.email} WHERE id = ${userId}
        `;
    }

    if (validatedData.two_factor_enabled !== undefined) {
        await prisma.$executeRaw`
            UPDATE "User" SET two_factor_enabled = ${validatedData.two_factor_enabled} WHERE id = ${userId}
        `;
    }

    // Fetch updated user
    const users = await prisma.$queryRaw<any[]>`
        SELECT id, username, email, two_factor_enabled 
        FROM "User" 
        WHERE id = ${userId}
    `;

    return apiSuccess(users[0]);
});
