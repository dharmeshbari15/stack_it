// app/api/v1/system/posts/[id]/route.ts
// DELETE /api/v1/system/posts/[id]
//
// Admin-only endpoint to soft-delete a question or an answer.

import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, forbidden, notFound, unauthorized } from '@/lib/api-handler';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

export const DELETE = apiHandler(async (req: NextRequest, { params }) => {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user) {
        throw unauthorized('Authentication required');
    }

    // 2. Authorization Check (Admin Only)
    // Note: session.user.role comes from the JWT/session via NextAuth callbacks
    if (session.user.role !== 'ADMIN') {
        throw forbidden('Administrative privileges are required for this action.');
    }

    const { id } = await params;
    const now = new Date();

    try {
        // 3. Attempt Soft-Delete on Question
        // We use $transaction or just try sequentially since an ID should be unique across posts ideally
        // but since they are in different tables with UUIDs, we check them one by one.

        const question = await prisma.question.findUnique({
            where: { id }
        });

        if (question) {
            await prisma.question.update({
                where: { id },
                data: { deleted_at: now }
            });
            return apiSuccess({ message: 'Question soft-deleted successfully' });
        }

        // 4. Attempt Soft-Delete on Answer
        const answer = await prisma.answer.findUnique({
            where: { id }
        });

        if (answer) {
            await prisma.answer.update({
                where: { id },
                data: { deleted_at: now }
            });
            return apiSuccess({ message: 'Answer soft-deleted successfully' });
        }

        // 5. Not Found
        throw notFound('Post');

    } catch (error) {
        if (error instanceof Error && 'statusCode' in error) throw error;

        console.error(`[DELETE /api/v1/system/posts/${id}] Error:`, error);
        throw error;
    }
});
