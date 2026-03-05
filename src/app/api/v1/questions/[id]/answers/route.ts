import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import DOMPurify from 'isomorphic-dompurify';
import * as z from 'zod';

const answerSchema = z.object({
    body: z.string().min(30, 'Answer must be at least 30 characters long'),
});

export const POST = apiHandler(async (
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) => {
    const session = await auth();

    if (!session?.user) {
        return {
            status: 401,
            body: { error: { message: 'Authentication required' } }
        };
    }

    const { id: questionId } = await params;

    // 1. Verify question exists and is not soft-deleted
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { id: true, deleted_at: true }
    });

    if (!question || question.deleted_at) {
        return {
            status: 404,
            body: { error: { message: 'Question not found' } }
        };
    }

    // 2. Validate request body
    const json = await req.json();
    const result = answerSchema.safeParse(json);

    if (!result.success) {
        return {
            status: 400,
            body: { error: { message: result.error.issues[0].message } }
        };
    }

    // 3. Sanitize HTML body
    const sanitizedBody = DOMPurify.sanitize(result.data.body);

    // 4. Create answer
    const answer = await prisma.answer.create({
        data: {
            body: sanitizedBody,
            question_id: questionId,
            author_id: session.user.id,
        },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                }
            }
        }
    });

    return {
        status: 201,
        body: {
            success: true,
            data: answer
        }
    };
});
