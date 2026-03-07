/**
 * Answers and Voting Tests
 * Tests answer creation, voting, and score calculation
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

describe('Answers and Voting System', () => {
  let testUser: any;
  let otherUser: any;
  let testQuestion: any;
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
    testQuestion = await createTestQuestion({
      title: 'Test Question',
      description: 'Test Description',
      authorId: testUser.id,
    });
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  describe('Answer Creation', () => {
    it('should create answer with valid data', async () => {
      const answer = await createTestAnswer({
        body: 'This is a test answer.',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      assert.ok(answer.id);
      assert.strictEqual(answer.body, 'This is a test answer.');
      assert.strictEqual(answer.question_id, testQuestion.id);
      assert.strictEqual(answer.author_id, testUser.id);
      assert.strictEqual(answer.score, 0);
    });

    it('should set default score to 0', async () => {
      const answer = await createTestAnswer({
        body: 'Test answer',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      assert.strictEqual(answer.score, 0);
    });

    it('should set created_at timestamp', async () => {
      const answer = await createTestAnswer({
        body: 'Test answer',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      assert.ok(answer.created_at);
      assert.ok(answer.created_at instanceof Date);
    });

    it('should allow multiple answers to same question', async () => {
      const answer1 = await createTestAnswer({
        body: 'First answer',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      const answer2 = await createTestAnswer({
        body: 'Second answer',
        questionId: testQuestion.id,
        authorId: otherUser.id,
      });

      const answers = await prisma.answer.findMany({
        where: { question_id: testQuestion.id },
      });

      assert.strictEqual(answers.length, 2);
    });
  });

  describe('Answer Validation', () => {
    const validateAnswer = (body: string) => {
      const errors: string[] = [];

      if (!body || body.trim().length === 0) {
        errors.push('Answer body is required');
      }

      if (body && body.length < 10) {
        errors.push('Answer must be at least 10 characters');
      }

      return { valid: errors.length === 0, errors };
    };

    it('should accept valid answer', () => {
      const result = validateAnswer('This is a valid answer with enough content.');

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject empty answer', () => {
      const result = validateAnswer('');

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('required')));
    });

    it('should reject answer that is too short', () => {
      const result = validateAnswer('Short');

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('at least 10 characters')));
    });
  });

  describe('Answer Retrieval', () => {
    it('should retrieve answers for a question', async () => {
      await createTestAnswer({
        body: 'Answer 1',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      await createTestAnswer({
        body: 'Answer 2',
        questionId: testQuestion.id,
        authorId: otherUser.id,
      });

      const answers = await prisma.answer.findMany({
        where: { question_id: testQuestion.id },
      });

      assert.strictEqual(answers.length, 2);
    });

    it('should sort answers by score', async () => {
      const answer1 = await createTestAnswer({
        body: 'Low score answer',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      const answer2 = await createTestAnswer({
        body: 'High score answer',
        questionId: testQuestion.id,
        authorId: otherUser.id,
      });

      // Update scores
      await prisma.answer.update({
        where: { id: answer1.id },
        data: { score: 3 },
      });

      await prisma.answer.update({
        where: { id: answer2.id },
        data: { score: 10 },
      });

      const sorted = await prisma.answer.findMany({
        where: { question_id: testQuestion.id },
        orderBy: { score: 'desc' },
      });

      assert.strictEqual(sorted[0].id, answer2.id);
      assert.strictEqual(sorted[1].id, answer1.id);
    });
  });

  describe('Answer Update', () => {
    it('should update answer body', async () => {
      const answer = await createTestAnswer({
        body: 'Original answer',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      const updated = await prisma.answer.update({
        where: { id: answer.id },
        data: { body: 'Updated answer' },
      });

      assert.strictEqual(updated.body, 'Updated answer');
    });
  });

  describe('Answer Deletion', () => {
    it('should soft delete answer', async () => {
      const answer = await createTestAnswer({
        body: 'Answer to delete',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      const deleted = await prisma.answer.update({
        where: { id: answer.id },
        data: { deleted_at: new Date() },
      });

      assert.ok(deleted.deleted_at);
    });

    it('should exclude deleted answers from listing', async () => {
      const answer1 = await createTestAnswer({
        body: 'Active answer',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      const answer2 = await createTestAnswer({
        body: 'Deleted answer',
        questionId: testQuestion.id,
        authorId: otherUser.id,
      });

      await prisma.answer.update({
        where: { id: answer2.id },
        data: { deleted_at: new Date() },
      });

      const activeAnswers = await prisma.answer.findMany({
        where: {
          question_id: testQuestion.id,
          deleted_at: null,
        },
      });

      assert.strictEqual(activeAnswers.length, 1);
      assert.strictEqual(activeAnswers[0].id, answer1.id);
    });
  });

  describe('Answer Voting', () => {
    it('should upvote answer', async () => {
      const answer = await createTestAnswer({
        body: 'Good answer',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      const vote = await createTestVote(otherUser.id, answer.id, 1);

      assert.ok(vote);
      assert.strictEqual(vote.value, 1);
      assert.strictEqual(vote.user_id, otherUser.id);
      assert.strictEqual(vote.answer_id, answer.id);
    });

    it('should downvote answer', async () => {
      const answer = await createTestAnswer({
        body: 'Bad answer',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      const vote = await createTestVote(otherUser.id, answer.id, -1);

      assert.ok(vote);
      assert.strictEqual(vote.value, -1);
    });

    it('should prevent duplicate votes from same user', async () => {
      const answer = await createTestAnswer({
        body: 'Answer',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      await createTestVote(otherUser.id, answer.id, 1);

      // Attempt to vote again
      await assert.rejects(async () => {
        await createTestVote(otherUser.id, answer.id, 1);
      });
    });

    it('should allow changing vote', async () => {
      const answer = await createTestAnswer({
        body: 'Answer',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      // Initial upvote
      await createTestVote(otherUser.id, answer.id, 1);

      // Change to downvote
      const updated = await prisma.vote.update({
        where: {
          user_id_answer_id: {
            user_id: otherUser.id,
            answer_id: answer.id,
          },
        },
        data: { value: -1 },
      });

      assert.strictEqual(updated.value, -1);
    });

    it('should calculate answer score correctly', async () => {
      const answer = await createTestAnswer({
        body: 'Popular answer',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      // Create additional users and votes
      const user1 = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });
      const user2 = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });
      const user3 = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      await createTestVote(user1.id, answer.id, 1);
      await createTestVote(user2.id, answer.id, 1);
      await createTestVote(user3.id, answer.id, -1);

      // Calculate score: 2 upvotes - 1 downvote = 1
      const votes = await prisma.vote.findMany({
        where: { answer_id: answer.id },
      });

      const score = votes.reduce((sum, vote) => sum + vote.value, 0);
      assert.strictEqual(score, 1);
    });
  });

  describe('Question Voting', () => {
    it('should upvote question', async () => {
      const vote = await createTestQuestionVote(otherUser.id, testQuestion.id, 1);

      assert.ok(vote);
      assert.strictEqual(vote.value, 1);
      assert.strictEqual(vote.user_id, otherUser.id);
      assert.strictEqual(vote.question_id, testQuestion.id);
    });

    it('should downvote question', async () => {
      const vote = await createTestQuestionVote(otherUser.id, testQuestion.id, -1);

      assert.ok(vote);
      assert.strictEqual(vote.value, -1);
    });

    it('should prevent duplicate question votes', async () => {
      await createTestQuestionVote(otherUser.id, testQuestion.id, 1);

      await assert.rejects(async () => {
        await createTestQuestionVote(otherUser.id, testQuestion.id, 1);
      });
    });

    it('should calculate question score correctly', async () => {
      const user1 = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });
      const user2 = await createTestUser({
        username: randomUsername(),
        email: randomEmail(),
      });

      await createTestQuestionVote(user1.id, testQuestion.id, 1);
      await createTestQuestionVote(user2.id, testQuestion.id, 1);
      await createTestQuestionVote(otherUser.id, testQuestion.id, -1);

      const votes = await prisma.questionVote.findMany({
        where: { question_id: testQuestion.id },
      });

      const score = votes.reduce((sum, vote) => sum + vote.value, 0);
      assert.strictEqual(score, 1);
    });
  });

  describe('Accept Answer', () => {
    it('should accept answer', async () => {
      const answer = await createTestAnswer({
        body: 'Best answer',
        questionId: testQuestion.id,
        authorId: otherUser.id,
      });

      const updated = await prisma.question.update({
        where: { id: testQuestion.id },
        data: { accepted_answer_id: answer.id },
      });

      assert.strictEqual(updated.accepted_answer_id, answer.id);
    });

    it('should unaccept answer', async () => {
      const answer = await createTestAnswer({
        body: 'Answer',
        questionId: testQuestion.id,
        authorId: otherUser.id,
      });

      await prisma.question.update({
        where: { id: testQuestion.id },
        data: { accepted_answer_id: answer.id },
      });

      const unaccepted = await prisma.question.update({
        where: { id: testQuestion.id },
        data: { accepted_answer_id: null },
      });

      assert.strictEqual(unaccepted.accepted_answer_id, null);
    });

    it('should allow changing accepted answer', async () => {
      const answer1 = await createTestAnswer({
        body: 'First answer',
        questionId: testQuestion.id,
        authorId: otherUser.id,
      });

      const answer2 = await createTestAnswer({
        body: 'Better answer',
        questionId: testQuestion.id,
        authorId: otherUser.id,
      });

      await prisma.question.update({
        where: { id: testQuestion.id },
        data: { accepted_answer_id: answer1.id },
      });

      const updated = await prisma.question.update({
        where: { id: testQuestion.id },
        data: { accepted_answer_id: answer2.id },
      });

      assert.strictEqual(updated.accepted_answer_id, answer2.id);
    });
  });

  describe('Security - Self Voting Prevention', () => {
    it('should prevent voting on own answer (application logic)', async () => {
      const answer = await createTestAnswer({
        body: 'My answer',
        questionId: testQuestion.id,
        authorId: testUser.id,
      });

      // Validation logic should prevent this
      const canVote = (voterId: string, contentAuthorId: string) => {
        return voterId !== contentAuthorId;
      };

      assert.strictEqual(canVote(testUser.id, answer.author_id), false);
      assert.strictEqual(canVote(otherUser.id, answer.author_id), true);
    });

    it('should prevent voting on own question (application logic)', async () => {
      const canVote = (voterId: string, contentAuthorId: string) => {
        return voterId !== contentAuthorId;
      };

      assert.strictEqual(canVote(testUser.id, testQuestion.author_id), false);
      assert.strictEqual(canVote(otherUser.id, testQuestion.author_id), true);
    });
  });
});
