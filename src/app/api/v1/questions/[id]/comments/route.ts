import { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, badRequest, notFound, unauthorized } from '@/lib/api-handler';
import { parseBody } from '@/lib/validate';
import { isValidContent, sanitizeHtml } from '@/lib/sanitizer';
import { CommentListItem } from '@/types/api';
import { extractMentionUsernames } from '@/lib/comments';

const createCommentSchema = z.object({
    body: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment is too long'),
    parentId: z.string().uuid().nullable().optional(),
});

export const POST = apiHandler<{ id: string }, CommentListItem>(async (
    req: NextRequest,
    { params },
) => {
    const session = await auth();
    if (!session?.user?.id) {
        throw unauthorized('You must be signed in to comment.');
    }

    const { id: questionId } = await params;
    const { body, parentId } = await parseBody(req, createCommentSchema);

    const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { id: true, deleted_at: true },
    });

    if (!question || question.deleted_at) {
        throw notFound('Question');
    }

    if (parentId) {
        const parent = await prisma.comment.findFirst({
            where: {
                id: parentId,
                question_id: questionId,
                deleted_at: null,
            },
            select: { id: true },
        });

        if (!parent) {
            throw badRequest('Parent comment is invalid for this thread.');
        }
    }

    const sanitizedBody = sanitizeHtml(body);
    if (!isValidContent(sanitizedBody)) {
        throw badRequest('Comment contains invalid or unsafe content.');
    }

    const mentionUsernames = extractMentionUsernames(body);
    const mentionedUsers = mentionUsernames.length
        ? await prisma.user.findMany({
            where: {
                username: { in: mentionUsernames },
                id: { not: session.user.id },
            },
            select: { id: true, username: true },
        })
        : [];

    const created = await prisma.$transaction(async (tx) => {
        const comment = await tx.comment.create({
            data: {
                body: sanitizedBody,
                question_id: questionId,
                parent_id: parentId ?? null,
                author_id: session.user.id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        });

        if (mentionedUsers.length > 0) {
            await tx.notification.createMany({
                data: mentionedUsers.map((user) => ({
                    type: 'MENTION',
                    reference_id: questionId,
                    user_id: user.id,
                    actor_id: session.user.id,
                })),
            });
        }

        return comment;
    });

    return apiSuccess(
        {
            id: created.id,
            body: created.body,
            created_at: created.created_at,
            updated_at: created.updated_at,
            parent_id: created.parent_id,
            author: created.author,
            mentions: mentionedUsers,
            replies: [],
        },
        201,
    );
});
