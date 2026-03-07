import { prisma } from '@/lib/prisma'

/**
 * Check if a user is following a tag
 */
export async function isFollowingTag(userId: string, tagId: string): Promise<boolean> {
    const follow = await prisma.followTag.findUnique({
        where: {
            user_id_tag_id: {
                user_id: userId,
                tag_id: tagId
            }
        }
    })
    return !!follow
}

/**
 * Check if a user is following a question
 */
export async function isFollowingQuestion(userId: string, questionId: string): Promise<boolean> {
    const follow = await prisma.followQuestion.findUnique({
        where: {
            user_id_question_id: {
                user_id: userId,
                question_id: questionId
            }
        }
    })
    return !!follow
}

/**
 * Check if a user is following another user
 */
export async function isFollowingUser(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.followUser.findUnique({
        where: {
            follower_id_following_id: {
                follower_id: followerId,
                following_id: followingId
            }
        }
    })
    return !!follow
}

/**
 * Get all users following a tag (for new question notifications)
 */
export async function getTagFollowers(tagId: string): Promise<string[]> {
    const followers = await prisma.followTag.findMany({
        where: { tag_id: tagId },
        select: { user_id: true }
    })
    return followers.map(f => f.user_id)
}

/**
 * Get all users following a question (for new answer notifications)
 */
export async function getQuestionFollowers(questionId: string): Promise<string[]> {
    const followers = await prisma.followQuestion.findMany({
        where: { question_id: questionId },
        select: { user_id: true }
    })
    return followers.map(f => f.user_id)
}

/**
 * Get all followers of a user (for when user asks a question/answers)
 */
export async function getUserFollowers(userId: string): Promise<string[]> {
    const followers = await prisma.followUser.findMany({
        where: { following_id: userId },
        select: { follower_id: true }
    })
    return followers.map(f => f.follower_id)
}

/**
 * Create notifications for users following a new question's tags
 */
export async function notifyFollowersOfNewQuestion(
    questionId: string,
    tagIds: string[],
    authorId: string
): Promise<void> {
    // Get all users following any of the tags
    const tagFollowers = await prisma.followTag.findMany({
        where: {
            tag_id: { in: tagIds }
        },
        select: { user_id: true },
        distinct: ['user_id']
    })

    const userIds = tagFollowers.map(f => f.user_id).filter(id => id !== authorId)

    if (userIds.length === 0) return

    // Create notifications for each follower
    await prisma.notification.createMany({
        data: userIds.map(userId => ({
            user_id: userId,
            actor_id: authorId,
            type: 'NEW_QUESTION_WITH_FOLLOWED_TAG',
            reference_id: questionId
        })),
        skipDuplicates: true
    })
}

/**
 * Create notifications for users following a question when new answer arrives
 */
export async function notifyFollowersOfNewAnswer(
    questionId: string,
    answerId: string,
    authorId: string
): Promise<void> {
    // Get all users following this question
    const questionFollowers = await prisma.followQuestion.findMany({
        where: { question_id: questionId },
        select: { user_id: true }
    })

    const authorFollowers = await prisma.followUser.findMany({
        where: { following_id: authorId },
        select: { follower_id: true },
    })

    const questionFollowerIds = questionFollowers.map(f => f.user_id)
    const authorFollowerIds = authorFollowers.map(f => f.follower_id)
    const userIds = Array.from(new Set([...questionFollowerIds, ...authorFollowerIds]))
        .filter(id => id !== authorId)

    if (userIds.length === 0) return

    // Create notifications for each follower
    await prisma.notification.createMany({
        data: userIds.map(userId => ({
            user_id: userId,
            actor_id: authorId,
            type: 'NEW_ANSWER_ON_FOLLOWED_QUESTION',
            reference_id: questionId
        })),
        skipDuplicates: true
    })
}
