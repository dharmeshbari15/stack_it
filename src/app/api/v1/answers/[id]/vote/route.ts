import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import * as z from 'zod';

const voteSchema = z.object({
    value: z.union([z.literal(1), z.literal(-1)]),
});

export const POST = apiHandler(async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    const session = await auth();

    if (!session?.user) {
        return {
            status: 401,
            body: { error: { message: 'Authentication required' } }
        };
    }

    const { id: answerId } = await params;

    // 1. Validate request body
    const json = await req.json();
    const result = voteSchema.safeParse(json);

    if (!result.success) {
        return {
            status: 400,
            body: { error: { message: 'Value must be 1 (upvote) or -1 (downvote)' } }
        };
    }

    const { value: newValue } = result.data;
    const userId = session.user.id;

    // 2. Perform voting logic in a transaction
    const updatedAnswer = await prisma.$transaction(async (tx) => {
        // Check if answer exists
        const answer = await tx.answer.findUnique({
            where: { id: answerId },
            select: { id: true, deleted_at: true, score: true }
        });

        if (!answer || answer.deleted_at) {
            throw new Error('404');
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

    return {
        status: 200,
        body: {
            success: true,
            data: updatedAnswer
        }
    };
}, {
    onError: (error) => {
        if (error.message === '404') {
            return { status: 404, error: 'Answer not found' };
        }
    }
});
