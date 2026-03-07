import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, badRequest, notFound, unauthorized } from '@/lib/api-handler';
import { parseBody } from '@/lib/validate';
import { awardReputation, reverseReputation } from '@/lib/reputation';
import { resolveSessionUserId } from '@/lib/auth-user';
import * as z from 'zod';

const voteSchema = z.object({
    voteType: z.enum(['upvote', 'downvote'])
});

// Map voteType to value stored in DB
const getVoteValue = (voteType: 'upvote' | 'downvote'): number => voteType === 'upvote' ? 1 : -1;
const getVoteType = (value: number): 'upvote' | 'downvote' => value > 0 ? 'upvote' : 'downvote';

// POST /api/v1/questions/[id]/vote
export const POST = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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

    const { id: questionId } = await params;
    const { voteType } = await parseBody(req, voteSchema);
    const voteValue = getVoteValue(voteType);

    console.log('Vote request:', {
        questionId,
        voteType,
        userId,
        sessionUserId: session.user?.id,
        sessionEmail: session.user?.email
    });

    // Use transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
        // 1. Verify question exists
        const question = await tx.question.findUnique({
            where: { id: questionId },
            select: {
                id: true,
                deleted_at: true,
                author_id: true,
                score: true
            }
        });

        if (!question || question.deleted_at) {
            throw notFound('Question');
        }

        // 2. Check for existing vote
        const existingVote = await tx.questionVote.findUnique({
            where: {
                user_id_question_id: {
                    user_id: userId,
                    question_id: questionId
                }
            }
        });

        console.log('Existing vote lookup:', {
            userId,
            questionId,
            found: !!existingVote,
            existingVoteValue: existingVote?.value
        });

        let voteAction: 'add' | 'remove' | 'switch' = 'add';
        let oldVoteType: 'upvote' | 'downvote' | null = null;
        let reputationChange = 0;

        if (existingVote) {
            const existingVoteType = getVoteType(existingVote.value);
            
            if (existingVoteType === voteType) {
                // Toggle remove - clicking same vote type removes it
                voteAction = 'remove';
                oldVoteType = existingVoteType;

                // Delete the vote
                await tx.questionVote.delete({
                    where: {
                        user_id_question_id: {
                            user_id: userId,
                            question_id: questionId
                        }
                    }
                });

                // Update question score
                await tx.question.update({
                    where: { id: questionId },
                    data: {
                        score: { decrement: existingVote.value }
                    }
                });

                // Reverse reputation if not self-vote
                if (question.author_id !== userId) {
                    const originalChangeType = oldVoteType === 'upvote' ? 'QUESTION_UPVOTE' : 'QUESTION_DOWNVOTE';
                    await reverseReputation(tx, question.author_id, originalChangeType, questionId);
                    reputationChange = oldVoteType === 'upvote' ? -5 : 2;
                }
            } else {
                // Switch vote type
                voteAction = 'switch';
                oldVoteType = existingVoteType;
                const scoreDelta = voteValue - existingVote.value;

                // Update the vote
                await tx.questionVote.update({
                    where: {
                        user_id_question_id: {
                            user_id: userId,
                            question_id: questionId
                        }
                    },
                    data: {
                        value: voteValue
                    }
                });

                // Update question score
                await tx.question.update({
                    where: { id: questionId },
                    data: {
                        score: { increment: scoreDelta }
                    }
                });

                // Award reputation if not self-vote
                if (question.author_id !== userId) {
                    // Remove the old vote's effect first, then apply the new vote's effect
                    const oldChangeType = oldVoteType === 'upvote' ? 'QUESTION_UPVOTE' : 'QUESTION_DOWNVOTE';
                    const newChangeType = voteType === 'upvote' ? 'QUESTION_UPVOTE' : 'QUESTION_DOWNVOTE';
                    
                    await reverseReputation(tx, question.author_id, oldChangeType, questionId);
                    await awardReputation(tx, question.author_id, newChangeType, questionId);
                    
                    const oldAmount = oldVoteType === 'upvote' ? -5 : 2;
                    const newAmount = voteType === 'upvote' ? 5 : -2;
                    reputationChange = oldAmount + newAmount;
                }
            }
        } else {
            // New vote
            voteAction = 'add';

            console.log('Creating new vote:', {
                question_id: questionId,
                user_id: userId,
                value: voteValue
            });

            // Create the vote
            const createdVote = await tx.questionVote.create({
                data: {
                    question_id: questionId,
                    user_id: userId,
                    value: voteValue
                }
            });

            console.log('Vote created successfully:', {
                user_id: createdVote.user_id,
                question_id: createdVote.question_id,
                value: createdVote.value
            });

            // Update question score
            await tx.question.update({
                where: { id: questionId },
                data: {
                    score: { increment: voteValue }
                }
            });

            // Award reputation if not self-vote
            if (question.author_id !== userId) {
                const changeType = voteType === 'upvote' ? 'QUESTION_UPVOTE' : 'QUESTION_DOWNVOTE';
                await awardReputation(tx, question.author_id, changeType, questionId);
                reputationChange = voteType === 'upvote' ? 5 : -2;
            }
        }

        // Get updated question
        const updatedQuestion = await tx.question.findUnique({
            where: { id: questionId },
            select: {
                id: true,
                score: true
            }
        });

        return {
            id: updatedQuestion!.id,
            score: updatedQuestion!.score,
            vote_action: voteAction,
            current_vote: voteAction === 'remove' ? null : voteType,
            reputation_change: reputationChange
        };
    });

    return apiSuccess(result);
});
