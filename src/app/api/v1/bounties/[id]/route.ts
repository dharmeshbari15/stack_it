// app/api/v1/bounties/[id]/route.ts
// DELETE: Cancel a bounty

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, unauthorized, notFound, forbidden, badRequest } from '@/lib/api-handler';
import { cancelBounty } from '@/lib/bounty';
import { resolveSessionUserId } from '@/lib/auth-user';

export const DELETE = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await auth();
  if (!session?.user) {
    throw unauthorized();
  }

  const userId = await resolveSessionUserId(session);
  if (!userId) {
    throw unauthorized('Your session is invalid. Please sign out and sign in again.');
  }

  const { id: bountyId } = await params;

  // Verify bounty exists
  const bounty = await prisma.bounty.findUnique({
    where: { id: bountyId },
    select: { id: true },
  });

  if (!bounty) {
    throw notFound('Bounty');
  }

  try {
    await cancelBounty(bountyId, userId);
    return apiSuccess({ message: 'Bounty cancelled and reputation refunded' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Only the bounty offerer')) {
        throw forbidden(error.message);
      }
      throw badRequest(error.message);
    }
    throw error;
  }
});
