import { apiHandler, apiSuccess, unauthorized, notFound } from '@/lib/api-handler'
import { FollowResponse } from '@/types/api'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { resolveSessionUserId } from '@/lib/auth-user'

/**
 * GET /api/v1/questions/[id]/follow - Get follow status for current user
 */
export const GET = apiHandler<{ id: string }, FollowResponse>(
    async (req, { params }) => {
        const session = await auth()
        const { id: questionId } = await params

        const question = await prisma.question.findUnique({
            where: { id: questionId }
        })

        if (!question) {
            throw notFound('Question')
        }

        if (!session?.user) {
            return apiSuccess({ success: true, is_following: false })
        }

        const sessionUserId = await resolveSessionUserId(session)
        if (!sessionUserId) {
            return apiSuccess({ success: true, is_following: false })
        }

        const follow = await prisma.followQuestion.findUnique({
            where: {
                user_id_question_id: {
                    user_id: sessionUserId,
                    question_id: questionId
                }
            }
        })

        return apiSuccess({ success: true, is_following: !!follow })
    }
)

/**
 * POST /api/v1/questions/[id]/follow - Follow a question
 */
export const POST = apiHandler<{ id: string }, FollowResponse>(
    async (req, { params }) => {
        const session = await auth()

        if (!session?.user) {
            throw unauthorized('You must be signed in to follow questions.')
        }

        const sessionUserId = await resolveSessionUserId(session)
        if (!sessionUserId) {
            throw unauthorized('Unable to resolve your account. Please sign out and sign in again.')
        }

        const { id: questionId } = await params

        // Verify question exists
        const question = await prisma.question.findUnique({
            where: { id: questionId }
        })

        if (!question) {
            throw notFound('Question')
        }

        // Check if already following
        const existing = await prisma.followQuestion.findUnique({
            where: {
                user_id_question_id: {
                    user_id: sessionUserId,
                    question_id: questionId
                }
            }
        })

        if (existing) {
            return apiSuccess({ success: true, is_following: true })
        }

        // Create follow relationship
        await prisma.followQuestion.create({
            data: {
                user_id: sessionUserId,
                question_id: questionId
            }
        })

        return apiSuccess({ success: true, is_following: true })
    }
)

/**
 * DELETE /api/v1/questions/[id]/follow - Unfollow a question
 */
export const DELETE = apiHandler<{ id: string }, FollowResponse>(
    async (req, { params }) => {
        const session = await auth()

        if (!session?.user) {
            throw unauthorized('You must be signed in to unfollow questions.')
        }

        const sessionUserId = await resolveSessionUserId(session)
        if (!sessionUserId) {
            throw unauthorized('Unable to resolve your account. Please sign out and sign in again.')
        }

        const { id: questionId } = await params

        // Delete follow relationship
        await prisma.followQuestion.deleteMany({
            where: {
                user_id: sessionUserId,
                question_id: questionId
            }
        })

        return apiSuccess({ success: true, is_following: false })
    }
)
