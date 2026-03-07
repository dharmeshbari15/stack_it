// app/api/v1/questions/[id]/duplicates/route.ts
// GET /api/v1/questions/[id]/duplicates
//
// Get all questions marked as duplicates of this question

import { apiHandler, apiSuccess, notFound } from '@/lib/api-handler';
import { getDuplicates } from '@/lib/embedding';
import { prisma } from '@/lib/prisma';

// ─── Handler ──────────────────────────────────────────────────────────────────

export const GET = apiHandler(async (req, { params }) => {
    const resolvedParams = await params;
    const questionId = resolvedParams.id;

    // 1. Verify question exists
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { id: true, deleted_at: true },
    });

    if (!question || question.deleted_at) {
        throw notFound('Question not found');
    }

    // 2. Get all duplicates
    const duplicates = await getDuplicates(questionId);

    // 3. Format response
    return apiSuccess({
        canonical_question_id: questionId,
        duplicate_count: duplicates.length,
        duplicates: duplicates.map((link) => ({
            id: link.duplicate_question.id,
            title: link.duplicate_question.title,
            description: link.duplicate_question.description.substring(0, 200) + 
                (link.duplicate_question.description.length > 200 ? '...' : ''),
            score: link.duplicate_question.score,
            created_at: link.duplicate_question.created_at,
            author: {
                id: link.duplicate_question.author.id,
                username: link.duplicate_question.author.username,
                reputation: link.duplicate_question.author.reputation,
            },
            tags: link.duplicate_question.tags.map((qt) => qt.tag.name),
            marked_at: link.marked_at,
            marked_by: {
                id: link.marked_by.id,
                username: link.marked_by.username,
                role: link.marked_by.role,
            },
            similarity_score: link.similarity_score,
            notes: link.notes,
        })),
    });
});
