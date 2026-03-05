import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, notFound, unauthorized } from '@/lib/api-handler';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { QuestionDetail } from '@/types/api';

export const GET = apiHandler<{ id: string }, QuestionDetail>(async (req: NextRequest, { params }) => {
    const { id } = await params;
    const session = await auth();
    const currentUserId = session?.user?.id;

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
                    },
                },
            },
        });

        if (!question) {
            throw notFound('Question');
        }

        const formattedQuestion = {
            id: question.id,
            title: question.title,
            description: question.description,
            created_at: question.created_at,
            accepted_answer_id: question.accepted_answer_id,
            author: {
                id: question.author.id,
                username: question.author.username,
            },
            tags: question.tags.map((qt) => qt.tag.name),
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

    if (!session?.user?.id) {
        throw unauthorized('You must be signed in to delete a question.');
    }

    const question = await prisma.question.findUnique({
        where: { id },
        select: { author_id: true, deleted_at: true }
    });

    if (!question || question.deleted_at) {
        throw notFound('Question');
    }

    if (question.author_id !== session.user.id) {
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

    if (!session?.user?.id) {
        throw unauthorized('You must be signed in to edit a question.');
    }

    const question = await prisma.question.findUnique({
        where: { id },
        select: { author_id: true, deleted_at: true }
    });

    if (!question || question.deleted_at) {
        throw notFound('Question');
    }

    if (question.author_id !== session.user.id) {
        throw unauthorized('You are not authorized to edit this question.');
    }

    const body = await req.json();
    const validated = updateQuestionSchema.parse(body);

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
