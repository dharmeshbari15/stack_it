// app/api/v1/users/route.ts
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess } from '@/lib/api-handler';
import { z } from 'zod';

const getUsersQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(20),
    page: z.coerce.number().int().min(1).default(1),
});

export const GET = apiHandler(async (req) => {
    const { searchParams } = new URL(req.url);
    const { limit, page } = getUsersQuerySchema.parse({
        limit: searchParams.get('limit') ?? undefined,
        page: searchParams.get('page') ?? undefined,
    });

    const skip = (page - 1) * limit;

    // Use raw SQL to accurately count active questions and answers
    const users = await prisma.$queryRaw<any[]>`
        SELECT 
            u.id, 
            u.username, 
            u.created_at,
            (SELECT CAST(COUNT(*) AS INTEGER) FROM "Question" q WHERE q.author_id = u.id AND q.deleted_at IS NULL) as "question_count",
            (SELECT CAST(COUNT(*) AS INTEGER) FROM "Answer" a WHERE a.author_id = u.id AND a.deleted_at IS NULL) as "answer_count"
        FROM "User" u
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${skip}
    `;

    const totalCount = await prisma.user.count();

    const formattedUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        created_at: u.created_at,
        questionCount: u.question_count,
        answerCount: u.answer_count,
        totalContributions: u.question_count + u.answer_count
    }));

    return apiSuccess({
        users: formattedUsers,
        total_pages: Math.ceil(totalCount / limit),
        current_page: page,
        total_users: totalCount
    });
});
