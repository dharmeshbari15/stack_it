import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, notFound } from '@/lib/api-handler';
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
