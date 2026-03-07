import { apiHandler, apiSuccess, unauthorized, notFound, badRequest } from '@/lib/api-handler'
import { FollowResponse } from '@/types/api'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { resolveSessionUserId } from '@/lib/auth-user'

/**
 * GET /api/v1/users/[id]/follow - Get follow status for current user
 */
export const GET = apiHandler<{ id: string }, FollowResponse>(
    async (req, { params }) => {
        const session = await auth()
        const { id: userId } = await params

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            throw notFound('User')
        }

        if (!session?.user) {
            return apiSuccess({ success: true, is_following: false })
        }

        const sessionUserId = await resolveSessionUserId(session)
        if (!sessionUserId || sessionUserId === userId) {
            return apiSuccess({ success: true, is_following: false })
        }

        const follow = await prisma.followUser.findUnique({
            where: {
                follower_id_following_id: {
                    follower_id: sessionUserId,
                    following_id: userId
                }
            }
        })

        return apiSuccess({ success: true, is_following: !!follow })
    }
)

/**
 * POST /api/v1/users/[id]/follow - Follow a user
 */
export const POST = apiHandler<{ id: string }, FollowResponse>(
    async (req, { params }) => {
        const session = await auth()

        if (!session?.user) {
            throw unauthorized('You must be signed in to follow users.')
        }

        const sessionUserId = await resolveSessionUserId(session)
        if (!sessionUserId) {
            throw unauthorized('Unable to resolve your account. Please sign out and sign in again.')
        }

        const { id: userId } = await params

        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            throw notFound('User')
        }

        // Can't follow yourself
        if (sessionUserId === userId) {
            throw badRequest('You cannot follow yourself')
        }

        // Check if already following
        const existing = await prisma.followUser.findUnique({
            where: {
                follower_id_following_id: {
                    follower_id: sessionUserId,
                    following_id: userId
                }
            }
        })

        if (existing) {
            return apiSuccess({ success: true, is_following: true })
        }

        // Create follow relationship
        await prisma.followUser.create({
            data: {
                follower_id: sessionUserId,
                following_id: userId
            }
        })

        return apiSuccess({ success: true, is_following: true })
    }
)

/**
 * DELETE /api/v1/users/[id]/follow - Unfollow a user
 */
export const DELETE = apiHandler<{ id: string }, FollowResponse>(
    async (req, { params }) => {
        const session = await auth()

        if (!session?.user) {
            throw unauthorized('You must be signed in to unfollow users.')
        }

        const sessionUserId = await resolveSessionUserId(session)
        if (!sessionUserId) {
            throw unauthorized('Unable to resolve your account. Please sign out and sign in again.')
        }

        const { id: userId } = await params

        // Delete follow relationship
        await prisma.followUser.deleteMany({
            where: {
                follower_id: sessionUserId,
                following_id: userId
            }
        })

        return apiSuccess({ success: true, is_following: false })
    }
)
