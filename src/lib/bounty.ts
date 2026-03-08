// lib/bounty.ts
// Bounty system utilities

import { prisma } from './prisma';
import { awardReputation } from './reputation';
import type { Prisma } from '../generated/prisma/client';

export interface BountyWithDetails {
  id: string;
  question_id: string;
  reputation_amount: number;
  offered_at: Date;
  expires_at: Date;
  status: 'ACTIVE' | 'AWARDED' | 'EXPIRED' | 'CANCELLED';
  offered_by: {
    id: string;
    username: string;
  };
  awarded_to?: {
    id: string;
    username: string;
  } | null;
  awarded_at?: Date | null;
  time_remaining?: number; // milliseconds
}

/**
 * Offer a bounty on a question
 */
export async function offerBounty(
  questionId: string,
  userId: string,
  reputationAmount: number,
  durationDays: number = 7
): Promise<BountyWithDetails> {
  // Verify user has enough reputation
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { reputation: true },
  });

  if (!user || user.reputation < reputationAmount) {
    throw new Error('Insufficient reputation to offer this bounty');
  }

  // Verify question exists
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, deleted_at: true },
  });

  if (!question || question.deleted_at) {
    throw new Error('Question not found');
  }

  // Check for existing active bounty from this user
  const existingBounty = await prisma.bounty.findUnique({
    where: {
      question_id_offered_by_id: {
        question_id: questionId,
        offered_by_id: userId,
      },
    },
    select: { status: true },
  });

  if (existingBounty?.status === 'ACTIVE') {
    throw new Error('You already have an active bounty on this question');
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  // Deduct reputation from user
  await prisma.user.update({
    where: { id: userId },
    data: { reputation: { decrement: reputationAmount } },
  });

  // Create bounty
  const bounty = await prisma.bounty.create({
    data: {
      question_id: questionId,
      offered_by_id: userId,
      reputation_amount: reputationAmount,
      expires_at: expiresAt,
    },
    include: {
      offered_by: { select: { id: true, username: true } },
      awarded_to: { select: { id: true, username: true } },
    },
  });

  return {
    ...bounty,
    status: bounty.status as 'ACTIVE' | 'AWARDED' | 'EXPIRED' | 'CANCELLED',
  };
}

/**
 * Award bounty to an answer/user
 */
export async function awardBounty(
  bountyId: string,
  awardedToUserId: string,
  tx?: Prisma.TransactionClient
): Promise<BountyWithDetails> {
  const client = tx || prisma;

  const bounty = await client.bounty.findUnique({
    where: { id: bountyId },
    include: {
      offered_by: { select: { id: true, username: true } },
    },
  });

  if (!bounty) {
    throw new Error('Bounty not found');
  }

  if (bounty.status !== 'ACTIVE') {
    throw new Error(`Bounty is already ${bounty.status.toLowerCase()}`);
  }

  if (new Date() > bounty.expires_at) {
    throw new Error('Bounty has expired');
  }

  // Award reputation to user
  if (tx) {
    // If transaction is provided, use it
    await tx.user.update({
      where: { id: awardedToUserId },
      data: { reputation: { increment: bounty.reputation_amount } },
    });
  } else {
    // Otherwise, use prisma directly
    await prisma.$transaction(async (tx) => {
      await awardReputation(
        tx,
        awardedToUserId,
        'ANSWER_UPVOTE', // Use as placeholder; reputation is directly added
        bountyId
      );
    });

    // Also increment reputation directly
    await prisma.user.update({
      where: { id: awardedToUserId },
      data: { reputation: { increment: bounty.reputation_amount } },
    });
  }

  // Update bounty status
  const updated = await client.bounty.update({
    where: { id: bountyId },
    data: {
      status: 'AWARDED',
      awarded_to_id: awardedToUserId,
      awarded_at: new Date(),
      awarded_reason: 'Manually awarded',
    },
    include: {
      offered_by: { select: { id: true, username: true } },
      awarded_to: { select: { id: true, username: true } },
    },
  });

  return {
    ...updated,
    status: updated.status as 'ACTIVE' | 'AWARDED' | 'EXPIRED' | 'CANCELLED',
  };
}

/**
 * Auto-award bounty to best answer (highest score)
 */
export async function autoAwardBountyToBestAnswer(
  questionId: string
): Promise<BountyWithDetails | null> {
  const bounty = await prisma.bounty.findFirst({
    where: {
      question_id: questionId,
      status: 'ACTIVE',
    },
  });

  if (!bounty || new Date() < bounty.expires_at) {
    return null; // No bounty or not expired yet
  }

  // Get the best answer (highest score)
  const bestAnswer = await prisma.answer.findFirst({
    where: {
      question_id: questionId,
      deleted_at: null,
    },
    orderBy: { score: 'desc' },
    select: { id: true, author_id: true },
  });

  if (!bestAnswer) {
    // No answers, expire bounty without awarding
    return await prisma.bounty.update({
      where: { id: bounty.id },
      data: { status: 'EXPIRED' },
      include: {
        offered_by: { select: { id: true, username: true } },
        awarded_to: { select: { id: true, username: true } },
      },
    }) as BountyWithDetails;
  }

  // Award the bounty
  return await awardBounty(bounty.id, bestAnswer.author_id);
}

/**
 * Get bounties for a question
 */
export async function getQuestionBounties(
  questionId: string
): Promise<BountyWithDetails[]> {
  const bounties = await prisma.bounty.findMany({
    where: { question_id: questionId },
    include: {
      offered_by: { select: { id: true, username: true } },
      awarded_to: { select: { id: true, username: true } },
    },
    orderBy: { offered_at: 'desc' },
  });

  return bounties.map((b) => ({
    ...b,
    status: b.status as 'ACTIVE' | 'AWARDED' | 'EXPIRED' | 'CANCELLED',
    time_remaining: Math.max(0, b.expires_at.getTime() - Date.now()),
  }));
}

/**
 * Get total active bounty amount for a question
 */
export async function getTotalActiveBounty(questionId: string): Promise<number> {
  const result = await prisma.bounty.aggregate({
    where: {
      question_id: questionId,
      status: 'ACTIVE',
    },
    _sum: { reputation_amount: true },
  });

  return result._sum.reputation_amount || 0;
}

/**
 * Cancel a bounty and refund reputation
 */
export async function cancelBounty(
  bountyId: string,
  userId: string
): Promise<BountyWithDetails> {
  const bounty = await prisma.bounty.findUnique({
    where: { id: bountyId },
  });

  if (!bounty) {
    throw new Error('Bounty not found');
  }

  if (bounty.offered_by_id !== userId) {
    throw new Error('Only the bounty offerer can cancel');
  }

  if (bounty.status !== 'ACTIVE') {
    throw new Error('Can only cancel active bounties');
  }

  // Refund reputation
  await prisma.user.update({
    where: { id: userId },
    data: { reputation: { increment: bounty.reputation_amount } },
  });

  // Update bounty status
  const updated = await prisma.bounty.update({
    where: { id: bountyId },
    data: { status: 'CANCELLED' },
    include: {
      offered_by: { select: { id: true, username: true } },
      awarded_to: { select: { id: true, username: true } },
    },
  });

  return {
    ...updated,
    status: updated.status as 'ACTIVE' | 'AWARDED' | 'EXPIRED' | 'CANCELLED',
  };
}

/**
 * Cleanup expired bounties and auto-award if applicable
 */
export async function cleanupExpiredBounties(): Promise<number> {
  const now = new Date();

  // Find all active bounties that have expired
  const expiredBounties = await prisma.bounty.findMany({
    where: {
      status: 'ACTIVE',
      expires_at: { lte: now },
    },
    select: { id: true, question_id: true },
  });

  let awardedCount = 0;

  for (const bounty of expiredBounties) {
    try {
      const result = await autoAwardBountyToBestAnswer(bounty.question_id);
      if (result?.status === 'AWARDED') {
        awardedCount++;
      }
    } catch (error) {
      console.error(`Failed to auto-award bounty ${bounty.id}:`, error);
    }
  }

  return awardedCount;
}
