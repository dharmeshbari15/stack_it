// lib/embedding.ts
// Service for generating and managing question embeddings using Google Gemini (100% FREE!)

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './prisma';

// ─── Configuration ────────────────────────────────────────────────────────────

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIMENSIONS = 3072; // dimensions for gemini-embedding-001

// Initialize Gemini client (will use GEMINI_API_KEY from env)
const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmbeddingResult {
    embedding: number[];
    model: string;
}

export interface SimilarQuestion {
    id: string;
    title: string;
    description: string;
    score: number;
    created_at: Date;
    similarity: number;
    tags: Array<{ name: string }>;
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Generate embedding vector from text using Google Gemini API
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
    if (!genAI) {
        throw new Error('Gemini API key not configured. Set GEMINI_API_KEY environment variable.');
    }

    if (!text || text.trim().length === 0) {
        throw new Error('Text cannot be empty');
    }

    try {
        const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
        
        const result = await model.embedContent(text.trim());
        const embedding = result.embedding;

        return {
            embedding: embedding.values,
            model: EMBEDDING_MODEL,
        };
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding from Gemini API');
    }
}

/**
 * Create text representation of a question for embedding
 * Combines title and description with appropriate weighting
 */
export function createQuestionText(title: string, description: string): string {
    // Weight title more heavily by repeating it
    // This makes title matches score higher in similarity
    return `${title}\n${title}\n${description}`;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (normA * normB);
}

/**
 * Store or update embedding for a question
 */
export async function storeQuestionEmbedding(
    questionId: string,
    embedding: number[],
    model: string = EMBEDDING_MODEL
): Promise<void> {
    const embeddingJson = JSON.stringify(embedding);

    await prisma.questionEmbedding.upsert({
        where: { question_id: questionId },
        update: {
            embedding: embeddingJson,
            model_version: model,
            updated_at: new Date(),
        },
        create: {
            question_id: questionId,
            embedding: embeddingJson,
            model_version: model,
        },
    });
}

/**
 * Generate and store embedding for a question
 */
export async function embedQuestion(questionId: string, title: string, description: string): Promise<void> {
    const text = createQuestionText(title, description);
    const { embedding, model } = await generateEmbedding(text);
    await storeQuestionEmbedding(questionId, embedding, model);
}

/**
 * Find similar questions using cosine similarity
 * Note: This is a simple implementation that loads all embeddings into memory
 * For production with >10K questions, consider using pgvector extension
 */
export async function findSimilarQuestions(
    title: string,
    description: string,
    options: {
        limit?: number;
        threshold?: number;
        excludeQuestionId?: string;
    } = {}
): Promise<SimilarQuestion[]> {
    const { limit = 5, threshold = 0.75, excludeQuestionId } = options;

    // Generate embedding for input question
    const text = createQuestionText(title, description);
    const { embedding: queryEmbedding } = await generateEmbedding(text);

    // Fetch all question embeddings from database
    // TODO: For large datasets, use pgvector extension for efficient similarity search
    const embeddings = await prisma.questionEmbedding.findMany({
        where: {
            model_version: EMBEDDING_MODEL,
            question: {
                deleted_at: null,
                ...(excludeQuestionId ? { id: { not: excludeQuestionId } } : {}),
            },
        },
        include: {
            question: {
                include: {
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
            },
        },
    });

    // Calculate similarity scores
    const similarities: Array<{
        question: any;
        similarity: number;
    }> = [];

    for (const embeddingRecord of embeddings) {
        const storedEmbedding = JSON.parse(embeddingRecord.embedding) as number[];

        // Guard against legacy vectors from older models (e.g., 768/1536 dims).
        if (storedEmbedding.length !== EMBEDDING_DIMENSIONS) {
            continue;
        }

        const similarity = cosineSimilarity(queryEmbedding, storedEmbedding);

        if (similarity >= threshold) {
            similarities.push({
                question: embeddingRecord.question,
                similarity,
            });
        }
    }

    // Sort by similarity (highest first) and limit results
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topResults = similarities.slice(0, limit);

    // Format results
    return topResults.map(({ question, similarity }) => ({
        id: question.id,
        title: question.title,
        description: question.description,
        score: question.score,
        created_at: question.created_at,
        similarity,
        tags: question.tags.map((qt: any) => ({ name: qt.tag.name })),
    }));
}

/**
 * Batch generate embeddings for existing questions
 * Useful for backfilling embeddings when feature is first deployed
 */
export async function backfillEmbeddings(batchSize: number = 10): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    // Find questions without embeddings
    const questions = await prisma.question.findMany({
        where: {
            deleted_at: null,
            embedding: null,
        },
        take: batchSize,
    });

    console.log(`Backfilling embeddings for ${questions.length} questions...`);

    for (const question of questions) {
        try {
            await embedQuestion(question.id, question.title, question.description);
            processed++;
            console.log(`✓ Embedded question ${question.id}`);
        } catch (error) {
            console.error(`✗ Failed to embed question ${question.id}:`, error);
            failed++;
        }
    }

    return { processed, failed };
}

// ─── Duplicate Detection ──────────────────────────────────────────────────────

/**
 * Mark a question as duplicate of another
 */
export async function markAsDuplicate(
    duplicateQuestionId: string,
    canonicalQuestionId: string,
    markedByUserId: string,
    similarityScore?: number,
    notes?: string
): Promise<void> {
    // Verify both questions exist and are not deleted
    const [duplicate, canonical] = await Promise.all([
        prisma.question.findFirst({
            where: { id: duplicateQuestionId, deleted_at: null },
        }),
        prisma.question.findFirst({
            where: { id: canonicalQuestionId, deleted_at: null },
        }),
    ]);

    if (!duplicate) {
        throw new Error('Duplicate question not found');
    }

    if (!canonical) {
        throw new Error('Canonical question not found');
    }

    if (duplicateQuestionId === canonicalQuestionId) {
        throw new Error('A question cannot be a duplicate of itself');
    }

    // Check if canonical is itself a duplicate (prevent chains)
    if (canonical.duplicate_of_id) {
        throw new Error('Canonical question is itself marked as duplicate. Please use the ultimate canonical question.');
    }

    // Create duplicate link and update question
    await prisma.$transaction([
        prisma.duplicateLink.create({
            data: {
                duplicate_id: duplicateQuestionId,
                canonical_id: canonicalQuestionId,
                marked_by_id: markedByUserId,
                similarity_score: similarityScore,
                notes,
            },
        }),
        prisma.question.update({
            where: { id: duplicateQuestionId },
            data: { duplicate_of_id: canonicalQuestionId },
        }),
    ]);
}

/**
 * Remove duplicate marking from a question
 */
export async function unmarkAsDuplicate(questionId: string): Promise<void> {
    await prisma.$transaction([
        prisma.duplicateLink.deleteMany({
            where: { duplicate_id: questionId },
        }),
        prisma.question.update({
            where: { id: questionId },
            data: { duplicate_of_id: null },
        }),
    ]);
}

/**
 * Get all questions marked as duplicates of a canonical question
 */
export async function getDuplicates(canonicalQuestionId: string) {
    return await prisma.duplicateLink.findMany({
        where: { canonical_id: canonicalQuestionId },
        include: {
            duplicate_question: {
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            reputation: true,
                        },
                    },
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                },
            },
            marked_by: {
                select: {
                    id: true,
                    username: true,
                    role: true,
                },
            },
        },
    });
}
