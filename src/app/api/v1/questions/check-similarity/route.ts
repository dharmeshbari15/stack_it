// app/api/v1/questions/check-similarity/route.ts
// POST /api/v1/questions/check-similarity
//
// Check if a question is similar to existing questions
// Expects: { title, description }
// Returns: Array of similar questions with similarity scores

import { z } from 'zod';
import { apiHandler, apiSuccess, internalError } from '@/lib/api-handler';
import { parseBody } from '@/lib/validate';
import { findSimilarQuestions } from '@/lib/embedding';

// ─── Request Schema ───────────────────────────────────────────────────────────

const checkSimilaritySchema = z.object({
    title: z
        .string()
        .min(5, 'Title must be at least 5 characters')
        .max(255, 'Title must be at most 255 characters'),
    description: z
        .string()
        .min(20, 'Description must be at least 20 characters'),
    excludeQuestionId: z.string().uuid().optional(),
});

// ─── Handler ──────────────────────────────────────────────────────────────────

export const POST = apiHandler(async (req) => {
    try {
        // 1. Input Validation
        const { title, description, excludeQuestionId } = await parseBody(req, checkSimilaritySchema);

        // 2. Check OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY) {
            return apiSuccess({
                similar_questions: [],
                note: 'Duplicate detection is not configured. Set OPENAI_API_KEY environment variable.',
            });
        }

        // 3. Find similar questions
        const similarQuestions = await findSimilarQuestions(title, description, {
            limit: 5,
            threshold: 0.75, // 75% similarity threshold
            excludeQuestionId,
        });

        // 4. Format response
        return apiSuccess({
            similar_questions: similarQuestions.map((q) => ({
                id: q.id,
                title: q.title,
                description: q.description.substring(0, 200) + (q.description.length > 200 ? '...' : ''),
                score: q.score,
                similarity: Math.round(q.similarity * 100) / 100, // Round to 2 decimals
                created_at: q.created_at,
                tags: q.tags.map((t) => t.name),
            })),
        });
    } catch (error) {
        console.error('Error checking similarity:', error);
        
        if (error instanceof Error && error.message.includes('OpenAI')) {
            throw internalError('Failed to check for similar questions. Please try again later.');
        }

        throw error;
    }
});
