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
import { embedQuestion } from '@/lib/embedding';
import { notifyFollowersOfNewQuestion } from '@/lib/follow';

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
        const tagIds: string[] = [];
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

            tagIds.push(tag.id);
        }

        return { question, tagIds };
    });

    // 5. Notify followers of tags about new question (asynchronously)
    notifyFollowersOfNewQuestion(newQuestion.question.id, newQuestion.tagIds, userId).catch(err => {
        console.error('Failed to notify followers of new question:', err);
    });

    // 6. Generate embedding for duplicate detection (async, non-blocking)
    // If this fails, the question is still created successfully
    if (process.env.OPENAI_API_KEY) {
        embedQuestion(newQuestion.question.id, title, sanitizedDescription).catch((error) => {
            console.error('Failed to generate embedding for question', newQuestion.question.id, error);
        });
    }

    // 7. Response
    return apiSuccess({
        id: newQuestion.question.id,
        title: newQuestion.question.title,
        created_at: newQuestion.question.created_at,
    }, 201);
});

// ─── GET Handler: Fetch Questions ─────────────────────────────────────────────

const getQuestionsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    tag: z.string().optional(),
    search: z.string().optional(),
    sort: z.enum(['newest', 'votes', 'unanswered', 'active']).default('newest'),
});

export const GET = apiHandler<any, QuestionsResponse>(async (req) => {
    try {
        // 1. Parse URL Query Parameters
        const { searchParams } = new URL(req.url);
        const rawQueryParams = {
            page: searchParams.get('page') ?? undefined,
            limit: searchParams.get('limit') ?? undefined,
            tag: searchParams.get('tag') ?? undefined,
            search: searchParams.get('search') ?? undefined,
            sort: searchParams.get('sort') ?? undefined,
        };

        const { page, limit, tag, search, sort } = getQuestionsQuerySchema.parse(rawQueryParams);

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

        // Enhanced search: search in title, description, and tags
        if (search && search.trim()) {
            const searchTerm = search.trim();
            const searchConditions: any[] = [
                {
                    title: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
                {
                    description: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
                {
                    tags: {
                        some: {
                            tag: {
                                name: {
                                    contains: searchTerm,
                                    mode: 'insensitive',
                                },
                            },
                        },
                    },
                },
            ];
            
            whereClause.OR = searchConditions;
        }

        // Determine ordering based on sort parameter
        let orderBy: any;
        switch (sort) {
            case 'votes':
                // Order by net vote score (upvotes - downvotes)
                orderBy = [
                    { score: 'desc' },
                    { created_at: 'desc' },
                ];
                break;
            case 'unanswered':
                // Filter to only unanswered questions
                whereClause.accepted_answer_id = null;
                whereClause.answers = {
                    none: {},
                };
                orderBy = { created_at: 'desc' };
                break;
            case 'active':
                // Order by most recently active (latest answer or update)
                orderBy = { updated_at: 'desc' };
                break;
            case 'newest':
            default:
                orderBy = { created_at: 'desc' };
                break;
        }

        // 3. Concurrent Database Query Request
        const [totalQuestions, questions] = await Promise.all([
            prisma.question.count({ where: whereClause }),
            prisma.question.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy,
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
                        select: {
                            answers: {
                                where: { deleted_at: null }
                            },
                            votes: true,
                        },
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
            upvotes: q.score,
            answers_count: q._count.answers,
            votes_count: q._count.votes,
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
