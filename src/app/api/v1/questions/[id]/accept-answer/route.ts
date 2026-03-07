import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, badRequest, forbidden, notFound, unauthorized } from '@/lib/api-handler';
import { parseBody } from '@/lib/validate';
import { awardReputation, reverseReputation } from '@/lib/reputation';
import { resolveSessionUserId } from '@/lib/auth-user';
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

    if (!session?.user) {
        throw unauthorized();
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
        throw unauthorized('Unable to resolve your account. Please sign out and sign in again.');
    }

    const { id: questionId } = await params;

    // 1. Validate request body
    const { answerId } = await parseBody(req, acceptAnswerSchema);

    // 2. Use transaction for acceptance and reputation update
    const result = await prisma.$transaction(async (tx) => {
        // Fetch question and verify ownership
        const question = await tx.question.findUnique({
            where: { id: questionId },
            select: {
                author_id: true,
                deleted_at: true,
                accepted_answer_id: true
            }
        });

        if (!question || question.deleted_at) {
            throw notFound('Question');
        }

        if (question.author_id !== userId) {
            throw forbidden('Only the question author can accept an answer');
        }

        // Verify answer exists and belongs to this question
        const answer = await tx.answer.findUnique({
            where: { id: answerId },
            select: {
                question_id: true,
                deleted_at: true,
                author_id: true
            }
        });

        if (!answer || answer.deleted_at || answer.question_id !== questionId) {
            throw badRequest('Invalid answer for this question');
        }

        // If there was a previously accepted answer, unaccept it (remove reputation)
        if (question.accepted_answer_id && question.accepted_answer_id !== answerId) {
            const oldAnswer = await tx.answer.findUnique({
                where: { id: question.accepted_answer_id },
                select: { author_id: true }
            });
            if (oldAnswer) {
                await reverseReputation(tx, oldAnswer.author_id, 'ANSWER_ACCEPTED', question.accepted_answer_id);
            }
        }

        // Award reputation to answer author (only if not self-accept)
        if (answer.author_id !== userId) {
            await awardReputation(tx, answer.author_id, 'ANSWER_ACCEPTED', answerId);
        }

        // Update question with accepted answer
        const updatedQuestion = await tx.question.update({
            where: { id: questionId },
            data: {
                accepted_answer_id: answerId,
            },
            select: {
                id: true,
                accepted_answer_id: true,
            }
        });

        return updatedQuestion;
    });

    return apiSuccess({
        id: result.id,
        accepted_answer_id: result.accepted_answer_id as string,
    });
});
