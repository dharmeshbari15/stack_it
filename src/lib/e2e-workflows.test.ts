/**
 * End-to-End Workflow Tests
 * Tests complete user journeys across the application
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  initTestDb,
  cleanupTestDb,
  createTestUser,
  createTestQuestion,
  createTestAnswer,
  createTestVote,
  createTestQuestionVote,
  randomUsername,
  randomEmail,
} from './test-utils';

describe('E2E Workflow Tests', () => {
  const prisma = initTestDb();

  beforeEach(async () => {
    await cleanupTestDb();
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  describe('Complete Question Lifecycle', () => {
    it('should complete full question workflow: post, answer, vote, accept', async () => {
      // Step 1: User registers and logs in
      const asker = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      const answerer = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      const voter = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      // Step 2: Asker posts a question
      const question = await createTestQuestion({
        title: 'How to implement authentication in Next.js?',
        description: 'I need help setting up NextAuth.js with JWT tokens.',
        authorId: asker.id,
        tags: ['nextjs', 'authentication', 'nextauth'],
      });

      assert.ok(question.id);
      assert.strictEqual(question.score, 0);

      // Step 3: Voter upvotes the question
      await createTestQuestionVote(voter.id, question.id, 1);

      // Update question score
      await prisma.question.update({
        where: { id: question.id },
        data: { score: { increment: 1 } },
      });

      // Award reputation to asker
      await prisma.user.update({
        where: { id: asker.id },
        data: { reputation: { increment: 5 } },
      });

      await prisma.reputationHistory.create({
        data: {
          user_id: asker.id,
          change: 5,
          reason: 'QUESTION_UPVOTE',
          reference_id: question.id,
        },
      });

      // Step 4: Answerer posts an answer
      const answer = await createTestAnswer({
        body: 'You can use NextAuth.js by installing it with `npm install next-auth`...',
        questionId: question.id,
        authorId: answerer.id,
      });

      assert.ok(answer.id);

      // Step 5: Notify asker of new answer
      await prisma.notification.create({
        data: {
          user_id: asker.id,
          actor_id: answerer.id,
          type: 'ANSWER',
          reference_id: answer.id,
        },
      });

      // Step 6: Voter upvotes the answer
      await createTestVote(voter.id, answer.id, 1);

      await prisma.answer.update({
        where: { id: answer.id },
        data: { score: { increment: 1 } },
      });

      // Award reputation to answerer
      await prisma.user.update({
        where: { id: answerer.id },
        data: { reputation: { increment: 10 } },
      });

      await prisma.reputationHistory.create({
        data: {
          user_id: answerer.id,
          change: 10,
          reason: 'ANSWER_UPVOTE',
          reference_id: answer.id,
        },
      });

      // Step 7: Asker accepts the answer
      await prisma.question.update({
        where: { id: question.id },
        data: { accepted_answer_id: answer.id },
      });

      // Award additional reputation for accepted answer
      await prisma.user.update({
        where: { id: answerer.id },
        data: { reputation: { increment: 15 } },
      });

      await prisma.reputationHistory.create({
        data: {
          user_id: answerer.id,
          change: 15,
          reason: 'ANSWER_ACCEPTED',
          reference_id: answer.id,
        },
      });

      // Verify final state
      const finalQuestion = await prisma.question.findUnique({
        where: { id: question.id },
        include: {
          author: true,
          answers: true,
        },
      });

      assert.ok(finalQuestion);
      assert.strictEqual(finalQuestion.score, 1);
      assert.strictEqual(finalQuestion.accepted_answer_id, answer.id);
      assert.strictEqual(finalQuestion.answers.length, 1);

      const askerReputation = await prisma.user.findUnique({
        where: { id: asker.id },
        select: { reputation: true },
      });

      const answererReputation = await prisma.user.findUnique({
        where: { id: answerer.id },
        select: { reputation: true },
      });

      assert.strictEqual(askerReputation?.reputation, 5); // +5 for question upvote
      assert.strictEqual(answererReputation?.reputation, 25); // +10 upvote, +15 accepted
    });
  });

  describe('User Discussion Workflow', () => {
    it('should handle complete discussion with comments and mentions', async () => {
      const user1 = await createTestUser({
        username: 'alice',
        email: randomEmail(),
      });

      const user2 = await createTestUser({
        username: 'bob',
        email: randomEmail(),
      });

      // User1 asks question
      const question = await createTestQuestion({
        title: 'Need help with async/await',
        description: 'Having trouble understanding promises.',
        authorId: user1.id,
      });

      // User2 comments on question with mention
      const comment = await prisma.comment.create({
        data: {
          body: 'Hi @alice, can you provide more details about your use case?',
          author_id: user2.id,
          question_id: question.id,
        },
      });

      // Notify user1 of mention
      await prisma.notification.create({
        data: {
          user_id: user1.id,
          actor_id: user2.id,
          type: 'MENTION',
          reference_id: comment.id,
        },
      });

      // User1 replies to comment
      const reply = await prisma.comment.create({
        data: {
          body: 'Sure @bob, I am trying to fetch data from an API.',
          author_id: user1.id,
          question_id: question.id,
          parent_id: comment.id,
        },
      });

      // Notify user2 of reply
      await prisma.notification.create({
        data: {
          user_id: user2.id,
          actor_id: user1.id,
          type: 'MENTION',
          reference_id: reply.id,
        },
      });

      // User2 posts answer
      const answer = await createTestAnswer({
        body: 'Here is how you can use async/await properly...',
        questionId: question.id,
        authorId: user2.id,
      });

      // Verify comment thread
      const comments = await prisma.comment.findMany({
        where: { question_id: question.id },
      });

      assert.strictEqual(comments.length, 2);

      // Verify notifications
      const user1Notifications = await prisma.notification.findMany({
        where: { user_id: user1.id },
      });

      const user2Notifications = await prisma.notification.findMany({
        where: { user_id: user2.id },
      });

      assert.ok(user1Notifications.length > 0);
      assert.ok(user2Notifications.length > 0);
    });
  });

  describe('Follow and Discover Workflow', () => {
    it('should handle follow workflow and content discovery', async () => {
      const user = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      const expert = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      // User follows a tag
      const tag = await prisma.tag.create({
        data: { name: 'typescript' },
      });

      await prisma.followTag.create({
        data: {
          user_id: user.id,
          tag_id: tag.id,
        },
      });

      // Expert posts question with that tag
      const question = await createTestQuestion({
        title: 'TypeScript generics question',
        description: 'How to use generic constraints?',
        authorId: expert.id,
        tags: ['typescript'],
      });

      // User should be notified
      await prisma.notification.create({
        data: {
          user_id: user.id,
          actor_id: expert.id,
          type: 'NEW_QUESTION_WITH_FOLLOWED_TAG',
          reference_id: question.id,
        },
      });

      // User follows the question
      await prisma.followQuestion.create({
        data: {
          user_id: user.id,
          question_id: question.id,
        },
      });

      // Someone answers the question
      const otherUser = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      const answer = await createTestAnswer({
        body: 'Here is how to use generic constraints...',
        questionId: question.id,
        authorId: otherUser.id,
      });

      // User should be notified
      await prisma.notification.create({
        data: {
          user_id: user.id,
          actor_id: otherUser.id,
          type: 'NEW_ANSWER_ON_FOLLOWED_QUESTION',
          reference_id: answer.id,
        },
      });

      // User follows the expert
      await prisma.followUser.create({
        data: {
          follower_id: user.id,
          following_id: expert.id,
        },
      });

      // Verify follows
      const followedTags = await prisma.followTag.findMany({
        where: { user_id: user.id },
      });

      const followedQuestions = await prisma.followQuestion.findMany({
        where: { user_id: user.id },
      });

      const followedUsers = await prisma.followUser.findMany({
        where: { follower_id: user.id },
      });

      assert.strictEqual(followedTags.length, 1);
      assert.strictEqual(followedQuestions.length, 1);
      assert.strictEqual(followedUsers.length, 1);

      // Verify notifications
      const notifications = await prisma.notification.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
      });

      assert.ok(notifications.length >= 2);
    });
  });

  describe('Bookmark and Save Workflow', () => {
    it('should handle bookmarking and organizing saved questions', async () => {
      const user = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      const author = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      // Create multiple questions
      const q1 = await createTestQuestion({
        title: 'React Question',
        description: 'About React',
        authorId: author.id,
      });

      const q2 = await createTestQuestion({
        title: 'Node.js Question',
        description: 'About Node.js',
        authorId: author.id,
      });

      const q3 = await createTestQuestion({
        title: 'Database Question',
        description: 'About databases',
        authorId: author.id,
      });

      // User bookmarks questions with custom tags
      await prisma.bookmark.create({
        data: {
          user_id: user.id,
          question_id: q1.id,
          custom_tag: 'frontend',
        },
      });

      await prisma.bookmark.create({
        data: {
          user_id: user.id,
          question_id: q2.id,
          custom_tag: 'backend',
        },
      });

      await prisma.bookmark.create({
        data: {
          user_id: user.id,
          question_id: q3.id,
          custom_tag: 'backend',
        },
      });

      // Filter bookmarks by tag
      const frontendBookmarks = await prisma.bookmark.findMany({
        where: {
          user_id: user.id,
          custom_tag: 'frontend',
        },
        include: { question: true },
      });

      const backendBookmarks = await prisma.bookmark.findMany({
        where: {
          user_id: user.id,
          custom_tag: 'backend',
        },
        include: { question: true },
      });

      assert.strictEqual(frontendBookmarks.length, 1);
      assert.strictEqual(backendBookmarks.length, 2);

      // Update bookmark tag
      await prisma.bookmark.updateMany({
        where: {
          user_id: user.id,
          question_id: q2.id,
        },
        data: {
          custom_tag: 'to-review',
        },
      });

      const toReviewBookmarks = await prisma.bookmark.findMany({
        where: {
          user_id: user.id,
          custom_tag: 'to-review',
        },
      });

      assert.strictEqual(toReviewBookmarks.length, 1);
    });
  });

  describe('Reputation and Ranking Workflow', () => {
    it('should track reputation across multiple activities', async () => {
      const user = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
        reputation: 0,
      });

      const voter1 = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      const voter2 = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      const questionAuthor = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      // User posts a question
      const question = await createTestQuestion({
        title: 'Great Question',
        description: 'Well researched question',
        authorId: user.id,
      });

      // Two users upvote: +5 each
      await createTestQuestionVote(voter1.id, question.id, 1);
      await createTestQuestionVote(voter2.id, question.id, 1);

      await prisma.user.update({
        where: { id: user.id },
        data: { reputation: { increment: 10 } }, // +5 x 2
      });

      // User posts an answer to another question
      const otherQuestion = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: questionAuthor.id,
      });

      const answer = await createTestAnswer({
        body: 'Excellent answer',
        questionId: otherQuestion.id,
        authorId: user.id,
      });

      // Two users upvote the answer: +10 each
      await createTestVote(voter1.id, answer.id, 1);
      await createTestVote(voter2.id, answer.id, 1);

      await prisma.user.update({
        where: { id: user.id },
        data: { reputation: { increment: 20 } }, // +10 x 2
      });

      // Answer is accepted: +15
      await prisma.question.update({
        where: { id: otherQuestion.id },
        data: { accepted_answer_id: answer.id },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { reputation: { increment: 15 } },
      });

      // Final reputation should be 45
      const finalUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      assert.strictEqual(finalUser?.reputation, 45);

      // Verify user appears in leaderboard
      const leaderboard = await prisma.user.findMany({
        orderBy: { reputation: 'desc' },
        take: 10,
      });

      const userInLeaderboard = leaderboard.find((u) => u.id === user.id);
      assert.ok(userInLeaderboard);
    });
  });

  describe('Search and Discovery Workflow', () => {
    it('should handle search, filter, and discovery', async () => {
      const user = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      // Create diverse questions
      await createTestQuestion({
        title: 'How to use React hooks effectively?',
        description: 'Need guide on useState and useEffect',
        authorId: user.id,
        tags: ['react', 'javascript', 'hooks'],
      });

      await createTestQuestion({
        title: 'Vue.js composition API tutorial',
        description: 'Looking for Vue 3 examples',
        authorId: user.id,
        tags: ['vue', 'javascript'],
      });

      await createTestQuestion({
        title: 'Python async programming guide',
        description: 'How to use asyncio',
        authorId: user.id,
        tags: ['python', 'async'],
      });

      // Search by keyword
      const reactQuestions = await prisma.question.findMany({
        where: {
          OR: [
            { title: { contains: 'React', mode: 'insensitive' } },
            { description: { contains: 'React', mode: 'insensitive' } },
          ],
        },
      });

      assert.strictEqual(reactQuestions.length, 1);

      // Filter by tag
      const jsTag = await prisma.tag.findUnique({
        where: { name: 'javascript' },
      });

      assert.ok(jsTag);

      const jsQuestions = await prisma.question.findMany({
        where: {
          tags: {
            some: {
              tag_id: jsTag.id,
            },
          },
        },
      });

      assert.strictEqual(jsQuestions.length, 2);

      // Sort by date (newest first)
      const recentQuestions = await prisma.question.findMany({
        orderBy: { created_at: 'desc' },
        take: 2,
      });

      assert.strictEqual(recentQuestions.length, 2);
    });
  });
});
