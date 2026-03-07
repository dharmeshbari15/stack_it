// app/api/v1/questions/[id]/mark-duplicate/route.ts
// POST /api/v1/questions/[id]/mark-duplicate
//
// Mark a question as duplicate of another question (moderators only)
// Expects: { canonicalQuestionId: string, notes?: string }

import { z } from 'zod';
import { apiHandler, apiSuccess, badRequest, unauthorized, forbidden, notFound } from '@/lib/api-handler';
import { parseBody } from '@/lib/validate';
import { auth } from '@/auth';
import { markAsDuplicate } from '@/lib/embedding';
import { prisma } from '@/lib/prisma';

// ─── Request Schema ───────────────────────────────────────────────────────────

const markDuplicateSchema = z.object({
    canonicalQuestionId: z.string().uuid('Invalid question ID format'),
    notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
});

// ─── Handler ──────────────────────────────────────────────────────────────────

export const POST = apiHandler(async (req, { params }) => {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user?.id) {
        throw unauthorized('You must be signed in to mark duplicates.');
    }

    // 2. Authorization Check - Only admins can mark duplicates
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
        throw forbidden('Only moderators can mark questions as duplicates.');
    }

    // 3. Input Validation
    const resolvedParams = await params;
    const duplicateQuestionId = resolvedParams.id;
    const { canonicalQuestionId, notes } = await parseBody(req, markDuplicateSchema);

    // 4. Verify question exists
    const question = await prisma.question.findUnique({
        where: { id: duplicateQuestionId },
        select: { id: true, deleted_at: true },
    });

    if (!question || question.deleted_at) {
        throw notFound('Question not found');
    }

    // 5. Mark as duplicate
    try {
        await markAsDuplicate(
            duplicateQuestionId,
            canonicalQuestionId,
            session.user.id,
            undefined, // similarity score (optional)
            notes
        );

        return apiSuccess({
            message: 'Question marked as duplicate',
            duplicate_id: duplicateQuestionId,
            canonical_id: canonicalQuestionId,
        });
    } catch (error) {
        if (error instanceof Error) {
            throw badRequest(error.message);
        }
        throw error;
    }
});
