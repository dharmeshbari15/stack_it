import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, unauthorized } from '@/lib/api-handler';
import { NotificationItem } from '@/types/api';

export const GET = apiHandler<any, NotificationItem[]>(async (req: NextRequest) => {
    const session = await auth();

    if (!session?.user) {
        throw unauthorized();
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    const notifications = await prisma.notification.findMany({
        where: {
            user_id: session.user.id,
        },
        orderBy: {
            created_at: 'desc',
        },
        take: limit,
        include: {
            actor: {
                select: {
                    id: true,
                    username: true,
                }
            }
        }
    });

    return apiSuccess(notifications as NotificationItem[]);
});
