import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';

export const GET = apiHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
    const { id: userId } = params;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
    });

    if (!user) {
        return {
            status: 404,
            body: { error: { message: 'User not found' } }
        };
    }

    // Fetch questions authored by user
    const questions = await prisma.question.findMany({
        where: { author_id: userId, deleted_at: null },
        orderBy: { created_at: 'desc' },
        select: {
            id: true,
            title: true,
            description: true,
            created_at: true,
            _count: {
                select: { answers: true }
            }
        }
    });

    // Fetch answers authored by user
    const answers = await prisma.answer.findMany({
        where: { author_id: userId, deleted_at: null },
        orderBy: { created_at: 'desc' },
        include: {
            question: {
                select: {
                    id: true,
                    title: true
                }
            }
        }
    });

    // Transform into unified Post objects
    const questionPosts = questions.map(q => ({
        id: q.id,
        type: 'QUESTION',
        title: q.title,
        content: q.description.substring(0, 200),
        created_at: q.created_at,
        metadata: {
            answerCount: q._count.answers
        }
    }));

    const answerPosts = answers.map(a => ({
        id: a.id,
        type: 'ANSWER',
        title: a.question.title,
        content: a.body.substring(0, 200),
        created_at: a.created_at,
        metadata: {
            score: a.score,
            questionId: a.question.id
        }
    }));

    // Combine and sort chronologically
    const allPosts = [...questionPosts, ...answerPosts].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
        status: 200,
        body: {
            success: true,
            data: allPosts
        }
    };
});
