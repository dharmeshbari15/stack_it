// lib/reputation.ts
// Reputation and gamification system logic

import { PrismaClient } from '../generated/prisma/client';
import type { Prisma } from '../generated/prisma/client';

// Reputation point values
export const REPUTATION_VALUES = {
    QUESTION_UPVOTE: 5,
    QUESTION_DOWNVOTE: -2,
    ANSWER_UPVOTE: 10,
    ANSWER_DOWNVOTE: -2,
    ANSWER_ACCEPTED: 15,
    ANSWER_UNACCEPTED: -15,
} as const;

// Reputation-based permissions
export const REPUTATION_THRESHOLDS = {
    VOTE: 15,
    COMMENT: 50,
    EDIT_OWN: 100,
    EDIT_ANY: 2000,
    DELETE_ANY: 5000,
    MODERATOR: 10000,
} as const;

export type ReputationChangeReason = keyof typeof REPUTATION_VALUES;

/**
 * Award reputation points to a user and record the change in history
 */
export async function awardReputation(
    tx: Prisma.TransactionClient,
    userId: string,
    reason: ReputationChangeReason,
    referenceId?: string
): Promise<void> {
    const change = REPUTATION_VALUES[reason];

    // Update user reputation
    await tx.user.update({
        where: { id: userId },
        data: {
            reputation: {
                increment: change,
            },
        },
    });

    // Record in history
    await tx.reputationHistory.create({
        data: {
            user_id: userId,
            change,
            reason,
            reference_id: referenceId,
        },
    });
}

/**
 * Reverse/remove previously awarded reputation (e.g., when a vote is removed)
 * This awards the negative of the original reputation value
 */
export async function reverseReputation(
    tx: Prisma.TransactionClient,
    userId: string,
    reason: ReputationChangeReason,
    referenceId?: string
): Promise<void> {
    const originalChange = REPUTATION_VALUES[reason];
    const reverseChange = -originalChange;

    // Update user reputation (reverse the original change)
    await tx.user.update({
        where: { id: userId },
        data: {
            reputation: {
                increment: reverseChange,
            },
        },
    });

    // Record in history with reversed value
    await tx.reputationHistory.create({
        data: {
            user_id: userId,
            change: reverseChange,
            // Keep enum-compatible reason while storing reverse numeric change.
            reason,
            reference_id: referenceId,
        },
    });
}

/**
 * Check if a user has permission based on their reputation
 */
export function hasReputationPermission(
    reputation: number,
    permission: keyof typeof REPUTATION_THRESHOLDS
): boolean {
    return reputation >= REPUTATION_THRESHOLDS[permission];
}

/**
 * Get the user's reputation level/badge
 */
export function getReputationLevel(reputation: number): {
    level: string;
    color: string;
    nextLevel: string | null;
    nextThreshold: number | null;
} {
    if (reputation >= 10000) {
        return {
            level: 'Elite',
            color: 'purple',
            nextLevel: null,
            nextThreshold: null,
        };
    }
    if (reputation >= 5000) {
        return {
            level: 'Expert',
            color: 'gold',
            nextLevel: 'Elite',
            nextThreshold: 10000,
        };
    }
    if (reputation >= 2000) {
        return {
            level: 'Veteran',
            color: 'orange',
            nextLevel: 'Expert',
            nextThreshold: 5000,
        };
    }
    if (reputation >= 500) {
        return {
            level: 'Advanced',
            color: 'blue',
            nextLevel: 'Veteran',
            nextThreshold: 2000,
        };
    }
    if (reputation >= 100) {
        return {
            level: 'Intermediate',
            color: 'green',
            nextLevel: 'Advanced',
            nextThreshold: 500,
        };
    }
    if (reputation >= 15) {
        return {
            level: 'Beginner',
            color: 'gray',
            nextLevel: 'Intermediate',
            nextThreshold: 50,
        };
    }
    return {
        level: 'Newbie',
        color: 'lightgray',
        nextLevel: 'Beginner',
        nextThreshold: 15,
    };
}

/**
 * Get available permissions for a user based on reputation
 */
export function getUserPermissions(reputation: number): {
    canVote: boolean;
    canComment: boolean;
    canEditOwn: boolean;
    canEditAny: boolean;
    canDeleteAny: boolean;
    isModerator: boolean;
} {
    return {
        canVote: hasReputationPermission(reputation, 'VOTE'),
        canComment: hasReputationPermission(reputation, 'COMMENT'),
        canEditOwn: hasReputationPermission(reputation, 'EDIT_OWN'),
        canEditAny: hasReputationPermission(reputation, 'EDIT_ANY'),
        canDeleteAny: hasReputationPermission(reputation, 'DELETE_ANY'),
        isModerator: hasReputationPermission(reputation, 'MODERATOR'),
    };
}
