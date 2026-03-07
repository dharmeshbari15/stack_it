// app/api/v1/questions/[id]/unmark-duplicate/route.ts
// POST /api/v1/questions/[id]/unmark-duplicate
//
// Remove duplicate marking from a question (moderators only)

import { apiHandler, apiSuccess, unauthorized, forbidden, notFound } from '@/lib/api-handler';
import { auth } from '@/auth';
import { unmarkAsDuplicate } from '@/lib/embedding';
import { prisma } from '@/lib/prisma';

// ─── Handler ──────────────────────────────────────────────────────────────────

export const POST = apiHandler(async (req, { params }) => {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user?.id) {
        throw unauthorized('You must be signed in to unmark duplicates.');
    }

    // 2. Authorization Check - Only admins can unmark duplicates
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
        throw forbidden('Only moderators can unmark duplicate questions.');
    }

    // 3. Verify question exists
    const resolvedParams = await params;
    const questionId = resolvedParams.id;
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { id: true, deleted_at: true, duplicate_of_id: true },
    });

    if (!question || question.deleted_at) {
        throw notFound('Question not found');
    }

    if (!question.duplicate_of_id) {
        throw notFound('Question is not marked as duplicate');
    }

    // 4. Unmark as duplicate
    await unmarkAsDuplicate(questionId);

    return apiSuccess({
        message: 'Duplicate marking removed',
        question_id: questionId,
    });
});
