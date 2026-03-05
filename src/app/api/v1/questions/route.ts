// app/api/v1/questions/route.ts
// POST /api/v1/questions
//
// Creates a new question from an authenticated user.
// Expects: { title, description, tags: ["tag1"] }

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, badRequest, unauthorized } from '@/lib/api-handler';
import { parseBody } from '@/lib/validate';
import { auth } from '@/auth';
import { sanitizeHtml, isValidContent } from '@/lib/sanitizer';
import { CreateQuestionResponse, QuestionsResponse } from '@/types/api';

// ─── Request Schema ───────────────────────────────────────────────────────────

const createQuestionSchema = z.object({
    title: z
        .string()
        .min(5, 'Title must be at least 5 characters')
        .max(255, 'Title must be at most 255 characters'),
    description: z
        .string()
        .min(20, 'Description must be at least 20 characters'),
    tags: z
        .array(
            z.string()
                .min(1, 'Tag cannot be empty')
                .max(30, 'Tag must be at most 30 characters')
                .toLowerCase() // Normalize tags to lowercase
        )
        .min(1, 'You must provide at least one tag')
        .max(5, 'You can provide at most 5 tags'),
});

// ─── Handler ──────────────────────────────────────────────────────────────────

export const POST = apiHandler<any, CreateQuestionResponse>(async (req) => {
    // 1. Authentication Check
    const session = await auth();
    if (!session?.user?.id) {
        throw unauthorized('You must be signed in to ask a question.');
    }

    // 2. Input Validation
    const { title, description, tags } = await parseBody(req, createQuestionSchema);

    // Remove duplicates from tags
    const uniqueTags = [...new Set(tags)];

    // 3. XSS Sanitization
    const sanitizedDescription = sanitizeHtml(description);

    if (!isValidContent(sanitizedDescription)) {
        throw badRequest('Description contains invalid or unsafe content.');
    }

    const userId = session.user?.id;
    if (!userId) {
        throw unauthorized('User ID not found in session.');
    }

    // 4. Database Transaction
    // Use Prisma $transaction to ensure Question, Tags, and QuestionTags all succeed or fail together
    const newQuestion = await prisma.$transaction(async (tx) => {
        // a. Create the Question record
        const question = await tx.question.create({
            data: {
                title,
                description: sanitizedDescription,
                author_id: userId,
            },
        });

        // b. Upsert all provided tags and link them to the new question
        for (const tagName of uniqueTags) {
            // Prisma doesn't support nested upserts in create directly quite like this easily for M:N
            // where the Tag ID is a UUID. So we upsert the Tag first, then create QuestionTag.

            const tag = await tx.tag.upsert({
                where: { name: tagName },
                update: {}, // no update needed if exists
                create: { name: tagName },
            });

            await tx.questionTag.create({
                data: {
                    question_id: question.id,
                    tag_id: tag.id,
                },
            });
        }

        return question;
    });

    // 5. Response
    return apiSuccess({
        id: newQuestion.id,
        title: newQuestion.title,
        created_at: newQuestion.created_at,
    }, 201);
});

// ─── GET Handler: Fetch Questions ─────────────────────────────────────────────

const getQuestionsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    tag: z.string().optional(),
});

export const GET = apiHandler<any, QuestionsResponse>(async (req) => {
    try {
        // 1. Parse URL Query Parameters
        const { searchParams } = new URL(req.url);
        const rawQueryParams = {
            page: searchParams.get('page') ?? undefined,
            limit: searchParams.get('limit') ?? undefined,
            tag: searchParams.get('tag') ?? undefined,
        };

        const { page, limit, tag } = getQuestionsQuerySchema.parse(rawQueryParams);

        // 2. Query Calculation Base
        const skip = (page - 1) * limit;

        // Construct the Prisma `where` clause
        const whereClause: any = {
            deleted_at: null, // Only fetch active questions
        };

        if (tag) {
            whereClause.tags = {
                some: {
                    tag: {
                        name: tag.toLowerCase().trim(),
                    },
                },
            };
        }

        // 3. Concurrent Database Query Request
        const [totalQuestions, questions] = await Promise.all([
            prisma.question.count({ where: whereClause }),
            prisma.question.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: {
                    created_at: 'desc',
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    tags: {
                        include: {
                            tag: true, // Fetch the actual nested Tag string entity
                        },
                    },
                    _count: {
                        select: { answers: true },
                    },
                },
            }),
        ]);

        // 4. Format Output
        const formattedQuestions = questions.map((q) => ({
            id: q.id,
            title: q.title,
            description: q.description,
            author: {
                id: q.author.id,
                username: q.author.username,
            },
            tags: q.tags.map((qt) => qt.tag.name),
            answers_count: q._count.answers,
            accepted_answer_id: q.accepted_answer_id,
            created_at: q.created_at,
        }));

        // 5. Context Response
        const total_pages = Math.ceil(totalQuestions / limit);

        return apiSuccess({
            questions: formattedQuestions,
            total_pages,
            current_page: page,
            total_questions: totalQuestions,
        });
    } catch (error) {
        if (error instanceof Error && 'statusCode' in error) throw error;
        throw error; // Re-throw to be caught by apiHandler
    }
});
