import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import * as z from 'zod';

const readSchema = z.object({
    notificationIds: z.array(z.string()).optional(),
});

export const PATCH = apiHandler(async (req: NextRequest) => {
    const session = await auth();

    if (!session?.user) {
        return {
            status: 401,
            body: { error: { message: 'Authentication required' } }
        };
    }

    // Parse body if it exists, otherwise default to empty object
    let body = {};
    try {
        const text = await req.text();
        if (text) {
            body = JSON.parse(text);
        }
    } catch {
        // Body-less request means mark all as read
    }

    const { notificationIds } = readSchema.parse(body);

    const where: any = {
        user_id: session.user.id,
        is_read: false,
    };

    if (notificationIds && notificationIds.length > 0) {
        where.id = { in: notificationIds };
    }

    const { count } = await prisma.notification.updateMany({
        where,
        data: {
            is_read: true,
        },
    });

    return {
        status: 200,
        body: {
            success: true,
            data: {
                updatedCount: count,
            }
        }
    };
});
