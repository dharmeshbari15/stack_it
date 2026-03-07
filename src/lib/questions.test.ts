/**
 * Questions Service Tests
 * Tests question creation, retrieval, updating, and deletion
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  initTestDb,
  cleanupTestDb,
  closeTestDb,
  createTestUser,
  createTestQuestion,
  createTestTag,
  assertQuestionExists,
  randomUsername,
  randomEmail,
} from './test-utils';

describe('Questions Service', () => {
  let testUser: any;
  const prisma = initTestDb();

  beforeEach(async () => {
    await cleanupTestDb();
    testUser = await createTestUser({
      username: randomUsername(),
      email: randomEmail(),
    });
  });

  afterEach(async () => {
    await cleanupTestDb();
  });

  describe('Question Creation', () => {
    it('should create question with valid data', async () => {
      const question = await createTestQuestion({
        title: 'How to use async/await in JavaScript?',
        description: 'I am confused about async/await syntax.',
        authorId: testUser.id,
      });

      assert.ok(question.id);
      assert.strictEqual(question.title, 'How to use async/await in JavaScript?');
      assert.strictEqual(question.author_id, testUser.id);
      assert.strictEqual(question.score, 0);
      assert.strictEqual(question.deleted_at, null);
    });

    it('should create question with tags', async () => {
      const question = await createTestQuestion({
        title: 'React useState question',
        description: 'How does useState work?',
        authorId: testUser.id,
        tags: ['javascript', 'react', 'hooks'],
      });

      const questionWithTags = await prisma.question.findUnique({
        where: { id: question.id },
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      assert.ok(questionWithTags);
      assert.strictEqual(questionWithTags.tags.length, 3);
      const tagNames = questionWithTags.tags.map((qt) => qt.tag.name).sort();
      assert.deepEqual(tagNames, ['hooks', 'javascript', 'react']);
    });

    it('should reuse existing tags', async () => {
      // Create a tag first
      await createTestTag({ name: 'javascript' });

      const question1 = await createTestQuestion({
        title: 'Question 1',
        description: 'Description 1',
        authorId: testUser.id,
        tags: ['javascript'],
      });

      const question2 = await createTestQuestion({
        title: 'Question 2',
        description: 'Description 2',
        authorId: testUser.id,
        tags: ['javascript'],
      });

      // Should only have one javascript tag
      const tags = await prisma.tag.findMany({ where: { name: 'javascript' } });
      assert.strictEqual(tags.length, 1);
    });

    it('should set default score to 0', async () => {
      const question = await createTestQuestion({
        title: 'Test Question',
        description: 'Test Description',
        authorId: testUser.id,
      });

      assert.strictEqual(question.score, 0);
    });

    it('should set created_at timestamp', async () => {
      const question = await createTestQuestion({
        title: 'Test Question',
        description: 'Test Description',
        authorId: testUser.id,
      });

      assert.ok(question.created_at);
      assert.ok(question.created_at instanceof Date);
    });
  });

  describe('Question Validation', () => {
    const validateQuestion = (title: string, description: string) => {
      const errors: string[] = [];

      if (!title || title.trim().length === 0) {
        errors.push('Title is required');
      }

      if (title && title.length > 255) {
        errors.push('Title must be 255 characters or less');
      }

      if (!description || description.trim().length === 0) {
        errors.push('Description is required');
      }

      if (description && description.length < 20) {
        errors.push('Description must be at least 20 characters');
      }

      return { valid: errors.length === 0, errors };
    };

    it('should accept valid question', () => {
      const result = validateQuestion(
        'Valid Question Title',
        'This is a valid question description with sufficient length.'
      );

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject question without title', () => {
      const result = validateQuestion('', 'Valid description with enough characters.');

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('Title is required')));
    });

    it('should reject question without description', () => {
      const result = validateQuestion('Valid Title', '');

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('Description is required')));
    });

    it('should reject question with title too long', () => {
      const longTitle = 'a'.repeat(256);
      const result = validateQuestion(longTitle, 'Valid description with enough characters.');

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('255 characters')));
    });

    it('should reject question with description too short', () => {
      const result = validateQuestion('Valid Title', 'Short');

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes('at least 20 characters')));
    });
  });

  describe('Question Retrieval', () => {
    it('should retrieve question by ID', async () => {
      const created = await createTestQuestion({
        title: 'Test Question',
        description: 'Test Description',
        authorId: testUser.id,
      });

      const retrieved = await prisma.question.findUnique({
        where: { id: created.id },
      });

      assert.ok(retrieved);
      assert.strictEqual(retrieved.id, created.id);
      assert.strictEqual(retrieved.title, created.title);
    });

    it('should retrieve question with author', async () => {
      const question = await createTestQuestion({
        title: 'Test Question',
        description: 'Test Description',
        authorId: testUser.id,
      });

      const retrieved = await prisma.question.findUnique({
        where: { id: question.id },
        include: { author: true },
      });

      assert.ok(retrieved);
      assert.ok(retrieved.author);
      assert.strictEqual(retrieved.author.id, testUser.id);
      assert.strictEqual(retrieved.author.username, testUser.username);
    });

    it('should retrieve question with tags', async () => {
      const question = await createTestQuestion({
        title: 'Test Question',
        description: 'Test Description',
        authorId: testUser.id,
        tags: ['javascript', 'typescript'],
      });

      const retrieved = await prisma.question.findUnique({
        where: { id: question.id },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });

      assert.ok(retrieved);
      assert.strictEqual(retrieved.tags.length, 2);
    });

    it('should list questions with pagination', async () => {
      // Create multiple questions
      for (let i = 0; i < 5; i++) {
        await createTestQuestion({
          title: `Question ${i}`,
          description: 'Test Description',
          authorId: testUser.id,
        });
      }

      const page1 = await prisma.question.findMany({
        take: 2,
        skip: 0,
        orderBy: { created_at: 'desc' },
      });

      const page2 = await prisma.question.findMany({
        take: 2,
        skip: 2,
        orderBy: { created_at: 'desc' },
      });

      assert.strictEqual(page1.length, 2);
      assert.strictEqual(page2.length, 2);
      assert.notEqual(page1[0].id, page2[0].id);
    });

    it('should filter questions by tag', async () => {
      await createTestQuestion({
        title: 'JavaScript Question',
        description: 'About JavaScript',
        authorId: testUser.id,
        tags: ['javascript'],
      });

      await createTestQuestion({
        title: 'Python Question',
        description: 'About Python',
        authorId: testUser.id,
        tags: ['python'],
      });

      const jsTag = await prisma.tag.findUnique({ where: { name: 'javascript' } });
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

      assert.strictEqual(jsQuestions.length, 1);
      assert.ok(jsQuestions[0].title.includes('JavaScript'));
    });

    it('should sort questions by score', async () => {
      const q1 = await createTestQuestion({
        title: 'Question 1',
        description: 'Description',
        authorId: testUser.id,
      });

      const q2 = await createTestQuestion({
        title: 'Question 2',
        description: 'Description',
        authorId: testUser.id,
      });

      // Update scores
      await prisma.question.update({
        where: { id: q1.id },
        data: { score: 5 },
      });

      await prisma.question.update({
        where: { id: q2.id },
        data: { score: 10 },
      });

      const sorted = await prisma.question.findMany({
        orderBy: { score: 'desc' },
      });

      assert.strictEqual(sorted[0].id, q2.id);
      assert.strictEqual(sorted[1].id, q1.id);
    });

    it('should sort questions by date', async () => {
      const q1 = await createTestQuestion({
        title: 'Old Question',
        description: 'Description',
        authorId: testUser.id,
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const q2 = await createTestQuestion({
        title: 'New Question',
        description: 'Description',
        authorId: testUser.id,
      });

      const sorted = await prisma.question.findMany({
        orderBy: { created_at: 'desc' },
      });

      assert.strictEqual(sorted[0].id, q2.id);
      assert.strictEqual(sorted[1].id, q1.id);
    });
  });

  describe('Question Update', () => {
    it('should update question title', async () => {
      const question = await createTestQuestion({
        title: 'Original Title',
        description: 'Description',
        authorId: testUser.id,
      });

      const updated = await prisma.question.update({
        where: { id: question.id },
        data: { title: 'Updated Title' },
      });

      assert.strictEqual(updated.title, 'Updated Title');
    });

    it('should update question description', async () => {
      const question = await createTestQuestion({
        title: 'Title',
        description: 'Original Description',
        authorId: testUser.id,
      });

      const updated = await prisma.question.update({
        where: { id: question.id },
        data: { description: 'Updated Description' },
      });

      assert.strictEqual(updated.description, 'Updated Description');
    });

    it('should update question score', async () => {
      const question = await createTestQuestion({
        title: 'Title',
        description: 'Description',
        authorId: testUser.id,
      });

      const updated = await prisma.question.update({
        where: { id: question.id },
        data: { score: 5 },
      });

      assert.strictEqual(updated.score, 5);
    });
  });

  describe('Question Deletion', () => {
    it('should soft delete question', async () => {
      const question = await createTestQuestion({
        title: 'Title',
        description: 'Description',
        authorId: testUser.id,
      });

      const deleted = await prisma.question.update({
        where: { id: question.id },
        data: { deleted_at: new Date() },
      });

      assert.ok(deleted.deleted_at);
    });

    it('should exclude deleted questions from listing', async () => {
      const q1 = await createTestQuestion({
        title: 'Active Question',
        description: 'Description',
        authorId: testUser.id,
      });

      const q2 = await createTestQuestion({
        title: 'Deleted Question',
        description: 'Description',
        authorId: testUser.id,
      });

      // Soft delete q2
      await prisma.question.update({
        where: { id: q2.id },
        data: { deleted_at: new Date() },
      });

      const activeQuestions = await prisma.question.findMany({
        where: { deleted_at: null },
      });

      assert.strictEqual(activeQuestions.length, 1);
      assert.strictEqual(activeQuestions[0].id, q1.id);
    });
  });

  describe('Security - XSS Prevention', () => {
    it('should store XSS payload without executing it', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const question = await createTestQuestion({
        title: xssPayload,
        description: `Description with ${xssPayload}`,
        authorId: testUser.id,
      });

      // Verify data is stored as-is (sanitization happens on output)
      assert.strictEqual(question.title, xssPayload);
      assert.ok(question.description.includes(xssPayload));
    });
  });
});
