// app/api/v1/questions/[id]/bounties/route.ts
// GET: Get bounties for a question
// POST: Offer a new bounty

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, unauthorized, badRequest, notFound } from '@/lib/api-handler';
import { getQuestionBounties, offerBounty } from '@/lib/bounty';
import { resolveSessionUserId } from '@/lib/auth-user';
import * as z from 'zod';

const offerBountySchema = z.object({
  reputation_amount: z.number().int().min(10, 'Bounty must be at least 10 reputation').max(5000, 'Bounty cannot exceed 5000 reputation'),
  duration_days: z.number().int().min(1).max(365).optional().default(7),
});

export const GET = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id: questionId } = await params;

  // Verify question exists
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, deleted_at: true },
  });

  if (!question || question.deleted_at) {
    throw notFound('Question');
  }

  const bounties = await getQuestionBounties(questionId);
  return apiSuccess(bounties);
});

export const POST = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth();
  if (!session?.user) {
    throw unauthorized();
  }

  const userId = await resolveSessionUserId(session);
  if (!userId) {
    throw unauthorized('Your session is invalid. Please sign out and sign in again.');
  }

  const { id: questionId } = await params;

  const body = await req.json();
  const { reputation_amount, duration_days } = offerBountySchema.parse(body);

  try {
    const bounty = await offerBounty(questionId, userId, reputation_amount, duration_days);
    return apiSuccess(bounty, 201);
  } catch (error) {
    if (error instanceof Error) {
      throw badRequest(error.message);
    }
    throw error;
  }
});
