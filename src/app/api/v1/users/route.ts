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

    const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
            take: limit,
            skip,
            select: {
                id: true,
                username: true,
                created_at: true,
                _count: {
                    select: {
                        questions: true,
                        answers: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        }),
        prisma.user.count()
    ]);

    const formattedUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        created_at: u.created_at,
        questionCount: u._count.questions,
        answerCount: u._count.answers,
        totalContributions: u._count.questions + u._count.answers
    }));

    return apiSuccess({
        users: formattedUsers,
        total_pages: Math.ceil(totalCount / limit),
        current_page: page,
        total_users: totalCount
    });
});
