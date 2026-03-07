import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, badRequest, notFound, unauthorized } from '@/lib/api-handler';
import { parseBody } from '@/lib/validate';
import { awardReputation, reverseReputation } from '@/lib/reputation';
import { resolveSessionUserId } from '@/lib/auth-user';
import { VoteResponse } from '@/types/api';
import * as z from 'zod';

const voteSchema = z.object({
    value: z.union([z.literal(1), z.literal(-1)]),
});

export const POST = apiHandler<{ id: string }, VoteResponse>(async (
    req: NextRequest,
    { params }
) => {
    const session = await auth();

    if (!session?.user) {
        throw unauthorized();
    }

    // Resolve actual database user ID
    const userId = await resolveSessionUserId(session);
    if (!userId) {
        console.error('Vote failed: Unable to resolve user ID from session:', {
            sessionUserId: session.user?.id,
            sessionEmail: session.user?.email,
        });
        throw unauthorized('Your session is invalid. Please sign out and sign in again to continue.');
    }

    const { id: answerId } = await params;

    // 1. Validate request body
    const { value: newValue } = await parseBody(req, voteSchema);

    try {
        // 2. Perform voting logic in a transaction
        const updatedAnswer = await prisma.$transaction(async (tx) => {
            // Check if answer exists
            const answer = await tx.answer.findUnique({
                where: { id: answerId },
                select: { id: true, deleted_at: true, score: true, author_id: true }
            });

            if (!answer || answer.deleted_at) {
                throw notFound('Answer');
            }

            // Check for existing vote
            const existingVote = await tx.vote.findUnique({
                where: {
                    user_id_answer_id: {
                        user_id: userId,
                        answer_id: answerId,
                    },
                },
            });

            let scoreDelta = 0;
            let reputationChange: 'add' | 'remove' | 'switch' | null = null;
            let reputationType: 'upvote' | 'downvote' | null = null;

            if (existingVote) {
                if (existingVote.value === newValue) {
                    // Toggle off: remove vote
                    await tx.vote.delete({
                        where: {
                            user_id_answer_id: {
                                user_id: userId,
                                answer_id: answerId,
                            },
                        },
                    });
                    scoreDelta = -newValue;
                    reputationChange = 'remove';
                    reputationType = existingVote.value === 1 ? 'upvote' : 'downvote';
                } else {
                    // Switch vote: update value
                    await tx.vote.update({
                        where: {
                            user_id_answer_id: {
                                user_id: userId,
                                answer_id: answerId,
                            },
                        },
                        data: { value: newValue },
                    });
                    scoreDelta = newValue * 2; // e.g. from -1 to 1 is +2
                    reputationChange = 'switch';
                    reputationType = newValue === 1 ? 'upvote' : 'downvote';
                }
            } else {
                // New vote
                await tx.vote.create({
                    data: {
                        user_id: userId,
                        answer_id: answerId,
                        value: newValue,
                    },
                });
                scoreDelta = newValue;
                reputationChange = 'add';
                reputationType = newValue === 1 ? 'upvote' : 'downvote';
            }

            // Update answer score using atomic increment
            const updatedAnswer = await tx.answer.update({
                where: { id: answerId },
                data: {
                    score: {
                        increment: scoreDelta
                    }
                },
                select: {
                    id: true,
                    score: true,
                }
            });

            // Award/remove reputation to answer author
            if (reputationChange && answer.author_id !== userId) {
                if (reputationChange === 'add') {
                    // New vote: award reputation
                    const reason = reputationType === 'upvote' ? 'ANSWER_UPVOTE' : 'ANSWER_DOWNVOTE';
                    await awardReputation(tx, answer.author_id, reason, answerId);
                } else if (reputationChange === 'remove') {
                    // Vote removed: reverse reputation (remove what was originally awarded)
                    const originalReason = reputationType === 'upvote' ? 'ANSWER_UPVOTE' : 'ANSWER_DOWNVOTE';
                    await reverseReputation(tx, answer.author_id, originalReason, answerId);
                } else if (reputationChange === 'switch') {
                    // Vote switched: reverse old vote and award new vote
                    const oldReason = reputationType === 'upvote' ? 'ANSWER_DOWNVOTE' : 'ANSWER_UPVOTE';
                    const newReason = reputationType === 'upvote' ? 'ANSWER_UPVOTE' : 'ANSWER_DOWNVOTE';
                    await reverseReputation(tx, answer.author_id, oldReason, answerId);
                    await awardReputation(tx, answer.author_id, newReason, answerId);
                }
            }

            return updatedAnswer;
        });

        return apiSuccess(updatedAnswer);
    } catch (err: any) {
        if (err instanceof Error && 'statusCode' in err) throw err;
        throw err;
    }
});
