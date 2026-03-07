// app/api/v1/bookmarks/route.ts
// GET /api/v1/bookmarks?tag=javascript - Get bookmarked questions
// POST /api/v1/bookmarks - Add a bookmark

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, badRequest, unauthorized, notFound } from '@/lib/api-handler';
import { parseBody } from '@/lib/validate';
import { auth } from '@/auth';
import { resolveSessionUserId } from '@/lib/auth-user';

// ─── Request Schemas ──────────────────────────────────────────────────────────

const createBookmarkSchema = z.object({
    question_id: z.string().uuid('Invalid question ID'),
    custom_tag: z
        .string()
        .max(100, 'Tag must be at most 100 characters')
        .optional()
        .nullable(),
});

const getBookmarksSchema = z.object({
    tag: z.string().max(100).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
});

function normalizeCustomTag(tag?: string | null): string | null {
    if (typeof tag !== 'string') return null;
    const trimmed = tag.trim();
    return trimmed.length > 0 ? trimmed : null;
}

// ─── GET Handler - Fetch user's bookmarks ──────────────────────────────────────

export const GET = apiHandler(async (req) => {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user) {
        throw unauthorized('You must be signed in to view bookmarks.');
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
        throw unauthorized('Unable to resolve your account. Please sign out and sign in again.');
    }

    // 2. Query Parameter Validation
    const url = new URL(req.url);
    const queryParams = {
        tag: url.searchParams.get('tag') || undefined,
        limit: url.searchParams.get('limit') || '20',
        offset: url.searchParams.get('offset') || '0',
    };

    const { tag, limit, offset } = getBookmarksSchema.parse(queryParams);

    // 3. Fetch Bookmarks
    const normalizedTag = normalizeCustomTag(tag);
    const where = {
        user_id: userId,
        ...(normalizedTag
            ? {
                  custom_tag: {
                      equals: normalizedTag,
                      mode: 'insensitive' as const,
                  },
              }
            : {}),
    };

    const [bookmarks, total, availableTagsRaw] = await Promise.all([
        prisma.bookmark.findMany({
            where,
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
            orderBy: { created_at: 'desc' },
            skip: offset,
            take: limit,
        }),
        prisma.bookmark.count({ where }),
        prisma.bookmark.findMany({
            where: {
                user_id: userId,
                custom_tag: { not: null },
            },
            select: {
                custom_tag: true,
            },
            distinct: ['custom_tag'],
        }),
    ]);

    const available_tags = availableTagsRaw
        .map((b) => normalizeCustomTag(b.custom_tag))
        .filter((t): t is string => !!t)
        .sort((a, b) => a.localeCompare(b));

    return apiSuccess(
        {
            bookmarks: bookmarks.map((b) => ({
                id: b.id,
                question_id: b.question_id,
                custom_tag: b.custom_tag,
                created_at: b.created_at,
                question: {
                    id: b.question.id,
                    title: b.question.title,
                    description: b.question.description,
                    score: b.question.score,
                    created_at: b.question.created_at,
                    author: b.question.author,
                    tags: b.question.tags.map((qt) => ({
                        id: qt.tag.id,
                        name: qt.tag.name,
                    })),
                },
            })),
            total,
            limit,
            offset,
            available_tags,
        },
        200
    );
});

// ─── POST Handler - Create a bookmark ──────────────────────────────────────────

export const POST = apiHandler(async (req) => {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user) {
        throw unauthorized('You must be signed in to bookmark questions.');
    }

    const userId = await resolveSessionUserId(session);
    if (!userId) {
        throw unauthorized('Unable to resolve your account. Please sign out and sign in again.');
    }

    // 2. Input Validation
    const { question_id, custom_tag } = await parseBody(req, createBookmarkSchema);
    const normalizedCustomTag = normalizeCustomTag(custom_tag);

    // 3. Verify Question Exists
    const question = await prisma.question.findUnique({
        where: { id: question_id },
    });

    if (!question) {
        throw notFound('Question not found.');
    }

    // 4. Check if Already Bookmarked
    const existingBookmark = await prisma.bookmark.findUnique({
        where: {
            user_id_question_id: {
                user_id: userId,
                question_id,
            },
        },
    });

    if (existingBookmark) {
        throw badRequest('You have already bookmarked this question.');
    }

    // 5. Create Bookmark
    const bookmark = await prisma.bookmark.create({
        data: {
            user_id: userId,
            question_id,
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
            id: bookmark.id,
            question_id: bookmark.question_id,
            custom_tag: bookmark.custom_tag,
            created_at: bookmark.created_at,
            question: {
                id: bookmark.question.id,
                title: bookmark.question.title,
                description: bookmark.question.description,
                score: bookmark.question.score,
                created_at: bookmark.question.created_at,
                author: bookmark.question.author,
                tags: bookmark.question.tags.map((qt) => ({
                    id: qt.tag.id,
                    name: qt.tag.name,
                })),
            },
        },
        201
    );
});
