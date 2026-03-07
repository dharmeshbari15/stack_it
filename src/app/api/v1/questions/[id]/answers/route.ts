import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, unauthorized, notFound, badRequest } from '@/lib/api-handler';
import { sanitizeHtml, isValidContent } from '@/lib/sanitizer';
import { AnswerItem } from '@/types/api';
import { notifyFollowersOfNewAnswer } from '@/lib/follow';
import { resolveSessionUserId } from '@/lib/auth-user';
import * as z from 'zod';

const answerSchema = z.object({
    body: z.string().min(30, 'Answer must be at least 30 characters long'),
});

export const POST = apiHandler<{ id: string }, AnswerItem>(async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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

    // 1. Verify question exists and is not soft-deleted
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { id: true, deleted_at: true, author_id: true }
    });

    if (!question || question.deleted_at) {
        throw notFound('Question');
    }

    // 2. Validate request body
    const json = await req.json();
    const result = answerSchema.safeParse(json);

    if (!result.success) {
        throw badRequest(result.error.issues[0].message);
    }

    // 3. Sanitize HTML body
    const sanitizedBody = sanitizeHtml(result.data.body);

    if (!isValidContent(sanitizedBody)) {
        throw badRequest('Answer contains invalid or unsafe content.');
    }

    // 4. Create answer and notification in a transaction for atomicity
    const answer = await prisma.$transaction(async (tx) => {
        const newAnswer = await tx.answer.create({
            data: {
                body: sanitizedBody,
                question_id: questionId,
                author_id: userId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                    }
                }
            }
        });

        // 5. Create notification for question author (if not same user)
        if (question.author_id !== userId) {
            await tx.notification.create({
                data: {
                    type: 'ANSWER',
                    reference_id: questionId,
                    user_id: question.author_id,
                    actor_id: userId,
                }
            });
        }

        return newAnswer as AnswerItem;
    });

    // 6. Notify followers of this question (asynchronously)
    notifyFollowersOfNewAnswer(questionId, answer.id, userId).catch(err => {
        console.error('Failed to notify followers of new answer:', err);
    });

    return apiSuccess(answer, 201);
});
