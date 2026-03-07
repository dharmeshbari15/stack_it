/**
 * Test Utilities and Helpers
 * Provides reusable functions for creating test data and mocking
 */

import { PrismaClient } from '../generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

// In-memory mock database for tests
let prisma: PrismaClient;

/**
 * Initialize test database connection
 * Note: Uses Prisma v7 adapter pattern with pg Pool
 */
export const initTestDb = () => {
  if (!prisma) {
    // Set default test DB URL if not provided
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/stack_it_test';
    
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    
    prisma = new PrismaClient({
      adapter,
      log: process.env.DEBUG_TESTS ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return prisma;
};

/**
 * Clean up test database - delete all records
 */
export const cleanupTestDb = async () => {
  const prisma = initTestDb();
  
  // Delete in correct order to respect foreign keys
  await prisma.notification.deleteMany();
  await prisma.reputationHistory.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.followUser.deleteMany();
  await prisma.followQuestion.deleteMany();
  await prisma.followTag.deleteMany();
  await prisma.duplicateLink.deleteMany();
  await prisma.questionEmbedding.deleteMany();
  await prisma.questionVersion.deleteMany();
  await prisma.answerVersion.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.questionVote.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.questionTag.deleteMany();
  await prisma.question.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
};

/**
 * Close database connection
 */
export const closeTestDb = async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
};

// ────────────────────────────────────────────────────────────────────────────────
// Test Data Builders
// ────────────────────────────────────────────────────────────────────────────────

interface UserBuilderOptions {
  username?: string;
  email?: string;
  password?: string;
  role?: 'USER' | 'ADMIN' | 'GUEST';
  reputation?: number;
}

/**
 * Create a test user
 */
export const createTestUser = async (options: UserBuilderOptions = {}) => {
  const prisma = initTestDb();
  const defaultPassword = 'Password123!';
  
  const username = options.username || `testuser_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const email = options.email || `${username}@test.com`;
  const passwordHash = await bcrypt.hash(options.password || defaultPassword, 10);
  
  return await prisma.user.create({
    data: {
      username,
      email,
      password_hash: passwordHash,
      role: options.role || 'USER',
      reputation: options.reputation || 0,
    },
  });
};

interface QuestionBuilderOptions {
  title?: string;
  description?: string;
  authorId: string;
  tags?: string[];
}

/**
 * Create a test question
 */
export const createTestQuestion = async (options: QuestionBuilderOptions) => {
  const prisma = initTestDb();
  
  const title = options.title || `Test Question ${Date.now()}`;
  const description = options.description || 'This is a test question description.';
  
  const question = await prisma.question.create({
    data: {
      title,
      description,
      author_id: options.authorId,
    },
  });
  
  // Add tags if provided
  if (options.tags && options.tags.length > 0) {
    for (const tagName of options.tags) {
      let tag = await prisma.tag.findUnique({ where: { name: tagName } });
      if (!tag) {
        tag = await prisma.tag.create({ data: { name: tagName } });
      }
      
      await prisma.questionTag.create({
        data: {
          question_id: question.id,
          tag_id: tag.id,
        },
      });
    }
  }
  
  return question;
};

interface AnswerBuilderOptions {
  body?: string;
  questionId: string;
  authorId: string;
}

/**
 * Create a test answer
 */
export const createTestAnswer = async (options: AnswerBuilderOptions) => {
  const prisma = initTestDb();
  
  const body = options.body || 'This is a test answer.';
  
  return await prisma.answer.create({
    data: {
      body,
      question_id: options.questionId,
      author_id: options.authorId,
    },
  });
};

interface TagBuilderOptions {
  name: string;
}

/**
 * Create a test tag
 */
export const createTestTag = async (options: TagBuilderOptions) => {
  const prisma = initTestDb();
  
  return await prisma.tag.create({
    data: {
      name: options.name,
    },
  });
};

interface CommentBuilderOptions {
  body?: string;
  authorId: string;
  questionId?: string;
  answerId?: string;
  parentId?: string;
}

/**
 * Create a test comment
 */
export const createTestComment = async (options: CommentBuilderOptions) => {
  const prisma = initTestDb();
  
  const body = options.body || 'This is a test comment.';
  
  return await prisma.comment.create({
    data: {
      body,
      author_id: options.authorId,
      question_id: options.questionId,
      answer_id: options.answerId,
      parent_id: options.parentId,
    },
  });
};

/**
 * Create a test vote
 */
export const createTestVote = async (userId: string, answerId: string, value: 1 | -1) => {
  const prisma = initTestDb();
  
  return await prisma.vote.create({
    data: {
      user_id: userId,
      answer_id: answerId,
      value,
    },
  });
};

/**
 * Create a test question vote
 */
export const createTestQuestionVote = async (userId: string, questionId: string, value: 1 | -1) => {
  const prisma = initTestDb();
  
  return await prisma.questionVote.create({
    data: {
      user_id: userId,
      question_id: questionId,
      value,
    },
  });
};

/**
 * Create a test bookmark
 */
export const createTestBookmark = async (userId: string, questionId: string, customTag?: string) => {
  const prisma = initTestDb();
  
  return await prisma.bookmark.create({
    data: {
      user_id: userId,
      question_id: questionId,
      custom_tag: customTag,
    },
  });
};

/**
 * Create a test notification
 */
export const createTestNotification = async (
  userId: string,
  actorId: string,
  type: 'ANSWER' | 'MENTION' | 'SYSTEM' | 'NEW_ANSWER_ON_FOLLOWED_QUESTION' | 'NEW_QUESTION_WITH_FOLLOWED_TAG',
  referenceId: string
) => {
  const prisma = initTestDb();
  
  return await prisma.notification.create({
    data: {
      user_id: userId,
      actor_id: actorId,
      type,
      reference_id: referenceId,
    },
  });
};

// ────────────────────────────────────────────────────────────────────────────────
// Assertion Helpers
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Check if a user exists in the database
 */
export const assertUserExists = async (userId: string) => {
  const prisma = initTestDb();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error(`User ${userId} does not exist`);
  }
  return user;
};

/**
 * Check if a question exists in the database
 */
export const assertQuestionExists = async (questionId: string) => {
  const prisma = initTestDb();
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    throw new Error(`Question ${questionId} does not exist`);
  }
  return question;
};

/**
 * Check if an answer exists in the database
 */
export const assertAnswerExists = async (answerId: string) => {
  const prisma = initTestDb();
  const answer = await prisma.answer.findUnique({ where: { id: answerId } });
  if (!answer) {
    throw new Error(`Answer ${answerId} does not exist`);
  }
  return answer;
};

/**
 * Get user's current reputation
 */
export const getUserReputation = async (userId: string) => {
  const prisma = initTestDb();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { reputation: true },
  });
  return user?.reputation || 0;
};

/**
 * Mock API Request/Response objects for Next.js route handlers
 */
export const mockNextRequest = (method: string, body?: any, headers?: Record<string, string>) => {
  return {
    method,
    json: async () => body,
    headers: new Map(Object.entries(headers || {})),
    url: 'http://localhost:3000/api/test',
  } as any;
};

export const mockNextResponse = () => {
  const response = {
    status: 200,
    body: null as any,
    headers: new Map<string, string>(),
  };
  
  return {
    json: (data: any, init?: ResponseInit) => {
      response.body = data;
      response.status = init?.status || 200;
      return response;
    },
    Response: {
      json: (data: any, init?: ResponseInit) => {
        response.body = data;
        response.status = init?.status || 200;
        return response;
      },
    },
  } as any;
};

/**
 * Wait for a condition to be true (useful for async operations)
 */
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
};

/**
 * Generate random string for unique test data
 */
export const randomString = (length = 10) => {
  return Math.random().toString(36).substring(2, length + 2);
};

/**
 * Generate random email
 */
export const randomEmail = () => {
  return `test_${randomString()}@example.com`;
};

/**
 * Generate random username
 */
export const randomUsername = () => {
  return `user_${randomString()}`;
};
