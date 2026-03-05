import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, badRequest, notFound, unauthorized } from '@/lib/api-handler';
import { parseBody } from '@/lib/validate';
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

    if (!session?.user?.id) {
        throw unauthorized();
    }

    const { id: answerId } = await params;

    // 1. Validate request body
    const { value: newValue } = await parseBody(req, voteSchema);
    const userId = session.user.id;

    try {
        // 2. Perform voting logic in a transaction
        const updatedAnswer = await prisma.$transaction(async (tx) => {
            // Check if answer exists
            const answer = await tx.answer.findUnique({
                where: { id: answerId },
                select: { id: true, deleted_at: true, score: true }
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
            }

            // Update answer score using atomic increment
            return tx.answer.update({
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
        });

        return apiSuccess(updatedAnswer);
    } catch (err: any) {
        if (err instanceof Error && 'statusCode' in err) throw err;
        throw err;
    }
});
