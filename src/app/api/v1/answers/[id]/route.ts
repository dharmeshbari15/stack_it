import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, notFound, unauthorized } from '@/lib/api-handler';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { createAnswerVersion } from '@/lib/version-control';

export const DELETE = apiHandler<{ id: string }, any>(async (req: NextRequest, { params }) => {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        throw unauthorized('You must be signed in to delete an answer.');
    }

    const answer = await prisma.answer.findUnique({
        where: { id },
        select: { author_id: true, deleted_at: true }
    });

    if (!answer || answer.deleted_at) {
        throw notFound('Answer');
    }

    if (answer.author_id !== session.user.id) {
        throw unauthorized('You are not authorized to delete this answer.');
    }

    await prisma.answer.update({
        where: { id },
        data: { deleted_at: new Date() }
    });

    return apiSuccess({ message: 'Answer deleted successfully' });
});

export const PATCH = apiHandler<{ id: string }, any>(async (req: NextRequest, { params }) => {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        throw unauthorized('You must be signed in to edit an answer.');
    }

    const answer = await prisma.answer.findUnique({
        where: { id },
        select: { author_id: true, deleted_at: true, body: true }
    });

    if (!answer || answer.deleted_at) {
        throw notFound('Answer');
    }

    if (answer.author_id !== session.user.id) {
        throw unauthorized('You are not authorized to edit this answer.');
    }

    const body = await req.json();
    if (!body.body || body.body.length < 30) {
        throw new Error('Answer must be at least 30 characters long');
    }

    const { sanitizeHtml, isValidContent } = await import('@/lib/sanitizer');
    const sanitizedBody = sanitizeHtml(body.body);
    if (!isValidContent(sanitizedBody)) {
        throw new Error('Invalid content');
    }

    // Create a version before updating (capture current state)
    await createAnswerVersion(
        id,
        answer.body,
        session.user.id,
        body.edit_reason || undefined
    );

    await prisma.answer.update({
        where: { id },
        data: { body: sanitizedBody }
    });

    return apiSuccess({ message: 'Answer updated successfully' });
});
