import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, notFound } from '@/lib/api-handler';
import { UserStats } from '@/types/api';

export const GET = apiHandler<{ id: string }, UserStats>(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: userId } = await params;

    const user = await prisma.user.findUnique({
        where: { id: userId },
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
        }
    });

    if (!user) {
        throw notFound('User');
    }

    return apiSuccess(user as UserStats);
});
