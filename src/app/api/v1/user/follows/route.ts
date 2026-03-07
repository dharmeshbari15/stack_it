import { apiHandler, apiSuccess, unauthorized } from '@/lib/api-handler'
import { 
    FollowedTagsResponse, 
    FollowedQuestionsResponse, 
    FollowedUsersResponse 
} from '@/types/api'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { resolveSessionUserId } from '@/lib/auth-user'

interface FollowsResponse {
    tags: FollowedTagsResponse['tags'];
    questions: FollowedQuestionsResponse['questions'];
    users: FollowedUsersResponse['users'];
}

/**
 * GET /api/v1/user/follows - Get all followed tags, questions, and users
 */
export const GET = apiHandler<Record<string, never>, FollowsResponse>(
    async () => {
        const session = await auth()

        if (!session?.user) {
            throw unauthorized('You must be signed in to view your follows.')
        }

        const sessionUserId = await resolveSessionUserId(session)
        if (!sessionUserId) {
            throw unauthorized('Unable to resolve your account. Please sign out and sign in again.')
        }

        // Get followed tags
        const followedTags = await prisma.followTag.findMany({
            where: { user_id: sessionUserId },
            include: { tag: true },
            orderBy: { created_at: 'desc' }
        })

        // Get followed questions
        const followedQuestions = await prisma.followQuestion.findMany({
            where: { user_id: sessionUserId },
            include: {
                question: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        })

        // Get followed users
        const followedUsers = await prisma.followUser.findMany({
            where: { follower_id: sessionUserId },
            include: {
                following: {
                    include: {
                        _count: {
                            select: {
                                questions: true,
                                answers: true
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        })

        return apiSuccess({
            tags: followedTags.map(ft => ({
                id: ft.tag.id,
                name: ft.tag.name,
                created_at: ft.created_at
            })),
            questions: followedQuestions.map(fq => ({
                id: fq.question.id,
                title: fq.question.title,
                author: {
                    id: fq.question.author.id,
                    username: fq.question.author.username
                },
                created_at: fq.question.created_at
            })),
            users: followedUsers.map(fu => ({
                id: fu.following.id,
                username: fu.following.username,
                _count: fu.following._count,
                created_at: fu.created_at
            }))
        })
    }
)
