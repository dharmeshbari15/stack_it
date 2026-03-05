import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, badRequest, forbidden, notFound, unauthorized } from '@/lib/api-handler';
import { parseBody } from '@/lib/validate';
import { AcceptAnswerResponse } from '@/types/api';
import * as z from 'zod';

const acceptAnswerSchema = z.object({
    answerId: z.string().uuid('Invalid Answer ID'),
});

export const PATCH = apiHandler<{ id: string }, AcceptAnswerResponse>(async (
    req: NextRequest,
    { params }
) => {
    const session = await auth();

    if (!session?.user?.id) {
        throw unauthorized();
    }

    const { id: questionId } = await params;

    // 1. Validate request body
    const { answerId } = await parseBody(req, acceptAnswerSchema);

    // 2. Fetch question and verify ownership
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: {
            author_id: true,
            deleted_at: true
        }
    });

    if (!question || question.deleted_at) {
        throw notFound('Question');
    }

    if (question.author_id !== session.user.id) {
        throw forbidden('Only the question author can accept an answer');
    }

    // 3. Verify answer exists and belongs to this question
    const answer = await prisma.answer.findUnique({
        where: { id: answerId },
        select: {
            question_id: true,
            deleted_at: true
        }
    });

    if (!answer || answer.deleted_at || answer.question_id !== questionId) {
        throw badRequest('Invalid answer for this question');
    }

    // 4. Update question with accepted answer
    const updatedQuestion = await prisma.question.update({
        where: { id: questionId },
        data: {
            accepted_answer_id: answerId,
        },
        select: {
            id: true,
            accepted_answer_id: true,
        }
    });

    return apiSuccess({
        id: updatedQuestion.id,
        accepted_answer_id: updatedQuestion.accepted_answer_id as string,
    });
});
