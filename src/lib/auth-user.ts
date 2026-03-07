import type { Session } from 'next-auth';
import { prisma } from '@/lib/prisma';

/**
 * Resolve the actual database user id for the current session.
 * Falls back to session email if the JWT id is stale.
 */
export async function resolveSessionUserId(session: Session): Promise<string | null> {
    const sessionId = session.user?.id;

    if (sessionId) {
        const userById = await prisma.user.findUnique({
            where: { id: sessionId },
            select: { id: true },
        });

        if (userById) return userById.id;
        
        // Session ID is stale, log warning
        console.warn(`Session contains stale user ID: ${sessionId}, attempting email fallback`);
    }

    const email = session.user?.email;
    if (!email) {
        console.error('Cannot resolve user: no valid ID and no email in session');
        return null;
    }

    const userByEmail = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (userByEmail) {
        console.log(`Resolved user by email fallback: ${email} -> ${userByEmail.id}`);
    } else {
        console.error(`User not found by email: ${email}`);
    }

    return userByEmail?.id ?? null;
}
