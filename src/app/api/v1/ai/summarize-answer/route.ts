// app/api/v1/ai/summarize-answer/route.ts
// POST /api/v1/ai/summarize-answer
// Generate AI-powered summary of long answers

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBody } from '@/lib/validate';
import { isAIAvailable, summarizeAnswer } from '@/lib/ai-assistant';

// ─── Request Schema ───────────────────────────────────────────────────────────

const summarizeAnswerSchema = z.object({
    content: z.string().min(100, 'Content must be at least 100 characters to summarize'),
    questionTitle: z.string().optional(),
});

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        // Check if AI is configured
        if (!isAIAvailable()) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'AI_NOT_CONFIGURED',
                        message: 'AI features are not configured. Please set GEMINI_API_KEY.',
                    },
                },
                { status: 503 }
            );
        }

        // Parse and validate request body
        const { content, questionTitle } = await parseBody(req, summarizeAnswerSchema);

        // Generate summary using AI
        const summary = await summarizeAnswer(content, questionTitle);

        return NextResponse.json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error('Error in POST /api/v1/ai/summarize-answer:', error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'AI_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to generate summary',
                },
            },
            { status: 500 }
        );
    }
}
