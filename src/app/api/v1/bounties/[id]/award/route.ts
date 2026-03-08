// app/api/v1/bounties/[id]/award/route.ts
// POST: Award a bounty to an answer/user

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, unauthorized, badRequest, notFound, forbidden } from '@/lib/api-handler';
import { awardBounty } from '@/lib/bounty';
import { resolveSessionUserId } from '@/lib/auth-user';
import * as z from 'zod';

const awardBountySchema = z.object({
  awarded_to_user_id: z.string().uuid('Invalid user ID'),
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

  const { id: bountyId } = await params;

  const body = await req.json();
  const { awarded_to_user_id } = awardBountySchema.parse(body);

  // Get bounty and verify user is the offerer
  const bounty = await prisma.bounty.findUnique({
    where: { id: bountyId },
    select: { offered_by_id: true },
  });

  if (!bounty) {
    throw notFound('Bounty');
  }

  if (bounty.offered_by_id !== userId) {
    throw forbidden('Only the bounty offerer can award it');
  }

  try {
    const result = await awardBounty(bountyId, awarded_to_user_id);
    return apiSuccess(result);
  } catch (error) {
    if (error instanceof Error) {
      throw badRequest(error.message);
    }
    throw error;
  }
});
