import { apiHandler, apiSuccess, unauthorized, notFound } from '@/lib/api-handler'
import { FollowResponse } from '@/types/api'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { resolveSessionUserId } from '@/lib/auth-user'

/**
 * GET /api/v1/tags/[id]/follow - Get follow status for current user
 */
export const GET = apiHandler<{ id: string }, FollowResponse>(
    async (req, { params }) => {
        const session = await auth()
        const { id: tagId } = await params

        const tag = await prisma.tag.findUnique({
            where: { id: tagId }
        })

        if (!tag) {
            throw notFound('Tag')
        }

        if (!session?.user) {
            return apiSuccess({ is_following: false })
        }

        const sessionUserId = await resolveSessionUserId(session)
        if (!sessionUserId) {
            return apiSuccess({ is_following: false })
        }

        const follow = await prisma.followTag.findUnique({
            where: {
                user_id_tag_id: {
                    user_id: sessionUserId,
                    tag_id: tagId
                }
            }
        })

        return apiSuccess({ is_following: !!follow })
    }
)

/**
 * POST /api/v1/tags/[id]/follow - Follow a tag
 */
export const POST = apiHandler<{ id: string }, FollowResponse>(
    async (req, { params }) => {
        const session = await auth()

        if (!session?.user) {
            throw unauthorized('You must be signed in to follow tags.')
        }

        const sessionUserId = await resolveSessionUserId(session)
        if (!sessionUserId) {
            throw unauthorized('Unable to resolve your account. Please sign out and sign in again.')
        }

        const { id: tagId } = await params

        // Verify tag exists
        const tag = await prisma.tag.findUnique({
            where: { id: tagId }
        })

        if (!tag) {
            throw notFound('Tag')
        }

        // Check if already following
        const existing = await prisma.followTag.findUnique({
            where: {
                user_id_tag_id: {
                    user_id: sessionUserId,
                    tag_id: tagId
                }
            }
        })

        if (existing) {
            return apiSuccess({ is_following: true })
        }

        // Create follow relationship
        await prisma.followTag.create({
            data: {
                user_id: sessionUserId,
                tag_id: tagId
            }
        })

        return apiSuccess({ is_following: true })
    }
)

/**
 * DELETE /api/v1/tags/[id]/follow - Unfollow a tag
 */
export const DELETE = apiHandler<{ id: string }, FollowResponse>(
    async (req, { params }) => {
        const session = await auth()

        if (!session?.user) {
            throw unauthorized('You must be signed in to unfollow tags.')
        }

        const sessionUserId = await resolveSessionUserId(session)
        if (!sessionUserId) {
            throw unauthorized('Unable to resolve your account. Please sign out and sign in again.')
        }

        const { id: tagId } = await params

        // Delete follow relationship
        await prisma.followTag.deleteMany({
            where: {
                user_id: sessionUserId,
                tag_id: tagId
            }
        })

        return apiSuccess({ is_following: false })
    }
)
