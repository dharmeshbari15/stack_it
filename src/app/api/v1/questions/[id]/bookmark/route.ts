// app/api/v1/questions/[id]/bookmark/route.ts
// GET /api/v1/questions/{id}/bookmark - Check if question is bookmarked
// POST /api/v1/questions/{id}/bookmark - Quick bookmark endpoint
// DELETE /api/v1/questions/{id}/bookmark - Quick unbookmark endpoint

import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, unauthorized, notFound } from '@/lib/api-handler';
import { auth } from '@/auth';
import { resolveSessionUserId } from '@/lib/auth-user';

// ─── GET Handler - Check if question is bookmarked ────────────────────────────

export const GET = apiHandler(async (req, context) => {
    // 1. Authentication Check (optional - allow unauthenticated users to get 'false')
    const session = await auth();
    const userId = session ? await resolveSessionUserId(session) : null;

    // 2. Get Question ID from params
    const params = await context.params;
    const questionId = params.id;

    // 3. Verify Question Exists
    const question = await prisma.question.findUnique({
        where: { id: questionId },
    });

    if (!question) {
        throw notFound('Question not found.');
    }

    // 4. Check Bookmark Status
    if (!userId) {
        return apiSuccess({ is_bookmarked: false }, 200);
    }

    const bookmark = await prisma.bookmark.findUnique({
        where: {
            user_id_question_id: {
                user_id: userId,
                question_id: questionId,
            },
        },
    });

    return apiSuccess(
        {
            is_bookmarked: !!bookmark,
            bookmark_id: bookmark?.id || null,
        },
        200
    );
});

// ─── POST Handler - Quick bookmark (shorthand for /api/v1/bookmarks) ───────────

export const POST = apiHandler(async (req, context) => {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user) {
        throw unauthorized('You must be signed in to bookmark questions.');
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
        throw unauthorized('Unable to resolve your account. Please sign out and sign in again.');
    }

    // 2. Get Question ID from params
    const params = await context.params;
    const questionId = params.id;

    // 3. Verify Question Exists
    const question = await prisma.question.findUnique({
        where: { id: questionId },
    });

    if (!question) {
        throw notFound('Question not found.');
    }

    // 4. Check if Already Bookmarked
    const existingBookmark = await prisma.bookmark.findUnique({
        where: {
            user_id_question_id: {
                user_id: userId,
                question_id: questionId,
            },
        },
    });

    if (existingBookmark) {
        return apiSuccess(
            {
                id: existingBookmark.id,
                is_bookmarked: true,
                message: 'Question is already bookmarked.',
            },
            200
        );
    }

    // 5. Create Bookmark
    const bookmark = await prisma.bookmark.create({
        data: {
            user_id: userId,
            question_id: questionId,
        },
    });

    return apiSuccess(
        {
            id: bookmark.id,
            is_bookmarked: true,
            message: 'Question bookmarked successfully.',
        },
        201
    );
});

// ─── DELETE Handler - Quick unbookmark ──────────────────────────────────────────

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

    // 2. Get Question ID from params
    const params = await context.params;
    const questionId = params.id;

    // 3. Verify Question Exists
    const question = await prisma.question.findUnique({
        where: { id: questionId },
    });

    if (!question) {
        throw notFound('Question not found.');
    }

    // 4. Find and Delete Bookmark
    const bookmark = await prisma.bookmark.findUnique({
        where: {
            user_id_question_id: {
                user_id: userId,
                question_id: questionId,
            },
        },
    });

    if (!bookmark) {
        return apiSuccess(
            {
                is_bookmarked: false,
                message: 'Question was already not bookmarked.',
            },
            200
        );
    }

    await prisma.bookmark.delete({
        where: { id: bookmark.id },
    });

    return apiSuccess(
        {
            is_bookmarked: false,
            message: 'Bookmark removed successfully.',
        },
        200
    );
});
