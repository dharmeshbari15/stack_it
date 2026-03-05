import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';

export const GET = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
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
        return {
            status: 404,
            body: { error: { message: 'User not found' } }
        };
    }

    return {
        status: 200,
        body: {
            success: true,
            data: user
        }
    };
});
