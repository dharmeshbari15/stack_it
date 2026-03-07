import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, badRequest, notFound, unauthorized } from '@/lib/api-handler';
import { parseBody } from '@/lib/validate';
import { isValidContent, sanitizeHtml } from '@/lib/sanitizer';
import { extractMentionUsernames } from '@/lib/comments';

const updateCommentSchema = z.object({
    body: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment is too long'),
});

export const PATCH = apiHandler<{ id: string }, { message: string }>(async (
    req: NextRequest,
    { params },
) => {
    const session = await auth();
    if (!session?.user?.id) {
        throw unauthorized('You must be signed in to edit a comment.');
    }

    const { id } = await params;
    const { body } = await parseBody(req, updateCommentSchema);

    const comment = await prisma.comment.findUnique({
        where: { id },
        select: {
            id: true,
            body: true,
            deleted_at: true,
            author_id: true,
            question_id: true,
            answer: {
                select: {
                    question_id: true,
                },
            },
        },
    });

    if (!comment || comment.deleted_at) {
        throw notFound('Comment');
    }

    if (comment.author_id !== session.user.id) {
        throw unauthorized('You are not authorized to edit this comment.');
    }

    const sanitizedBody = sanitizeHtml(body);
    if (!isValidContent(sanitizedBody)) {
        throw badRequest('Comment contains invalid or unsafe content.');
    }

    const oldMentions = new Set(extractMentionUsernames(comment.body));
    const newMentionUsernames = extractMentionUsernames(body).filter((username) => !oldMentions.has(username));

    const newlyMentionedUsers = newMentionUsernames.length
        ? await prisma.user.findMany({
            where: {
                username: { in: newMentionUsernames },
                id: { not: session.user.id },
            },
            select: {
                id: true,
            },
        })
        : [];

    const questionReferenceId = comment.question_id ?? comment.answer?.question_id;

    await prisma.$transaction(async (tx) => {
        await tx.comment.update({
            where: { id },
            data: { body: sanitizedBody },
        });

        if (questionReferenceId && newlyMentionedUsers.length > 0) {
            await tx.notification.createMany({
                data: newlyMentionedUsers.map((user) => ({
                    type: 'MENTION',
                    reference_id: questionReferenceId,
                    user_id: user.id,
                    actor_id: session.user.id,
                })),
            });
        }
    });

    return apiSuccess({ message: 'Comment updated successfully' });
});

export const DELETE = apiHandler<{ id: string }, { message: string }>(async (
    req: NextRequest,
    { params },
) => {
    const session = await auth();
    if (!session?.user?.id) {
        throw unauthorized('You must be signed in to delete a comment.');
    }

    const { id } = await params;

    const comment = await prisma.comment.findUnique({
        where: { id },
        select: {
            id: true,
            deleted_at: true,
            author_id: true,
        },
    });

    if (!comment || comment.deleted_at) {
        throw notFound('Comment');
    }

    if (comment.author_id !== session.user.id) {
        throw unauthorized('You are not authorized to delete this comment.');
    }

    await prisma.comment.update({
        where: { id },
        data: {
            deleted_at: new Date(),
        },
    });

    return apiSuccess({ message: 'Comment deleted successfully' });
});
