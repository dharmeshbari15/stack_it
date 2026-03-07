import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;

    // Get user info with reputation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        reputation: true,
        created_at: true,
        _count: {
          select: {
            questions: true,
            answers: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user ranking with deterministic tie-breaks to match leaderboard ordering:
    // reputation DESC, created_at ASC, id ASC
    const userCount = await prisma.user.count();
    const usersAhead = await prisma.user.count({
      where: {
        OR: [
          {
            reputation: {
              gt: user.reputation,
            },
          },
          {
            AND: [
              { reputation: user.reputation },
              {
                created_at: {
                  lt: user.created_at,
                },
              },
            ],
          },
          {
            AND: [
              { reputation: user.reputation },
              { created_at: user.created_at },
              {
                id: {
                  lt: user.id,
                },
              },
            ],
          },
        ],
      },
    });

    const rank = usersAhead + 1;

    // Get user's reputation level
    const REPUTATION_THRESHOLDS = {
      0: { level: 'Newbie', color: 'lightgray', nextLevel: 'Beginner', nextThreshold: 15 },
      15: { level: 'Beginner', color: 'green', nextLevel: 'Intermediate', nextThreshold: 50 },
      50: { level: 'Intermediate', color: 'blue', nextLevel: 'Advanced', nextThreshold: 100 },
      100: { level: 'Advanced', color: 'orange', nextLevel: 'Veteran', nextThreshold: 2000 },
      2000: { level: 'Veteran', color: 'red', nextLevel: 'Expert', nextThreshold: 5000 },
      5000: { level: 'Expert', color: 'gold', nextLevel: 'Elite', nextThreshold: 10000 },
      10000: { level: 'Elite', color: 'purple', nextLevel: 'Legend', nextThreshold: 50000 }
    };

    let level = REPUTATION_THRESHOLDS[0];
    const thresholds = Object.keys(REPUTATION_THRESHOLDS).map(Number).sort((a, b) => b - a);
    
    for (const threshold of thresholds) {
      if (user.reputation >= threshold) {
        level = REPUTATION_THRESHOLDS[threshold as keyof typeof REPUTATION_THRESHOLDS];
        break;
      }
    }

    // Get voting stats
    const answerVotes = await prisma.vote.findMany({
      where: {
        answer: {
          author_id: userId,
          deleted_at: null,
        },
      },
      select: { value: true },
    });

    const questionVotes = await prisma.questionVote.findMany({
      where: {
        question: {
          author_id: userId,
          deleted_at: null,
        },
      },
      select: { value: true },
    });

    const upvotesReceived = {
      answers: answerVotes.filter(v => v.value === 1).length,
      questions: questionVotes.filter(v => v.value === 1).length
    };

    const downvotesReceived = {
      answers: answerVotes.filter(v => v.value === -1).length,
      questions: questionVotes.filter(v => v.value === -1).length
    };

    // Get accepted answers count accurately via join on accepted_answer_id = answer.id
    const acceptedAnswersResult = await prisma.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "Answer" a
      INNER JOIN "Question" q ON q.accepted_answer_id = a.id
      WHERE a.author_id = ${userId}
        AND a.deleted_at IS NULL
        AND q.deleted_at IS NULL
    `;
    const acceptedAnswersCount = Number(acceptedAnswersResult[0]?.count ?? 0);

    // Net point contribution per reason from actual reputation history.
    const groupedHistory = await prisma.reputationHistory.groupBy({
      by: ['reason'],
      where: { user_id: userId },
      _sum: { change: true },
    });
    const netPointsByReason = groupedHistory.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.reason] = entry._sum.change ?? 0;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          reputation: user.reputation,
          level,
          rank,
          totalUsers: userCount,
          member_since: user.created_at,
          questions_count: user._count.questions,
          answers_count: user._count.answers
        },
        stats: {
          reputation: user.reputation,
          rank,
          level: level.level,
          badges: {
            upvotes_on_answers: upvotesReceived.answers,
            upvotes_on_questions: upvotesReceived.questions,
            downvotes_on_answers: downvotesReceived.answers,
            downvotes_on_questions: downvotesReceived.questions,
            accepted_answers: acceptedAnswersCount
          },
          points: {
            from_answer_upvotes: netPointsByReason.ANSWER_UPVOTE ?? 0,
            from_question_upvotes: netPointsByReason.QUESTION_UPVOTE ?? 0,
            from_answer_downvotes: netPointsByReason.ANSWER_DOWNVOTE ?? 0,
            from_question_downvotes: netPointsByReason.QUESTION_DOWNVOTE ?? 0,
            from_answer_accepted: (netPointsByReason.ANSWER_ACCEPTED ?? 0) + (netPointsByReason.ANSWER_UNACCEPTED ?? 0),
          },
          content: {
            questions_asked: user._count.questions,
            answers_provided: user._count.answers
          }
        }
      }
    });
  } catch (error) {
    console.error('Failed to fetch user ranking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user ranking' },
      { status: 500 }
    );
  }
}
