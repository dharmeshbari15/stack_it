// app/api/v1/bookmarks/[id]/route.ts
// DELETE /api/v1/bookmarks/{id} - Remove a bookmark
// PUT /api/v1/bookmarks/{id} - Update bookmark's custom_tag

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, unauthorized, notFound } from '@/lib/api-handler';
import { parseBody } from '@/lib/validate';
import { auth } from '@/auth';
import { resolveSessionUserId } from '@/lib/auth-user';

// ─── Request Schemas ──────────────────────────────────────────────────────────

const updateBookmarkSchema = z.object({
    custom_tag: z
        .union([
            z.string().max(100, 'Tag must be at most 100 characters'),
            z.null(),
        ])
        .optional(),
});

function normalizeCustomTag(tag?: string | null): string | null {
    if (typeof tag !== 'string') return null;
    const trimmed = tag.trim();
    return trimmed.length > 0 ? trimmed : null;
}

// ─── DELETE Handler - Remove a bookmark ────────────────────────────────────────

export const DELETE = apiHandler(async (req, context) => {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user) {
        throw unauthorized('You must be signed in to remove bookmarks.');
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
        throw unauthorized('Unable to resolve your account. Please sign out and sign in again.');
    }

    // 2. Get Bookmark ID from params
    const params = await context.params;
    const bookmarkId = params.id;

    // 3. Verify Bookmark Exists and Belongs to User
    const bookmark = await prisma.bookmark.findUnique({
        where: { id: bookmarkId },
    });

    if (!bookmark) {
        throw notFound('Bookmark not found.');
    }

    if (bookmark.user_id !== userId) {
        throw unauthorized('You can only remove your own bookmarks.');
    }

    // 4. Delete Bookmark
    await prisma.bookmark.delete({
        where: { id: bookmarkId },
    });

    return apiSuccess({ message: 'Bookmark removed successfully.' }, 200);
});

// ─── PUT Handler - Update bookmark's custom_tag ────────────────────────────────

export const PUT = apiHandler(async (req, context) => {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user) {
        throw unauthorized('You must be signed in to update bookmarks.');
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
        throw unauthorized('Unable to resolve your account. Please sign out and sign in again.');
    }

    // 2. Get Bookmark ID from params
    const params = await context.params;
    const bookmarkId = params.id;

    // 3. Input Validation
    const { custom_tag } = await parseBody(req, updateBookmarkSchema);
    const normalizedCustomTag = normalizeCustomTag(custom_tag);

    // 4. Verify Bookmark Exists and Belongs to User
    const bookmark = await prisma.bookmark.findUnique({
        where: { id: bookmarkId },
        include: {
            question: {
                include: {
                    author: {
                        select: { id: true, username: true },
                    },
                    tags: {
                        include: { tag: true },
                    },
                },
            },
        },
    });

    if (!bookmark) {
        throw notFound('Bookmark not found.');
    }

    if (bookmark.user_id !== userId) {
        throw unauthorized('You can only update your own bookmarks.');
    }

    // 5. Update Bookmark
    const updatedBookmark = await prisma.bookmark.update({
        where: { id: bookmarkId },
        data: {
            custom_tag: normalizedCustomTag,
        },
        include: {
            question: {
                include: {
                    author: {
                        select: { id: true, username: true },
                    },
                    tags: {
                        include: { tag: true },
                    },
                },
            },
        },
    });

    return apiSuccess(
        {
            id: updatedBookmark.id,
            question_id: updatedBookmark.question_id,
            custom_tag: updatedBookmark.custom_tag,
            created_at: updatedBookmark.created_at,
            question: {
                id: updatedBookmark.question.id,
                title: updatedBookmark.question.title,
                description: updatedBookmark.question.description,
                score: updatedBookmark.question.score,
                created_at: updatedBookmark.question.created_at,
                author: updatedBookmark.question.author,
                tags: updatedBookmark.question.tags.map((qt) => ({
                    id: qt.tag.id,
                    name: qt.tag.name,
                })),
            },
        },
        200
    );
});
