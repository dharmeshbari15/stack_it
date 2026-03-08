// app/api/v1/versions/rollback/route.ts
// POST: Rollback to a previous version

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, unauthorized, badRequest, notFound, forbidden } from '@/lib/api-handler';
import { rollbackQuestion, rollbackAnswer } from '@/lib/version-control';
import { resolveSessionUserId } from '@/lib/auth-user';
import * as z from 'zod';

const rollbackSchema = z.object({
  type: z.enum(['question', 'answer']),
  entity_id: z.string().uuid(),
  version_number: z.number().int().min(1),
});

export const POST = apiHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    throw unauthorized();
  }

  const userId = await resolveSessionUserId(session);
  if (!userId) {
    throw unauthorized('Your session is invalid. Please sign out and sign in again.');
  }

  const body = await req.json();

  try {
    const { type, entity_id, version_number } = rollbackSchema.parse(body);

    if (type === 'question') {
      // Verify user is the question author
      const question = await prisma.question.findUnique({
        where: { id: entity_id },
        select: { author_id: true, deleted_at: true },
      });

      if (!question || question.deleted_at) {
        throw notFound('Question');
      }

      if (question.author_id !== userId) {
        throw forbidden('Only the question author can rollback');
      }

      await rollbackQuestion(entity_id, version_number, userId);

      return apiSuccess({
        message: `Question rolled back to version ${version_number}`,
        type: 'question',
      });
    } else if (type === 'answer') {
      // Verify user is the answer author
      const answer = await prisma.answer.findUnique({
        where: { id: entity_id },
        select: { author_id: true, deleted_at: true },
      });

      if (!answer || answer.deleted_at) {
        throw notFound('Answer');
      }

      if (answer.author_id !== userId) {
        throw forbidden('Only the answer author can rollback');
      }

      await rollbackAnswer(entity_id, version_number, userId);

      return apiSuccess({
        message: `Answer rolled back to version ${version_number}`,
        type: 'answer',
      });
    }

    throw badRequest('Invalid type');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw notFound('Version not found');
      }
      throw badRequest(error.message);
    }
    throw error;
  }
});
