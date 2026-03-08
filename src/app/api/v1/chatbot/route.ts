// app/api/v1/chatbot/route.ts
// POST /api/v1/chatbot
// AI chatbot for helping users with programming questions

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseBody } from '@/lib/validate';
import { isChatbotAvailable, sendChatMessage, ChatMessage } from '@/lib/chatbot';

// ─── Request Schema ───────────────────────────────────────────────────────────

const chatMessageSchema = z.object({
    message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
    conversationHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string()
    })).optional().default([]),
});

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        // Check if chatbot is configured
        if (!isChatbotAvailable()) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'CHATBOT_NOT_CONFIGURED',
                        message: 'Chatbot is not available. Please configure GEMINI_API_KEY environment variable.',
                    },
                },
                { status: 503 }
            );
        }

        // Parse and validate request body
        const { message, conversationHistory } = await parseBody(req, chatMessageSchema);

        // Send message to chatbot
        const response = await sendChatMessage(message, conversationHistory as ChatMessage[]);

        return NextResponse.json({
            success: true,
            data: {
                message: response.message,
                timestamp: new Date().toISOString()
            },
        });
    } catch (error) {
        console.error('Error in POST /api/v1/chatbot:', error);

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'CHATBOT_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to process chat message',
                },
            },
            { status: 500 }
        );
    }
}
