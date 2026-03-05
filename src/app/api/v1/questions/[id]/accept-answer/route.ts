import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler } from '@/lib/api-handler';
import * as z from 'zod';

const acceptAnswerSchema = z.object({
    answerId: z.string().uuid('Invalid Answer ID'),
});

export const PATCH = apiHandler(async (
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

    // 1. Validate request body
    const json = await req.json();
    const result = acceptAnswerSchema.safeParse(json);

    if (!result.success) {
        return {
            status: 400,
            body: { error: { message: result.error.issues[0].message } }
        };
    }

    const { answerId } = result.data;

    // 2. Fetch question and verify ownership
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: {
            author_id: true,
            deleted_at: true
        }
    });

    if (!question || question.deleted_at) {
        return {
            status: 404,
            body: { error: { message: 'Question not found' } }
        };
    }

    if (question.author_id !== session.user.id) {
        return {
            status: 403,
            body: { error: { message: 'Only the question author can accept an answer' } }
        };
    }

    // 3. Verify answer exists and belongs to this question
    const answer = await prisma.answer.findUnique({
        where: { id: answerId },
        select: {
            question_id: true,
            deleted_at: true
        }
    });

    if (!answer || answer.deleted_at || answer.question_id !== questionId) {
        return {
            status: 400,
            body: { error: { message: 'Invalid answer for this question' } }
        };
    }

    // 4. Update question with accepted answer
    const updatedQuestion = await prisma.question.update({
        where: { id: questionId },
        data: {
            accepted_answer_id: answerId,
        },
        select: {
            id: true,
            accepted_answer_id: true,
        }
    });

    return {
        status: 200,
        body: {
            success: true,
            data: updatedQuestion
        }
    };
});
