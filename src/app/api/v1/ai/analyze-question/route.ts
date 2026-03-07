// app/api/v1/ai/analyze-question/route.ts
// POST /api/v1/ai/analyze-question
// AI-powered question quality analysis and improvement suggestions

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBody } from '@/lib/validate';
import { isAIAvailable, analyzeQuestionQuality } from '@/lib/ai-assistant';

// ─── Request Schema ───────────────────────────────────────────────────────────

const analyzeQuestionSchema = z.object({
    title: z.string().min(10, 'Title must be at least 10 characters'),
    description: z.string().min(30, 'Description must be at least 30 characters'),
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
                        message: 'AI features are not configured. Please set OPENAI_API_KEY.',
                    },
                    data: {
                        score: 50,
                        level: 'needs-improvement',
                        suggestions: [],
                        strengths: [],
                    },
                },
                { status: 503 }
            );
        }

        // Parse and validate request body
        const { title, description } = await parseBody(req, analyzeQuestionSchema);

        // Analyze question quality using AI
        const analysis = await analyzeQuestionQuality(title, description);

        return NextResponse.json({
            success: true,
            data: analysis,
        });
    } catch (error) {
        console.error('Error in POST /api/v1/ai/analyze-question:', error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'AI_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to analyze question',
                },
            },
            { status: 500 }
        );
    }
}
