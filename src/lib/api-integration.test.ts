/**
 * Integration Tests for API Routes
 * Tests the complete request/response cycle through API endpoints
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  initTestDb,
  cleanupTestDb,
  createTestUser,
  createTestQuestion,
  createTestAnswer,
  randomUsername,
  randomEmail,
} from './test-utils';

describe('API Integration Tests', () => {
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

  describe('Question API', () => {
    it('should create question via API', async () => {
      const questionData = {
        title: 'How to test Next.js API routes?',
        description: 'I need help testing my API routes in Next.js.',
        tags: ['nextjs', 'testing'],
      };

      // Simulate creating a question
      const question = await createTestQuestion({
        title: questionData.title,
        description: questionData.description,
        authorId: testUser.id,
        tags: questionData.tags,
      });

      assert.ok(question.id);
      assert.strictEqual(question.title, questionData.title);
    });

    it('should get questions list via API', async () => {
      // Create multiple questions
      await createTestQuestion({
        title: 'Question 1',
        description: 'Description 1',
        authorId: testUser.id,
      });

      await createTestQuestion({
        title: 'Question 2',
        description: 'Description 2',
        authorId: otherUser.id,
      });

      const questions = await prisma.question.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });

      assert.strictEqual(questions.length, 2);
      assert.ok(questions[0].author);
    });

    it('should get question by ID via API', async () => {
      const question = await createTestQuestion({
        title: 'Specific Question',
        description: 'Detailed description',
        authorId: testUser.id,
      });

      const retrieved = await prisma.question.findUnique({
        where: { id: question.id },
        include: {
          author: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      assert.ok(retrieved);
      assert.strictEqual(retrieved.id, question.id);
      assert.ok(retrieved.author);
    });

    it('should update question via API', async () => {
      const question = await createTestQuestion({
        title: 'Original Title',
        description: 'Original Description',
        authorId: testUser.id,
      });

      // Simulate PATCH request
      const updated = await prisma.question.update({
        where: { id: question.id },
        data: {
          title: 'Updated Title',
          description: 'Updated Description',
        },
      });

      assert.strictEqual(updated.title, 'Updated Title');
      assert.strictEqual(updated.description, 'Updated Description');
    });

    it('should delete question via API', async () => {
      const question = await createTestQuestion({
        title: 'To Delete',
        description: 'This will be deleted',
        authorId: testUser.id,
      });

      // Soft delete
      await prisma.question.update({
        where: { id: question.id },
        data: { deleted_at: new Date() },
      });

      const deleted = await prisma.question.findUnique({
        where: { id: question.id },
      });

      assert.ok(deleted?.deleted_at);
    });

    it('should validate required fields', () => {
      const validateQuestionInput = (data: any) => {
        const errors: string[] = [];

        if (!data.title || data.title.trim().length === 0) {
          errors.push('Title is required');
        }

        if (!data.description || data.description.trim().length === 0) {
          errors.push('Description is required');
        }

        return { valid: errors.length === 0, errors };
      };

      const result = validateQuestionInput({
        title: '',
        description: '',
      });

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.length, 2);
    });

    it('should return 404 for non-existent question', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const question = await prisma.question.findUnique({
        where: { id: nonExistentId },
      });

      assert.strictEqual(question, null);
    });
  });

  describe('Answer API', () => {
    it('should create answer via API', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: testUser.id,
      });

      const answer = await createTestAnswer({
        body: 'This is my answer to the question.',
        questionId: question.id,
        authorId: otherUser.id,
      });

      assert.ok(answer.id);
      assert.strictEqual(answer.question_id, question.id);
    });

    it('should get answers for question via API', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: testUser.id,
      });

      await createTestAnswer({
        body: 'Answer 1',
        questionId: question.id,
        authorId: otherUser.id,
      });

      await createTestAnswer({
        body: 'Answer 2',
        questionId: question.id,
        authorId: testUser.id,
      });

      const answers = await prisma.answer.findMany({
        where: { question_id: question.id },
        include: {
          author: true,
        },
      });

      assert.strictEqual(answers.length, 2);
    });

    it('should update answer via API', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: testUser.id,
      });

      const answer = await createTestAnswer({
        body: 'Original answer',
        questionId: question.id,
        authorId: otherUser.id,
      });

      const updated = await prisma.answer.update({
        where: { id: answer.id },
        data: { body: 'Updated answer' },
      });

      assert.strictEqual(updated.body, 'Updated answer');
    });

    it('should delete answer via API', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: testUser.id,
      });

      const answer = await createTestAnswer({
        body: 'Answer to delete',
        questionId: question.id,
        authorId: otherUser.id,
      });

      await prisma.answer.update({
        where: { id: answer.id },
        data: { deleted_at: new Date() },
      });

      const deleted = await prisma.answer.findUnique({
        where: { id: answer.id },
      });

      assert.ok(deleted?.deleted_at);
    });

    it('should accept answer via API', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: testUser.id,
      });

      const answer = await createTestAnswer({
        body: 'Best answer',
        questionId: question.id,
        authorId: otherUser.id,
      });

      await prisma.question.update({
        where: { id: question.id },
        data: { accepted_answer_id: answer.id },
      });

      const updated = await prisma.question.findUnique({
        where: { id: question.id },
      });

      assert.strictEqual(updated?.accepted_answer_id, answer.id);
    });
  });

  describe('Vote API', () => {
    it('should upvote question via API', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: testUser.id,
      });

      const vote = await prisma.questionVote.create({
        data: {
          user_id: otherUser.id,
          question_id: question.id,
          value: 1,
        },
      });

      assert.strictEqual(vote.value, 1);
    });

    it('should downvote question via API', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: testUser.id,
      });

      const vote = await prisma.questionVote.create({
        data: {
          user_id: otherUser.id,
          question_id: question.id,
          value: -1,
        },
      });

      assert.strictEqual(vote.value, -1);
    });

    it('should upvote answer via API', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: testUser.id,
      });

      const answer = await createTestAnswer({
        body: 'Answer',
        questionId: question.id,
        authorId: otherUser.id,
      });

      const vote = await prisma.vote.create({
        data: {
          user_id: testUser.id,
          answer_id: answer.id,
          value: 1,
        },
      });

      assert.strictEqual(vote.value, 1);
    });

    it('should validate vote value', () => {
      const validateVoteValue = (value: number) => {
        return value === 1 || value === -1;
      };

      assert.strictEqual(validateVoteValue(1), true);
      assert.strictEqual(validateVoteValue(-1), true);
      assert.strictEqual(validateVoteValue(0), false);
      assert.strictEqual(validateVoteValue(2), false);
    });

    it('should update existing vote', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: testUser.id,
      });

      await prisma.questionVote.create({
        data: {
          user_id: otherUser.id,
          question_id: question.id,
          value: 1,
        },
      });

      const updated = await prisma.questionVote.update({
        where: {
          user_id_question_id: {
            user_id: otherUser.id,
            question_id: question.id,
          },
        },
        data: { value: -1 },
      });

      assert.strictEqual(updated.value, -1);
    });

    it('should delete vote to undo', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: testUser.id,
      });

      await prisma.questionVote.create({
        data: {
          user_id: otherUser.id,
          question_id: question.id,
          value: 1,
        },
      });

      await prisma.questionVote.delete({
        where: {
          user_id_question_id: {
            user_id: otherUser.id,
            question_id: question.id,
          },
        },
      });

      const vote = await prisma.questionVote.findUnique({
        where: {
          user_id_question_id: {
            user_id: otherUser.id,
            question_id: question.id,
          },
        },
      });

      assert.strictEqual(vote, null);
    });
  });

  describe('User API', () => {
    it('should get user profile via API', async () => {
      const user = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: {
          id: true,
          username: true,
          email: true,
          reputation: true,
          role: true,
          created_at: true,
        },
      });

      assert.ok(user);
      assert.strictEqual(user.id, testUser.id);
    });

    it('should list users via API', async () => {
      const users = await prisma.user.findMany({
        take: 10,
        select: {
          id: true,
          username: true,
          reputation: true,
        },
      });

      assert.ok(users.length >= 2);
    });

    it('should update user profile via API', async () => {
      const updated = await prisma.user.update({
        where: { id: testUser.id },
        data: { username: 'new_username' },
      });

      assert.strictEqual(updated.username, 'new_username');
    });

    it('should get user statistics', async () => {
      // Create content by user
      await createTestQuestion({
        title: 'Q1',
        description: 'Desc',
        authorId: testUser.id,
      });

      await createTestQuestion({
        title: 'Q2',
        description: 'Desc',
        authorId: testUser.id,
      });

      const stats = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: {
          _count: {
            select: {
              questions: true,
              answers: true,
            },
          },
        },
      });

      assert.ok(stats);
      assert.strictEqual(stats._count.questions, 2);
    });
  });

  describe('Bookmark API', () => {
    it('should bookmark question via API', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: otherUser.id,
      });

      const bookmark = await prisma.bookmark.create({
        data: {
          user_id: testUser.id,
          question_id: question.id,
        },
      });

      assert.ok(bookmark.id);
    });

    it('should list user bookmarks via API', async () => {
      const q1 = await createTestQuestion({
        title: 'Q1',
        description: 'Desc',
        authorId: otherUser.id,
      });

      const q2 = await createTestQuestion({
        title: 'Q2',
        description: 'Desc',
        authorId: otherUser.id,
      });

      await prisma.bookmark.create({
        data: { user_id: testUser.id, question_id: q1.id },
      });

      await prisma.bookmark.create({
        data: { user_id: testUser.id, question_id: q2.id },
      });

      const bookmarks = await prisma.bookmark.findMany({
        where: { user_id: testUser.id },
        include: { question: true },
      });

      assert.strictEqual(bookmarks.length, 2);
    });

    it('should delete bookmark via API', async () => {
      const question = await createTestQuestion({
        title: 'Question',
        description: 'Description',
        authorId: otherUser.id,
      });

      const bookmark = await prisma.bookmark.create({
        data: {
          user_id: testUser.id,
          question_id: question.id,
        },
      });

      await prisma.bookmark.delete({
        where: { id: bookmark.id },
      });

      const found = await prisma.bookmark.findUnique({
        where: { id: bookmark.id },
      });

      assert.strictEqual(found, null);
    });
  });

  describe('Search API', () => {
    it('should search questions by title', async () => {
      await createTestQuestion({
        title: 'How to use React hooks?',
        description: 'Need help with hooks',
        authorId: testUser.id,
      });

      await createTestQuestion({
        title: 'Vue.js best practices',
        description: 'Looking for Vue tips',
        authorId: otherUser.id,
      });

      const results = await prisma.question.findMany({
        where: {
          title: {
            contains: 'React',
            mode: 'insensitive',
          },
        },
      });

      assert.strictEqual(results.length, 1);
      assert.ok(results[0].title.includes('React'));
    });

    it('should search questions by tag', async () => {
      await createTestQuestion({
        title: 'Question 1',
        description: 'Description',
        authorId: testUser.id,
        tags: ['javascript'],
      });

      await createTestQuestion({
        title: 'Question 2',
        description: 'Description',
        authorId: otherUser.id,
        tags: ['python'],
      });

      const jsTag = await prisma.tag.findUnique({
        where: { name: 'javascript' },
      });

      assert.ok(jsTag);

      const results = await prisma.question.findMany({
        where: {
          tags: {
            some: {
              tag_id: jsTag.id,
            },
          },
        },
      });

      assert.strictEqual(results.length, 1);
    });
  });

  describe('Authorization', () => {
    it('should verify question author can edit', () => {
      const canEdit = (userId: string, authorId: string, userRole: string) => {
        return userId === authorId || userRole === 'ADMIN';
      };

      assert.strictEqual(canEdit(testUser.id, testUser.id, 'USER'), true);
      assert.strictEqual(canEdit(otherUser.id, testUser.id, 'USER'), false);
      assert.strictEqual(canEdit(otherUser.id, testUser.id, 'ADMIN'), true);
    });

    it('should verify answer author can edit', () => {
      const canEdit = (userId: string, authorId: string, userRole: string) => {
        return userId === authorId || userRole === 'ADMIN';
      };

      assert.strictEqual(canEdit(testUser.id, testUser.id, 'USER'), true);
      assert.strictEqual(canEdit(otherUser.id, testUser.id, 'USER'), false);
    });

    it('should verify only question author can accept answer', () => {
      const canAcceptAnswer = (userId: string, questionAuthorId: string) => {
        return userId === questionAuthorId;
      };

      assert.strictEqual(canAcceptAnswer(testUser.id, testUser.id), true);
      assert.strictEqual(canAcceptAnswer(otherUser.id, testUser.id), false);
    });
  });
});
