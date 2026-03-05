// app/api/v1/questions/[id]/route.ts
// GET /api/v1/questions/[id]
//
// Fetches a single question by ID with relations: Author, Tags, and Answers.

import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, notFound } from '@/lib/api-handler';
import { NextRequest } from 'next/server';

export const GET = apiHandler(async (req: NextRequest, { params }) => {
    const { id } = await params;

    try {
        const question = await prisma.question.findUnique({
            where: {
                id: id,
                deleted_at: null, // Only fetch active questions
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
                        deleted_at: null, // Only fetch active answers
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
                    },
                },
            },
        });

        if (!question) {
            throw notFound('Question');
        }

        // Format the response to match the expected schema
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
            })),
        };

        return apiSuccess(formattedQuestion);
    } catch (error) {
        console.error(`[GET /api/v1/questions/${id}] Error:`, error);
        throw error;
    }
});
