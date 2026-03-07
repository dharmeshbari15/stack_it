// lib/chatbot.ts
// AI-powered chatbot for helping users with programming questions
// Using Google Gemini API (100% FREE!)

import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Configuration ────────────────────────────────────────────────────────────

const CHAT_MODEL = 'gemini-1.5-flash'; // Fast, free, and powerful!
const MAX_TOKENS = 1000;

// Initialize Gemini client
const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    message: string;
    conversationId?: string;
}

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a helpful programming assistant on a Stack Overflow-like Q&A platform called "StackIt".

Your role:
- Help users understand programming concepts
- Suggest how to improve their questions
- Provide quick programming tips and explanations
- Guide users to ask better questions
- Recommend relevant tags for their questions
- Explain error messages

Guidelines:
- Be friendly, helpful, and concise
- Use code examples when helpful (use markdown code blocks)
- For complex questions, suggest the user post a full question on the platform
- Don't write entire applications - guide users to learn
- If you don't know something, say so
- Keep responses under 300 words unless explaining complex topics
- Use emojis sparingly for friendliness

Remember: You're a helpful guide, not a replacement for the Q&A community!`;

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Check if chatbot is available
 */
export function isChatbotAvailable(): boolean {
    return genAI !== null;
}

/**
 * Send a message to the chatbot and get a response
 */
export async function sendChatMessage(
    userMessage: string,
    conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
    if (!genAI) {
        throw new Error('Chatbot is not configured. Set GEMINI_API_KEY environment variable.');
    }

    if (!userMessage || userMessage.trim().length === 0) {
        throw new Error('Message cannot be empty');
    }

    try {
        // Initialize the model
        const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

        // Build conversation history in Gemini format
        // Gemini requires: 1) First message must be 'user', 2) Roles must alternate
        const rawHistory = conversationHistory.slice(-8).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Filter to ensure it starts with 'user' and roles alternate
        const history: Array<{ role: string; parts: Array<{ text: string }> }> = [];
        for (let i = 0; i < rawHistory.length; i++) {
            const msg = rawHistory[i];
            
            // First message must be 'user'
            if (history.length === 0 && msg.role === 'model') {
                continue; // Skip assistant messages at the start
            }
            
            // Ensure roles alternate (no consecutive same roles)
            if (history.length > 0 && history[history.length - 1].role === msg.role) {
                continue; // Skip if same role as previous
            }
            
            history.push(msg);
        }

        // Start chat with history
        const chat = model.startChat({
            history: history,
            generationConfig: {
                maxOutputTokens: MAX_TOKENS,
                temperature: 0.7,
            },
        });

        // Send message with system prompt context
        const prompt = conversationHistory.length === 0 
            ? `${SYSTEM_PROMPT}\n\nUser: ${userMessage}`
            : userMessage;

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const assistantMessage = response.text() || 'Sorry, I couldn\'t generate a response.';

        return {
            message: assistantMessage,
        };
    } catch (error) {
        console.error('Error in chatbot:', error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error('Failed to get response from chatbot');
    }
}

/**
 * Get a quick answer for common questions
 */
export async function getQuickAnswer(question: string): Promise<string> {
    if (!genAI) {
        throw new Error('Chatbot is not configured');
    }

    try {
        const model = genAI.getGenerativeModel({ model: CHAT_MODEL });

        const prompt = `You are a concise programming helper. Answer in 2-3 sentences maximum. Be direct and helpful.\n\nQuestion: ${question}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return response.text() || 'I couldn\'t find an answer.';
    } catch (error) {
        console.error('Error getting quick answer:', error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error('Failed to get quick answer');
    }
}

/**
 * Suggest how to improve a question before asking the chatbot
 */
export function preprocessUserMessage(message: string): {
    message: string;
    suggestions: string[];
} {
    const suggestions: string[] = [];
    
    // Check if message is too short
    if (message.length < 10) {
        suggestions.push('Try to provide more details about your question');
    }
    
    // Check if it looks like a code dump without context
    if (message.includes('```') && message.split('```').length > 2 && message.length < 50) {
        suggestions.push('Add some context to your code - what are you trying to achieve?');
    }
    
    // Check if message is all caps
    if (message === message.toUpperCase() && message.length > 20) {
        suggestions.push('No need to shout! 😊 Try using normal case');
    }

    return {
        message,
        suggestions
    };
}
