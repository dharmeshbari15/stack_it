import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, notFound, unauthorized } from '@/lib/api-handler';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { resolveSessionUserId } from '@/lib/auth-user';
import { createQuestionVersion } from '@/lib/version-control';
import { QuestionDetail } from '@/types/api';
import { buildCommentTree, extractMentionUsernames, FlatCommentNode } from '@/lib/comments';

export const GET = apiHandler<{ id: string }, QuestionDetail>(async (req: NextRequest, { params }) => {
    const { id } = await params;
    const session = await auth();
    const currentUserId = session?.user ? await resolveSessionUserId(session) : null;

    try {
        const question = await prisma.question.findUnique({
            where: {
                id: id,
                deleted_at: null,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
                votes: currentUserId ? {
                    where: {
                        user_id: currentUserId,
                    },
                } : false,
                answers: {
                    where: {
                        deleted_at: null,
                    },
                    orderBy: [
                        { score: 'desc' },
                        { created_at: 'desc' },
                    ],
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                        votes: currentUserId ? {
                            where: {
                                user_id: currentUserId,
                            },
                        } : false,
                        comments: {
                            where: {
                                deleted_at: null,
                            },
                            orderBy: {
                                created_at: 'asc',
                            },
                            include: {
                                author: {
                                    select: {
                                        id: true,
                                        username: true,
                                    },
                                },
                            },
                        },
                    },
                },
                comments: {
                    where: {
                        deleted_at: null,
                    },
                    orderBy: {
                        created_at: 'asc',
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                },
            },
        });

        if (!question) {
            throw notFound('Question');
        }

        const mentionNameSet = new Set<string>();

        for (const comment of question.comments) {
            for (const username of extractMentionUsernames(comment.body)) {
                mentionNameSet.add(username);
            }
        }

        for (const answer of question.answers) {
            for (const comment of answer.comments) {
                for (const username of extractMentionUsernames(comment.body)) {
                    mentionNameSet.add(username);
                }
            }
        }

        const mentionedUsers = mentionNameSet.size
            ? await prisma.user.findMany({
                where: {
                    username: {
                        in: Array.from(mentionNameSet),
                    },
                },
                select: {
                    id: true,
                    username: true,
                },
            })
            : [];

        const mentionedUserMap = new Map(mentionedUsers.map((user) => [user.username, user]));

        const toFlatNode = (comment: {
            id: string;
            body: string;
            created_at: Date;
            updated_at: Date;
            parent_id: string | null;
            author: { id: string; username: string };
        }): FlatCommentNode => ({
            id: comment.id,
            body: comment.body,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
            parent_id: comment.parent_id,
            author: comment.author,
            mentions: extractMentionUsernames(comment.body)
                .map((username) => mentionedUserMap.get(username))
                .filter((user): user is { id: string; username: string } => !!user),
        });

        const formattedQuestion = {
            id: question.id,
            title: question.title,
            description: question.description,
            score: question.score,
            userVote: question.votes?.[0]?.value || 0,
            duplicate_of_id: question.duplicate_of_id,
            created_at: question.created_at,
            accepted_answer_id: question.accepted_answer_id,
            author: {
                id: question.author.id,
                username: question.author.username,
            },
            tags: question.tags.map((qt) => qt.tag.name),
            comments: buildCommentTree(question.comments.map(toFlatNode)),
            answers: question.answers.map((a) => ({
                id: a.id,
                body: a.body,
                score: a.score,
                created_at: a.created_at,
                author: {
                    id: a.author.id,
                    username: a.author.username,
                },
                userVote: a.votes?.[0]?.value || 0,
                comments: buildCommentTree(a.comments.map(toFlatNode)),
            })),
        };

        return apiSuccess(formattedQuestion);
    } catch (error) {
        if (error instanceof Error && 'statusCode' in error) throw error;
        throw error;
    }
});

export const DELETE = apiHandler<{ id: string }, any>(async (req: NextRequest, { params }) => {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
        throw unauthorized('You must be signed in to delete a question.');
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
        throw unauthorized('Unable to resolve your account. Please sign out and sign in again.');
    }

    const question = await prisma.question.findUnique({
        where: { id },
        select: { author_id: true, deleted_at: true }
    });

    if (!question || question.deleted_at) {
        throw notFound('Question');
    }

    if (question.author_id !== userId) {
        throw unauthorized('You are not authorized to delete this question.');
    }

    await prisma.question.update({
        where: { id },
        data: { deleted_at: new Date() }
    });

    return apiSuccess({ message: 'Question deleted successfully' });
});

const updateQuestionSchema = z.object({
    title: z.string().min(5).max(255).optional(),
    description: z.string().min(20).optional(),
    tags: z.array(z.string().min(1).max(30).toLowerCase()).min(1).max(5).optional(),
});

export const PATCH = apiHandler<{ id: string }, any>(async (req: NextRequest, { params }) => {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
        throw unauthorized('You must be signed in to edit a question.');
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
        throw unauthorized('Unable to resolve your account. Please sign in again.');
    }

    const question = await prisma.question.findUnique({
        where: { id },
        include: { tags: { include: { tag: true } } }
    });

    if (!question || question.deleted_at) {
        throw notFound('Question');
    }

    if (question.author_id !== userId) {
        throw unauthorized('You are not authorized to edit this question.');
    }

    const body = await req.json();
    const validated = updateQuestionSchema.parse(body);

    // Create a version before updating (capture current state)
    const currentTags = question.tags.map(qt => qt.tag.name);
    await createQuestionVersion(
        id,
        question.title,
        question.description,
        currentTags,
        userId,
        body.edit_reason || undefined
    );

    const updateData: any = {};
    if (validated.title) updateData.title = validated.title;
    if (validated.description) {
        const { sanitizeHtml, isValidContent } = await import('@/lib/sanitizer');
        const sanitized = sanitizeHtml(validated.description);
        if (!isValidContent(sanitized)) throw new Error('Invalid content');
        updateData.description = sanitized;
    }

    if (validated.tags) {
        // Handle tag updates by replacing the relations
        await prisma.$transaction(async (tx) => {
            // Remove existing relations
            await tx.questionTag.deleteMany({ where: { question_id: id } });

            // Upsert and link new tags
            for (const tagName of validated.tags!) {
                const tag = await tx.tag.upsert({
                    where: { name: tagName },
                    update: {},
                    create: { name: tagName },
                });
                await tx.questionTag.create({
                    data: { question_id: id, tag_id: tag.id }
                });
            }

            // Update question fields
            const fieldsToUpdate = { ...updateData };
            delete fieldsToUpdate.tags;
            if (Object.keys(fieldsToUpdate).length > 0) {
                await tx.question.update({
                    where: { id },
                    data: fieldsToUpdate
                });
            }
        });
    } else if (Object.keys(updateData).length > 0) {
        await prisma.question.update({
            where: { id },
            data: updateData
        });
    }

    return apiSuccess({ message: 'Question updated successfully' });
});
