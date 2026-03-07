import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, unauthorized, notFound } from '@/lib/api-handler';
import { resolveSessionUserId } from '@/lib/auth-user';

export const GET = apiHandler(async () => {
    const session = await auth();

    if (!session?.user) {
        throw unauthorized('You must be signed in.');
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
        throw unauthorized('Unable to resolve your account. Please sign out and sign in again.');
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true },
    });

    if (!user) {
        throw notFound('User');
    }

    return apiSuccess(user);
});
