import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiHandler, apiSuccess, notFound } from '@/lib/api-handler';

// GET /api/v1/users/[id]/reputation-history
export const GET = apiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id: userId } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const skip = (page - 1) * limit;

    // Verify user exists
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            reputation: true
        }
    });

    if (!user) {
        throw notFound('User');
    }

    // Fetch reputation history with pagination
    const [history, total] = await Promise.all([
        prisma.reputationHistory.findMany({
            where: {
                user_id: userId
            },
            select: {
                id: true,
                reason: true,
                change: true,
                reference_id: true,
                created_at: true
            },
            orderBy: {
                created_at: 'desc'
            },
            skip,
            take: limit
        }),
        prisma.reputationHistory.count({
            where: {
                user_id: userId
            }
        })
    ]);

    // Format the change type into human-readable descriptions
    const formattedHistory = history.map(entry => {
        let description = '';
        switch (entry.reason) {
            case 'QUESTION_UPVOTE':
                description = 'Question upvoted';
                break;
            case 'QUESTION_DOWNVOTE':
                description = 'Question downvoted';
                break;
            case 'ANSWER_UPVOTE':
                description = 'Answer upvoted';
                break;
            case 'ANSWER_DOWNVOTE':
                description = 'Answer downvoted';
                break;
            case 'ANSWER_ACCEPTED':
                description = 'Answer accepted';
                break;
            case 'ANSWER_UNACCEPTED':
                description = 'Answer unaccepted';
                break;
            default:
                description = entry.reason;
        }

        return {
            id: entry.id,
            reason: entry.reason,
            description,
            change: entry.change,
            reference_id: entry.reference_id,
            created_at: entry.created_at
        };
    });

    return apiSuccess({
        user: {
            id: user.id,
            username: user.username,
            current_reputation: user.reputation
        },
        history: formattedHistory,
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit)
        }
    });
});
