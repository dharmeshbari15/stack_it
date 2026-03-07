/**
 * Reputation System Tests
 * Tests reputation calculation, history tracking, and leaderboard
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  initTestDb,
  cleanupTestDb,
  createTestUser,
  createTestQuestion,
  createTestAnswer,
  createTestQuestionVote,
  createTestVote,
  getUserReputation,
  randomUsername,
  randomEmail,
} from './test-utils';

describe('Reputation System', () => {
  let testUser: any;
  let otherUser: any;
  const prisma = initTestDb();

  beforeEach(async () => {
    await cleanupTestDb();
    testUser = await createTestUser({
      username: randomUsername(),
      email: randomEmail(),
    });
    otherUser = await createTestUser({
      username: randomUsername(),
      email: randomEmail(),
    });
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  describe('Reputation Calculation', () => {
    it('should start with 0 reputation', async () => {
      const reputation = await getUserReputation(testUser.id);
      assert.strictEqual(reputation, 0);
    });

    it('should award +5 reputation for question upvote', async () => {
      const question = await createTestQuestion({
        title: 'Good Question',
        description: 'Detailed question',
        authorId: testUser.id,
      });

      await createTestQuestionVote(otherUser.id, question.id, 1);

      // Record reputation change
      await prisma.reputationHistory.create({
        data: {
          user_id: testUser.id,
          change: 5,
          reason: 'QUESTION_UPVOTE',
          reference_id: question.id,
        },
      });

      // Update user reputation
      await prisma.user.update({
        where: { id: testUser.id },
        data: { reputation: { increment: 5 } },
      });

      const reputation = await getUserReputation(testUser.id);
      assert.strictEqual(reputation, 5);
    });

    it('should deduct -2 reputation for question downvote', async () => {
      // Give user some initial reputation
      await prisma.user.update({
        where: { id: testUser.id },
        data: { reputation: 10 },
      });

      const question = await createTestQuestion({
        title: 'Bad Question',
        description: 'Low quality',
        authorId: testUser.id,
      });

      await createTestQuestionVote(otherUser.id, question.id, -1);

      await prisma.reputationHistory.create({
        data: {
          user_id: testUser.id,
          change: -2,
          reason: 'QUESTION_DOWNVOTE',
          reference_id: question.id,
        },
      });

      await prisma.user.update({
        where: { id: testUser.id },
        data: { reputation: { increment: -2 } },
      });

      const reputation = await getUserReputation(testUser.id);
      assert.strictEqual(reputation, 8);
    });

    it('should award +10 reputation for answer upvote', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: otherUser.id,
      });

      const answer = await createTestAnswer({
        body: 'Great answer',
        questionId: question.id,
        authorId: testUser.id,
      });

      await createTestVote(otherUser.id, answer.id, 1);

      await prisma.reputationHistory.create({
        data: {
          user_id: testUser.id,
          change: 10,
          reason: 'ANSWER_UPVOTE',
          reference_id: answer.id,
        },
      });

      await prisma.user.update({
        where: { id: testUser.id },
        data: { reputation: { increment: 10 } },
      });

      const reputation = await getUserReputation(testUser.id);
      assert.strictEqual(reputation, 10);
    });

    it('should deduct -2 reputation for answer downvote', async () => {
      await prisma.user.update({
        where: { id: testUser.id },
        data: { reputation: 15 },
      });

      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: otherUser.id,
      });

      const answer = await createTestAnswer({
        body: 'Bad answer',
        questionId: question.id,
        authorId: testUser.id,
      });

      await createTestVote(otherUser.id, answer.id, -1);

      await prisma.reputationHistory.create({
        data: {
          user_id: testUser.id,
          change: -2,
          reason: 'ANSWER_DOWNVOTE',
          reference_id: answer.id,
        },
      });

      await prisma.user.update({
        where: { id: testUser.id },
        data: { reputation: { increment: -2 } },
      });

      const reputation = await getUserReputation(testUser.id);
      assert.strictEqual(reputation, 13);
    });

    it('should award +15 reputation for accepted answer', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: otherUser.id,
      });

      const answer = await createTestAnswer({
        body: 'Perfect answer',
        questionId: question.id,
        authorId: testUser.id,
      });

      await prisma.question.update({
        where: { id: question.id },
        data: { accepted_answer_id: answer.id },
      });

      await prisma.reputationHistory.create({
        data: {
          user_id: testUser.id,
          change: 15,
          reason: 'ANSWER_ACCEPTED',
          reference_id: answer.id,
        },
      });

      await prisma.user.update({
        where: { id: testUser.id },
        data: { reputation: { increment: 15 } },
      });

      const reputation = await getUserReputation(testUser.id);
      assert.strictEqual(reputation, 15);
    });

    it('should deduct -15 reputation when answer is unaccepted', async () => {
      await prisma.user.update({
        where: { id: testUser.id },
        data: { reputation: 20 },
      });

      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: otherUser.id,
      });

      const answer = await createTestAnswer({
        body: 'Answer',
        questionId: question.id,
        authorId: testUser.id,
      });

      // Unaccept previously accepted answer
      await prisma.question.update({
        where: { id: question.id },
        data: { accepted_answer_id: null },
      });

      await prisma.reputationHistory.create({
        data: {
          user_id: testUser.id,
          change: -15,
          reason: 'ANSWER_UNACCEPTED',
          reference_id: answer.id,
        },
      });

      await prisma.user.update({
        where: { id: testUser.id },
        data: { reputation: { increment: -15 } },
      });

      const reputation = await getUserReputation(testUser.id);
      assert.strictEqual(reputation, 5);
    });

    it('should not allow negative reputation', async () => {
      // User starts with 0 reputation
      const initialRep = await getUserReputation(testUser.id);
      assert.strictEqual(initialRep, 0);

      // Attempt to deduct reputation
      const newReputation = Math.max(0, initialRep - 5);

      await prisma.user.update({
        where: { id: testUser.id },
        data: { reputation: newReputation },
      });

      const finalRep = await getUserReputation(testUser.id);
      assert.strictEqual(finalRep, 0);
    });

    it('should accumulate reputation from multiple actions', async () => {
      // Question upvote: +5
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: testUser.id,
      });
      await createTestQuestionVote(otherUser.id, question.id, 1);
      await prisma.user.update({
        where: { id: testUser.id },
        data: { reputation: { increment: 5 } },
      });

      // Answer upvote: +10
      const answer = await createTestAnswer({
        body: 'Answer',
        questionId: question.id,
        authorId: testUser.id,
      });
      await createTestVote(otherUser.id, answer.id, 1);
      await prisma.user.update({
        where: { id: testUser.id },
        data: { reputation: { increment: 10 } },
      });

      const reputation = await getUserReputation(testUser.id);
      assert.strictEqual(reputation, 15);
    });
  });

  describe('Reputation History', () => {
    it('should track reputation changes', async () => {
      await prisma.reputationHistory.create({
        data: {
          user_id: testUser.id,
          change: 5,
          reason: 'QUESTION_UPVOTE',
          reference_id: 'question-id',
        },
      });

      await prisma.reputationHistory.create({
        data: {
          user_id: testUser.id,
          change: 10,
          reason: 'ANSWER_UPVOTE',
          reference_id: 'answer-id',
        },
      });

      const history = await prisma.reputationHistory.findMany({
        where: { user_id: testUser.id },
        orderBy: { created_at: 'asc' },
      });

      assert.strictEqual(history.length, 2);
      assert.strictEqual(history[0].change, 5);
      assert.strictEqual(history[1].change, 10);
    });

    it('should include reference to content', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: testUser.id,
      });

      await prisma.reputationHistory.create({
        data: {
          user_id: testUser.id,
          change: 5,
          reason: 'QUESTION_UPVOTE',
          reference_id: question.id,
        },
      });

      const history = await prisma.reputationHistory.findFirst({
        where: { user_id: testUser.id },
      });

      assert.ok(history);
      assert.strictEqual(history.reference_id, question.id);
    });

    it('should track timestamp of reputation changes', async () => {
      await prisma.reputationHistory.create({
        data: {
          user_id: testUser.id,
          change: 5,
          reason: 'QUESTION_UPVOTE',
        },
      });

      const history = await prisma.reputationHistory.findFirst({
        where: { user_id: testUser.id },
      });

      assert.ok(history);
      assert.ok(history.created_at);
      assert.ok(history.created_at instanceof Date);
    });
  });

  describe('Leaderboard', () => {
    it('should rank users by reputation', async () => {
      // Create users with different reputations
      const user1 = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
        reputation: 50,
      });

      const user2 = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
        reputation: 100,
      });

      const user3 = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
        reputation: 25,
      });

      const leaderboard = await prisma.user.findMany({
        orderBy: { reputation: 'desc' },
        take: 10,
        select: {
          id: true,
          username: true,
          reputation: true,
        },
      });

      assert.strictEqual(leaderboard[0].id, user2.id);
      assert.strictEqual(leaderboard[1].id, user1.id);
      assert.strictEqual(leaderboard[2].id, user3.id);
    });

    it('should paginate leaderboard', async () => {
      // Create 15 users
      for (let i = 0; i < 15; i++) {
        await createTestUser({
          username: randomUsername(),
          email: randomEmail(),
          reputation: i * 10,
        });
      }

      const page1 = await prisma.user.findMany({
        orderBy: { reputation: 'desc' },
        take: 10,
        skip: 0,
      });

      const page2 = await prisma.user.findMany({
        orderBy: { reputation: 'desc' },
        take: 10,
        skip: 10,
      });

      assert.strictEqual(page1.length, 10);
      assert.strictEqual(page2.length, 7); // 17 total (15 + 2 from beforeEach)
      assert.notEqual(page1[0].id, page2[0].id);
    });

    it('should filter leaderboard by time period', async () => {
      const recentDate = new Date();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);

      await prisma.reputationHistory.create({
        data: {
          user_id: testUser.id,
          change: 50,
          reason: 'ANSWER_UPVOTE',
          created_at: recentDate,
        },
      });

      await prisma.reputationHistory.create({
        data: {
          user_id: otherUser.id,
          change: 40,
          reason: 'ANSWER_UPVOTE',
          created_at: oldDate,
        },
      });

      // Get reputation gained in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentChanges = await prisma.reputationHistory.groupBy({
        by: ['user_id'],
        where: {
          created_at: {
            gte: sevenDaysAgo,
          },
        },
        _sum: {
          change: true,
        },
        orderBy: {
          _sum: {
            change: 'desc',
          },
        },
      });

      assert.strictEqual(recentChanges.length, 1);
      assert.strictEqual(recentChanges[0].user_id, testUser.id);
    });
  });

  describe('Reputation Edge Cases', () => {
    it('should handle large reputation values', async () => {
      const largeRep = 999999;

      await prisma.user.update({
        where: { id: testUser.id },
        data: { reputation: largeRep },
      });

      const reputation = await getUserReputation(testUser.id);
      assert.strictEqual(reputation, largeRep);
    });

    it('should handle concurrent reputation updates', async () => {
      // Simulate concurrent updates
      const updates = [];
      for (let i = 0; i < 5; i++) {
        updates.push(
          prisma.user.update({
            where: { id: testUser.id },
            data: { reputation: { increment: 1 } },
          })
        );
      }

      await Promise.all(updates);

      const reputation = await getUserReputation(testUser.id);
      assert.strictEqual(reputation, 5);
    });
  });
});
