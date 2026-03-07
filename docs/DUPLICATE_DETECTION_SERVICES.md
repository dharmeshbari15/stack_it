# Duplicate Detection System - Service Layer Specification

**Date**: March 7, 2026  
**Purpose**: TypeScript interfaces and service implementations for duplicate detection

---

## Table of Contents

1. [Service Architecture](#service-architecture)
2. [EmbeddingService](#embeddingservice)
3. [SimilarityService](#similarityservice)
4. [DuplicateService](#duplicateservice)
5. [Type Definitions](#type-definitions)
6. [Error Handling](#error-handling)
7. [Testing Strategy](#testing-strategy)

---

## Service Architecture

```
API Routes (Next.js)
      ↓
Service Layer
  ├── EmbeddingService    (generate embeddings via OpenAI)
  ├── SimilarityService   (find similar questions via pgvector)
  └── DuplicateService    (manage duplicate relationships)
      ↓
Prisma ORM
      ↓
PostgreSQL + pgvector
```

**Design Principles**:
- **Single Responsibility**: Each service has one clear purpose
- **Dependency Injection**: Services receive dependencies (e.g., Prisma client) for testability
- **Error Handling**: Use typed errors; never throw generic errors
- **Async/Await**: All operations are async for non-blocking I/O
- **Logging**: Structured logging for observability

---

## EmbeddingService

### Purpose
Generate vector embeddings for question text using OpenAI API.

### Implementation

```typescript
// src/lib/services/embedding-service.ts

import { createHash } from 'crypto';

export interface EmbeddingOptions {
  model?: string;  // Default: 'text-embedding-3-small'
  maxRetries?: number;  // Default: 3
  timeout?: number;  // Default: 10000ms
}

export interface EmbeddingResult {
  embedding: number[];  // 1536 dimensions
  model: string;
  tokenCount: number;
  cached: boolean;  // True if from cache
}

export interface EmbeddingCache {
  get(key: string): Promise<number[] | null>;
  set(key: string, embedding: number[], ttl?: number): Promise<void>;
}

export class EmbeddingServiceError extends Error {
  constructor(
    message: string,
    public code: 'API_ERROR' | 'RATE_LIMIT' | 'TIMEOUT' | 'INVALID_INPUT',
    public details?: any
  ) {
    super(message);
    this.name = 'EmbeddingServiceError';
  }
}

export class EmbeddingService {
  private static readonly DEFAULT_MODEL = 'text-embedding-3-small';
  private static readonly MAX_TEXT_LENGTH = 8000;  // ~8K tokens max for OpenAI
  private static readonly OPENAI_API_URL = 'https://api.openai.com/v1/embeddings';
  
  private static cache?: EmbeddingCache;
  
  /**
   * Set cache implementation (optional; for performance)
   */
  static setCache(cache: EmbeddingCache) {
    this.cache = cache;
  }
  
  /**
   * Prepare question text for embedding generation
   * Combines title and description with explicit labels
   * 
   * @param title - Question title
   * @param description - Question description (may contain HTML)
   * @param tags - Optional tags (for future tag-weighted similarity)
   * @returns Prepared text string
   */
  static prepareQuestionText(
    title: string, 
    description: string, 
    tags?: string[]
  ): string {
    // Strip HTML tags from description
    const cleanDescription = description
      .replace(/<[^>]*>/g, ' ')      // Remove HTML tags
      .replace(/&[^;]+;/g, ' ')      // Remove HTML entities
      .replace(/\s+/g, ' ')          // Collapse whitespace
      .trim();
    
    // Truncate description to 500 characters (balance detail vs. cost)
    const truncatedDescription = cleanDescription.length > 500
      ? cleanDescription.substring(0, 500) + '...'
      : cleanDescription;
    
    // Format: "Title: {title}\n\nDescription: {description}"
    let text = `Title: ${title}\n\nDescription: ${truncatedDescription}`;
    
    // Optional: Include tags for future tag-weighted similarity
    if (tags && tags.length > 0) {
      text += `\n\nTags: ${tags.join(', ')}`;
    }
    
    // Validate length
    if (text.length > this.MAX_TEXT_LENGTH) {
      text = text.substring(0, this.MAX_TEXT_LENGTH);
    }
    
    return text;
  }
  
  /**
   * Generate embedding for given text using OpenAI API
   * 
   * @param text - Text to embed (already prepared)
   * @param options - Configuration options
   * @returns Embedding result with vector and metadata
   * @throws EmbeddingServiceError on failure
   */
  static async generateEmbedding(
    text: string,
    options: EmbeddingOptions = {}
  ): Promise<EmbeddingResult> {
    const model = options.model || this.DEFAULT_MODEL;
    const maxRetries = options.maxRetries || 3;
    const timeout = options.timeout || 10000;
    
    // Input validation
    if (!text || text.trim().length === 0) {
      throw new EmbeddingServiceError(
        'Text cannot be empty',
        'INVALID_INPUT'
      );
    }
    
    if (text.length > this.MAX_TEXT_LENGTH) {
      throw new EmbeddingServiceError(
        `Text too long (max ${this.MAX_TEXT_LENGTH} chars)`,
        'INVALID_INPUT',
        { length: text.length }
      );
    }
    
    // Check cache
    if (this.cache) {
      const cacheKey = this.getCacheKey(text, model);
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return {
          embedding: cached,
          model,
          tokenCount: this.estimateTokenCount(text),
          cached: true
        };
      }
    }
    
    // Retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.callOpenAIAPI(text, model, timeout);
        
        // Cache result
        if (this.cache) {
          const cacheKey = this.getCacheKey(text, model);
          await this.cache.set(cacheKey, result.embedding, 3600);  // 1 hour TTL
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on invalid input or rate limits
        if (
          error instanceof EmbeddingServiceError && 
          (error.code === 'INVALID_INPUT' || error.code === 'RATE_LIMIT')
        ) {
          throw error;
        }
        
        // Exponential backoff
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;  // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    throw new EmbeddingServiceError(
      `Failed after ${maxRetries} retries: ${lastError?.message}`,
      'API_ERROR',
      { lastError }
    );
  }
  
  /**
   * Call OpenAI Embeddings API
   * @private
   */
  private static async callOpenAIAPI(
    text: string,
    model: string,
    timeout: number
  ): Promise<EmbeddingResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new EmbeddingServiceError(
        'OPENAI_API_KEY environment variable not set',
        'API_ERROR'
      );
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(this.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: text,
          model: model,
          encoding_format: 'float'
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          throw new EmbeddingServiceError(
            'OpenAI API rate limit exceeded',
            'RATE_LIMIT',
            errorData
          );
        }
        
        throw new EmbeddingServiceError(
          `OpenAI API error: ${response.statusText}`,
          'API_ERROR',
          { status: response.status, ...errorData }
        );
      }
      
      const data = await response.json();
      const embedding = data.data[0].embedding;
      
      return {
        embedding,
        model,
        tokenCount: data.usage.total_tokens,
        cached: false
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if ((error as any).name === 'AbortError') {
        throw new EmbeddingServiceError(
          `Request timeout after ${timeout}ms`,
          'TIMEOUT'
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Get cache key for text and model
   * @private
   */
  private static getCacheKey(text: string, model: string): string {
    const hash = createHash('sha256').update(text).digest('hex');
    return `embedding:${model}:${hash}`;
  }
  
  /**
   * Estimate token count (rough approximation)
   * @private
   */
  private static estimateTokenCount(text: string): number {
    // Rough estimate: ~4 characters per token for English
    return Math.ceil(text.length / 4);
  }
}
```

---

## SimilarityService

### Purpose
Find similar questions using vector similarity search in PostgreSQL.

### Implementation

```typescript
// src/lib/services/similarity-service.ts

import { PrismaClient } from '@/generated/prisma/client';

export interface SimilarQuestion {
  id: string;
  title: string;
  description: string;
  score: number;
  similarity: number;  // 0.0 - 1.0
  similarity_percentage: number;  // 0 - 100
  created_at: Date;
  author: {
    id: string;
    username: string;
    reputation: number;
  };
  tags: Array<{ id: string; name: string; }>;
  answer_count: number;
  accepted_answer_exists: boolean;
}

export interface SimilaritySearchOptions {
  threshold?: number;  // Default: 0.85
  limit?: number;  // Default: 5
  excludeQuestionId?: string;  // Don't return this question
  onlyWithAnswers?: boolean;  // Only return questions with answers
}

export class SimilarityServiceError extends Error {
  constructor(
    message: string,
    public code: 'DATABASE_ERROR' | 'INVALID_EMBEDDING',
    public details?: any
  ) {
    super(message);
    this.name = 'SimilarityServiceError';
  }
}

export class SimilarityService {
  private static readonly DEFAULT_THRESHOLD = 0.85;
  private static readonly DEFAULT_LIMIT = 5;
  
  /**
   * Find similar questions for given embedding vector
   * 
   * @param embedding - 1536-dimensional vector
   * @param options - Search options
   * @returns Array of similar questions
   */
  static async findSimilarQuestions(
    embedding: number[],
    options: SimilaritySearchOptions = {}
  ): Promise<SimilarQuestion[]> {
    const threshold = options.threshold || this.DEFAULT_THRESHOLD;
    const limit = options.limit || this.DEFAULT_LIMIT;
    
    // Validate embedding
    if (!Array.isArray(embedding) || embedding.length !== 1536) {
      throw new SimilarityServiceError(
        'Invalid embedding: must be array of 1536 numbers',
        'INVALID_EMBEDDING',
        { length: embedding.length }
      );
    }
    
    try {
      // Convert to pgvector format: [1, 2, 3, ...]
      const embeddingStr = `[${embedding.join(',')}]`;
      
      // Build SQL query
      // Using raw SQL for pgvector operators (Prisma doesn't support them natively)
      const results = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          q.id,
          q.title,
          LEFT(q.description, 200) AS description,  -- Truncate for performance
          q.score,
          q.created_at,
          1 - (qe.embedding <=> $1::vector(1536)) AS similarity,
          u.id AS author_id,
          u.username AS author_username,
          u.reputation AS author_reputation,
          (
            SELECT COUNT(*) 
            FROM "Answer" a 
            WHERE a.question_id = q.id AND a.deleted_at IS NULL
          ) AS answer_count,
          (
            SELECT COUNT(*) > 0
            FROM "Answer" a2 
            WHERE a2.question_id = q.id AND a2.id = q.accepted_answer_id
          ) AS accepted_answer_exists
        FROM "QuestionEmbedding" qe
        JOIN "Question" q ON q.id = qe.question_id
        JOIN "User" u ON u.id = q.author_id
        WHERE 
          q.deleted_at IS NULL
          ${options.excludeQuestionId ? `AND q.id != '${options.excludeQuestionId}'` : ''}
          ${options.onlyWithAnswers ? 'AND EXISTS (SELECT 1 FROM "Answer" WHERE question_id = q.id AND deleted_at IS NULL)' : ''}
          AND 1 - (qe.embedding <=> $1::vector(1536)) >= $2
        ORDER BY qe.embedding <=> $1::vector(1536) ASC
        LIMIT $3
      `, embeddingStr, threshold, limit);
      
      // Fetch tags for each question (separate query for performance)
      const questionIds = results.map(r => r.id);
      const tags = await prisma.questionTag.findMany({
        where: { question_id: { in: questionIds } },
        select: {
          question_id: true,
          tag: { select: { id: true, name: true } }
        }
      });
      
      // Group tags by question
      const tagsByQuestion = new Map<string, Array<{ id: string; name: string; }>>();
      tags.forEach(t => {
        if (!tagsByQuestion.has(t.question_id)) {
          tagsByQuestion.set(t.question_id, []);
        }
        tagsByQuestion.get(t.question_id)!.push(t.tag);
      });
      
      // Transform to typed result
      return results.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        score: r.score,
        similarity: parseFloat(r.similarity),
        similarity_percentage: Math.round(parseFloat(r.similarity) * 100),
        created_at: r.created_at,
        author: {
          id: r.author_id,
          username: r.author_username,
          reputation: r.author_reputation
        },
        tags: tagsByQuestion.get(r.id) || [],
        answer_count: parseInt(r.answer_count),
        accepted_answer_exists: r.accepted_answer_exists
      }));
    } catch (error) {
      throw new SimilarityServiceError(
        `Failed to search similar questions: ${(error as Error).message}`,
        'DATABASE_ERROR',
        { error }
      );
    }
  }
  
  /**
   * Calculate cosine similarity between two vectors (utility function)
   * Formula: similarity = (A · B) / (||A|| × ||B||)
   * 
   * @param vec1 - First vector
   * @param vec2 - Second vector
   * @returns Similarity score (0.0 - 1.0)
   */
  static cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have same length');
    }
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }
}
```

---

## DuplicateService

### Purpose
Manage duplicate question relationships (mark, unmark, get canonical).

### Implementation

```typescript
// src/lib/services/duplicate-service.ts

import { PrismaClient } from '@/generated/prisma/client';

export interface DuplicateInfo {
  isDuplicate: true;
  canonicalQuestion: {
    id: string;
    title: string;
    url: string;
    score: number;
    answer_count: number;
    accepted_answer_exists: boolean;
  };
  markedAt: Date;
  markedBy: {
    id: string;
    username: string;
  };
  reason: string | null;
  similarityScore: number | null;
}

export interface MarkDuplicateOptions {
  reason?: string;
  similarityScore?: number;
}

export class DuplicateServiceError extends Error {
  constructor(
    message: string,
    public code: 
      | 'CIRCULAR_REFERENCE' 
      | 'ALREADY_DUPLICATE' 
      | 'CANONICAL_NOT_FOUND' 
      | 'CANONICAL_IS_DUPLICATE'
      | 'SAME_QUESTION'
      | 'DATABASE_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'DuplicateServiceError';
  }
}

export class DuplicateService {
  constructor(private prisma: PrismaClient) {}
  
  /**
   * Mark a question as duplicate of another (canonical)
   * 
   * @param duplicateId - Question to mark as duplicate
   * @param canonicalId - Canonical (original) question
   * @param markedBy - User ID of moderator
   * @param options - Additional options
   * @throws DuplicateServiceError if invalid
   */
  async markAsDuplicate(
    duplicateId: string,
    canonicalId: string,
    markedBy: string,
    options: MarkDuplicateOptions = {}
  ): Promise<void> {
    // Validation 1: Can't be duplicate of itself
    if (duplicateId === canonicalId) {
      throw new DuplicateServiceError(
        'Question cannot be duplicate of itself',
        'SAME_QUESTION'
      );
    }
    
    // Validation 2: Check both questions exist and not deleted
    const [duplicate, canonical] = await Promise.all([
      this.prisma.question.findFirst({
        where: { id: duplicateId, deleted_at: null }
      }),
      this.prisma.question.findFirst({
        where: { id: canonicalId, deleted_at: null }
      })
    ]);
    
    if (!duplicate) {
      throw new DuplicateServiceError(
        'Duplicate question not found or deleted',
        'DATABASE_ERROR',
        { duplicateId }
      );
    }
    
    if (!canonical) {
      throw new DuplicateServiceError(
        'Canonical question not found or deleted',
        'CANONICAL_NOT_FOUND',
        { canonicalId }
      );
    }
    
    // Validation 3: Canonical cannot itself be a duplicate (no chaining)
    const canonicalDuplicate = await this.prisma.duplicateLink.findFirst({
      where: { 
        duplicate_id: canonicalId,
        unmarked_at: null
      }
    });
    
    if (canonicalDuplicate) {
      throw new DuplicateServiceError(
        'Canonical question is itself a duplicate (no chaining allowed)',
        'CANONICAL_IS_DUPLICATE',
        { canonicalId, canonicalDuplicateOf: canonicalDuplicate.canonical_id }
      );
    }
    
    // Validation 4: Check if already marked as duplicate
    const existingLink = await this.prisma.duplicateLink.findFirst({
      where: { 
        duplicate_id: duplicateId,
        unmarked_at: null
      }
    });
    
    if (existingLink) {
      throw new DuplicateServiceError(
        'Question already marked as duplicate',
        'ALREADY_DUPLICATE',
        { existingCanonicalId: existingLink.canonical_id }
      );
    }
    
    // Validation 5: Check for circular reference (A→B, B→A)
    const reverseLink = await this.prisma.duplicateLink.findFirst({
      where: {
        duplicate_id: canonicalId,
        canonical_id: duplicateId,
        unmarked_at: null
      }
    });
    
    if (reverseLink) {
      throw new DuplicateServiceError(
        'Circular duplicate reference detected',
        'CIRCULAR_REFERENCE',
        { duplicateId, canonicalId }
      );
    }
    
    // All validations passed; create duplicate link
    await this.prisma.duplicateLink.create({
      data: {
        duplicate_id: duplicateId,
        canonical_id: canonicalId,
        marked_by: markedBy,
        reason: options.reason || null,
        similarity_score: options.similarityScore || null
      }
    });
    
    // Optional: Soft-delete duplicate question (or leave visible for SEO)
    // await this.prisma.question.update({
    //   where: { id: duplicateId },
    //   data: { deleted_at: new Date() }
    // });
  }
  
  /**
   * Unmark a question as duplicate (undo)
   * 
   * @param duplicateId - Question to unmark
   * @param unmarkedBy - User ID of moderator
   * @throws DuplicateServiceError if not marked as duplicate
   */
  async unmarkDuplicate(
    duplicateId: string,
    unmarkedBy: string
  ): Promise<void> {
    const link = await this.prisma.duplicateLink.findFirst({
      where: { 
        duplicate_id: duplicateId,
        unmarked_at: null
      }
    });
    
    if (!link) {
      throw new DuplicateServiceError(
        'Question is not marked as duplicate',
        'DATABASE_ERROR',
        { duplicateId }
      );
    }
    
    // Soft delete: Mark as unmarked (preserve audit trail)
    await this.prisma.duplicateLink.update({
      where: { id: link.id },
      data: {
        unmarked_at: new Date(),
        unmarked_by: unmarkedBy
      }
    });
    
    // Optional: Restore question if soft-deleted
    // await this.prisma.question.update({
    //   where: { id: duplicateId },
    //   data: { deleted_at: null }
    // });
  }
  
  /**
   * Check if a question is marked as duplicate
   * 
   * @param questionId - Question ID to check
   * @returns True if marked as duplicate
   */
  async isDuplicate(questionId: string): Promise<boolean> {
    const count = await this.prisma.duplicateLink.count({
      where: {
        duplicate_id: questionId,
        unmarked_at: null
      }
    });
    
    return count > 0;
  }
  
  /**
   * Get duplicate info for a question
   * 
   * @param questionId - Question ID
   * @returns Duplicate info if marked; null if not duplicate
   */
  async getDuplicateInfo(questionId: string): Promise<DuplicateInfo | null> {
    const link = await this.prisma.duplicateLink.findFirst({
      where: {
        duplicate_id: questionId,
        unmarked_at: null
      },
      include: {
        canonical: {
          select: {
            id: true,
            title: true,
            score: true,
            accepted_answer_id: true,
            answers: {
              where: { deleted_at: null },
              select: { id: true }
            }
          }
        },
        marker: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });
    
    if (!link) {
      return null;
    }
    
    return {
      isDuplicate: true,
      canonicalQuestion: {
        id: link.canonical.id,
        title: link.canonical.title,
        url: `/questions/${link.canonical.id}`,
        score: link.canonical.score,
        answer_count: link.canonical.answers.length,
        accepted_answer_exists: link.canonical.accepted_answer_id !== null
      },
      markedAt: link.marked_at,
      markedBy: {
        id: link.marker.id,
        username: link.marker.username
      },
      reason: link.reason,
      similarityScore: link.similarity_score
    };
  }
  
  /**
   * Get all duplicates of a canonical question
   * 
   * @param canonicalId - Canonical question ID
   * @returns Array of duplicate questions
   */
  async getDuplicates(canonicalId: string): Promise<Array<{
    id: string;
    title: string;
    url: string;
    markedAt: Date;
  }>> {
    const duplicates = await this.prisma.duplicateLink.findMany({
      where: {
        canonical_id: canonicalId,
        unmarked_at: null
      },
      include: {
        duplicate: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { marked_at: 'desc' }
    });
    
    return duplicates.map(d => ({
      id: d.duplicate.id,
      title: d.duplicate.title,
      url: `/questions/${d.duplicate.id}`,
      markedAt: d.marked_at
    }));
  }
  
  /**
   * Get canonical question for a given question (follows chain)
   * Uses database function for cycle detection
   * 
   * @param questionId - Question ID
   * @returns Canonical question ID (may be same if not duplicate)
   */
  async getCanonicalQuestionId(questionId: string): Promise<string> {
    try {
      const result = await this.prisma.$queryRawUnsafe<Array<{ get_canonical_question_id: string }>>(
        'SELECT get_canonical_question_id($1) AS result',
        questionId
      );
      
      return result[0].get_canonical_question_id;
    } catch (error) {
      // Handle cycle detection error from database function
      if ((error as Error).message.includes('Circular duplicate')) {
        throw new DuplicateServiceError(
          'Circular duplicate chain detected',
          'CIRCULAR_REFERENCE',
          { questionId }
        );
      }
      
      throw new DuplicateServiceError(
        `Failed to get canonical question: ${(error as Error).message}`,
        'DATABASE_ERROR',
        { error, questionId }
      );
    }
  }
}
```

---

## Type Definitions

```typescript
// src/types/duplicate-detection.ts

export interface CheckSimilarityRequest {
  title: string;
  description: string;
  tags?: string[];
}

export interface CheckSimilarityResponse {
  similar_questions: SimilarQuestion[];
  processing_time_ms: number;
}

export interface MarkDuplicateRequest {
  canonical_id: string;
  reason?: string;
}

export interface MarkDuplicateResponse {
  success: true;
  duplicate_link: {
    id: string;
    duplicate_id: string;
    canonical_id: string;
    marked_by: string;
    marked_at: string;
    reason: string | null;
  };
  canonical_question: {
    id: string;
    title: string;
    url: string;
  };
}
```

---

## Error Handling

All services use typed errors for consistent error handling:

```typescript
// src/lib/error-handler.ts

export function handleServiceError(error: unknown): Response {
  if (error instanceof EmbeddingServiceError) {
    return Response.json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    }, { status: error.code === 'RATE_LIMIT' ? 429 : 500 });
  }
  
  if (error instanceof SimilarityServiceError) {
    return Response.json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    }, { status: 500 });
  }
  
  if (error instanceof DuplicateServiceError) {
    const statusCodes = {
      'CIRCULAR_REFERENCE': 400,
      'ALREADY_DUPLICATE': 409,
      'CANONICAL_NOT_FOUND': 404,
      'CANONICAL_IS_DUPLICATE': 400,
      'SAME_QUESTION': 400,
      'DATABASE_ERROR': 500
    };
    
    return Response.json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    }, { status: statusCodes[error.code] || 500 });
  }
  
  // Generic error
  return Response.json({
    error: {
      code: 'INTERNAL_ERROR',
      message: (error as Error).message || 'An unexpected error occurred'
    }
  }, { status: 500 });
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// src/lib/services/__tests__/embedding-service.test.ts

import { describe, it, expect, vi } from 'vitest';
import { EmbeddingService } from '../embedding-service';

describe('EmbeddingService', () => {
  describe('prepareQuestionText', () => {
    it('should combine title and description', () => {
      const result = EmbeddingService.prepareQuestionText(
        'How to sort array?',
        'I want to sort an array of numbers'
      );
      
      expect(result).toContain('Title: How to sort array?');
      expect(result).toContain('Description: I want to sort an array of numbers');
    });
    
    it('should strip HTML tags from description', () => {
      const result = EmbeddingService.prepareQuestionText(
        'Test',
        '<p>Hello <strong>world</strong></p>'
      );
      
      expect(result).not.toContain('<p>');
      expect(result).toContain('Hello world');
    });
    
    it('should truncate long descriptions', () => {
      const longDesc = 'a'.repeat(1000);
      const result = EmbeddingService.prepareQuestionText('Test', longDesc);
      
      expect(result.length).toBeLessThan(600);
      expect(result).toContain('...');
    });
  });
  
  describe('generateEmbedding', () => {
    it('should throw on empty text', async () => {
      await expect(
        EmbeddingService.generateEmbedding('')
      ).rejects.toThrow('Text cannot be empty');
    });
    
    // More tests...
  });
});
```

### Integration Tests

```typescript
// src/lib/services/__tests__/similarity-service.integration.test.ts

import { describe, it, expect } from 'vitest';
import { SimilarityService } from '../similarity-service';
import { EmbeddingService } from '../embedding-service';

describe('SimilarityService (integration)', () => {
  it('should find similar questions', async () => {
    // Generate embedding for test question
    const embedding = await EmbeddingService.generateEmbedding(
      'Title: How to reverse a string in JavaScript?\n\nDescription: I need to reverse a string'
    );
    
    // Search for similar questions
    const results = await SimilarityService.findSimilarQuestions(
      embedding.embedding,
      { limit: 5 }
    );
    
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('similarity');
    expect(results[0].similarity).toBeGreaterThanOrEqual(0.85);
  });
});
```

---

**END OF SERVICE SPECIFICATION**
