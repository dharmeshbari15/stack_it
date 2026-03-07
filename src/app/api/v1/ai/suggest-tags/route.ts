// app/api/v1/ai/suggest-tags/route.ts
// POST /api/v1/ai/suggest-tags
// AI-powered tag suggestions for questions

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBody } from '@/lib/validate';
import { isAIAvailable, suggestTags } from '@/lib/ai-assistant';

// ─── Request Schema ───────────────────────────────────────────────────────────

const suggestTagsSchema = z.object({
    title: z.string().min(10, 'Title must be at least 10 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
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
                    data: { suggestions: [] },
                },
                { status: 503 }
            );
        }

        // Parse and validate request body
        const { title, description } = await parseBody(req, suggestTagsSchema);

        // Generate tag suggestions using AI
        const suggestions = await suggestTags(title, description);

        return NextResponse.json({
            success: true,
            data: {
                suggestions,
                model: 'gpt-4o-mini',
            },
        });
    } catch (error) {
        console.error('Error in POST /api/v1/ai/suggest-tags:', error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'AI_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to generate tag suggestions',
                },
            },
            { status: 500 }
        );
    }
}
