import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';

export const GET = apiHandler(async (req: NextRequest) => {
    const session = await auth();

    if (!session?.user) {
        return {
            status: 401,
            body: { error: { message: 'Authentication required' } }
        };
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

    // Optionally enrich with basic context if needed
    // For now, returning the raw notifications with actor info is sufficient
    // as the reference_id can be used by the frontend to link.

    return {
        status: 200,
        body: {
            success: true,
            data: notifications
        }
    };
});
