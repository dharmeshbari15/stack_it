import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess } from '@/lib/api-handler';
import { getReputationLevel } from '@/lib/reputation';

// GET /api/v1/leaderboard
export const GET = apiHandler(async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const sortBy = (searchParams.get('sort_by') || 'reputation').toLowerCase();
    const skip = (page - 1) * limit;

    const orderBy =
        sortBy === 'questions'
            ? [
                { _count: { questions: 'desc' as const } },
                { reputation: 'desc' as const },
                { created_at: 'asc' as const },
                { id: 'asc' as const },
            ]
            : sortBy === 'answers'
                ? [
                    { _count: { answers: 'desc' as const } },
                    { reputation: 'desc' as const },
                    { created_at: 'asc' as const },
                    { id: 'asc' as const },
                ]
                : [
                    { reputation: 'desc' as const },
                    { created_at: 'asc' as const },
                    { id: 'asc' as const },
                ];

    const total = await prisma.user.count();
    let leaderboard: Array<{
        rank: number;
        id: string;
        username: string;
        email: string;
        reputation: number;
        level: ReturnType<typeof getReputationLevel>;
        questions_count: number;
        answers_count: number;
        answer_upvotes_received: number;
        question_upvotes_received: number;
        member_since: Date;
    }> = [];

    if (sortBy === 'answers') {
        // Answer ranking is based on upvotes received on answers (not reputation/questions).
        const rows = await prisma.$queryRaw<Array<{
            id: string;
            username: string;
            email: string;
            reputation: number;
            created_at: Date;
            questions_count: number | string;
            answers_count: number | string;
            answer_upvotes_received: number | string;
            question_upvotes_received: number | string;
        }>>`
            SELECT
                u.id,
                u.username,
                u.email,
                u.reputation,
                u.created_at,
                COALESCE(qs.questions_count, 0) AS questions_count,
                COALESCE(as2.answers_count, 0) AS answers_count,
                COALESCE(as2.answer_upvotes_received, 0) AS answer_upvotes_received,
                COALESCE(qs.question_upvotes_received, 0) AS question_upvotes_received
            FROM "User" u
            LEFT JOIN (
                SELECT
                    q.author_id,
                    COUNT(*) FILTER (WHERE q.deleted_at IS NULL) AS questions_count,
                    COALESCE(SUM(CASE WHEN qv.value = 1 THEN 1 ELSE 0 END), 0) AS question_upvotes_received
                FROM "Question" q
                LEFT JOIN "QuestionVote" qv ON qv.question_id = q.id
                GROUP BY q.author_id
            ) qs ON qs.author_id = u.id
            LEFT JOIN (
                SELECT
                    a.author_id,
                    COUNT(*) FILTER (WHERE a.deleted_at IS NULL) AS answers_count,
                    COALESCE(SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END), 0) AS answer_upvotes_received
                FROM "Answer" a
                LEFT JOIN "Vote" v ON v.answer_id = a.id
                GROUP BY a.author_id
            ) as2 ON as2.author_id = u.id
            ORDER BY answer_upvotes_received DESC, answers_count DESC, u.reputation DESC
                     , u.created_at ASC, u.id ASC
            LIMIT ${limit} OFFSET ${skip}
        `;

        leaderboard = rows.map((row, index) => ({
            rank: skip + index + 1,
            id: row.id,
            username: row.username,
            email: row.email,
            reputation: row.reputation,
            level: getReputationLevel(row.reputation),
            questions_count: Number(row.questions_count),
            answers_count: Number(row.answers_count),
            answer_upvotes_received: Number(row.answer_upvotes_received),
            question_upvotes_received: Number(row.question_upvotes_received),
            member_since: row.created_at,
        }));
    } else {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                reputation: true,
                created_at: true,
                _count: {
                    select: {
                        questions: {
                            where: { deleted_at: null }
                        },
                        answers: {
                            where: { deleted_at: null }
                        }
                    }
                }
            },
            orderBy,
            skip,
            take: limit
        });

        leaderboard = users.map((user, index) => ({
            rank: skip + index + 1,
            id: user.id,
            username: user.username,
            email: user.email,
            reputation: user.reputation,
            level: getReputationLevel(user.reputation),
            questions_count: user._count.questions,
            answers_count: user._count.answers,
            answer_upvotes_received: 0,
            question_upvotes_received: 0,
            member_since: user.created_at
        }));
    }

    return apiSuccess({
        leaderboard,
        sort_by: sortBy,
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit)
        }
    });
});
