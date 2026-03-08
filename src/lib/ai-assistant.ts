// lib/ai-assistant.ts
// AI-powered question and answer assistance using Google Gemini (100% FREE!)

import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './prisma';

// ─── Configuration ────────────────────────────────────────────────────────────

const CHAT_MODEL = 'gemini-2.0-flash'; // Stable and available for current Gemini API keys.
const MAX_TOKENS = 500;

// Initialize Gemini client (will use GEMINI_API_KEY from env)
const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TagSuggestion {
    name: string;
    confidence: number; // 0-1
    reason: string;
}

export interface QualityFeedback {
    score: number; // 0-100
    level: 'excellent' | 'good' | 'needs-improvement' | 'poor';
    suggestions: string[];
    strengths: string[];
}

export interface AnswerSummary {
    summary: string;
    keyPoints: string[];
    readingTime: number; // estimated minutes for full answer
}

function isGeminiRecoverableError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /quota|resource_exhausted|too many requests|429|not found|404|retry/i.test(message);
}

function fallbackSuggestTags(
    title: string,
    description: string,
    availableTags: string[]
): TagSuggestion[] {
    const text = `${title} ${description}`.toLowerCase();
    const matches = availableTags
        .map((tag) => {
            const normalized = tag.toLowerCase();
            let score = 0;

            if (text.includes(normalized)) score += 0.9;
            if (title.toLowerCase().includes(normalized)) score += 0.1;

            return { name: tag, confidence: Math.min(0.99, score) };
        })
        .filter((t) => t.confidence > 0)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5)
        .map((t) => ({
            name: t.name,
            confidence: Math.max(0.55, t.confidence),
            reason: 'Keyword match from your question content',
        }));

    return matches;
}

function fallbackQuality(title: string, description: string): QualityFeedback {
    let score = 40;
    const strengths: string[] = [];
    const suggestions: string[] = [];

    if (title.length >= 20) {
        score += 12;
        strengths.push('Title is descriptive enough');
    } else {
        suggestions.push('Make the title more specific (include framework/error/context)');
    }

    if (description.length >= 120) {
        score += 15;
        strengths.push('Description has useful detail');
    } else {
        suggestions.push('Add more detail: expected behavior, actual behavior, and what you tried');
    }

    if (/```|error|exception|stack|trace/i.test(description)) {
        score += 12;
        strengths.push('Includes technical signals (errors/code/context)');
    } else {
        suggestions.push('Include the exact error message or minimal code snippet');
    }

    if (/expected|actual|tried|attempted|reproduce/i.test(description)) {
        score += 11;
        strengths.push('Shows troubleshooting context');
    } else {
        suggestions.push('Describe expected vs actual behavior and your troubleshooting steps');
    }

    score = Math.max(0, Math.min(100, score));
    const level: QualityFeedback['level'] =
        score > 80 ? 'excellent' : score > 60 ? 'good' : score > 40 ? 'needs-improvement' : 'poor';

    return {
        score,
        level,
        suggestions: suggestions.slice(0, 4),
        strengths: strengths.slice(0, 3),
    };
}

function fallbackSummary(answerContent: string, readingTime: number): AnswerSummary {
    const sentences = answerContent
        .replace(/\s+/g, ' ')
        .split(/(?<=[.!?])\s+/)
        .filter(Boolean);

    const summary = sentences.slice(0, 3).join(' ') || answerContent.substring(0, 240);
    const keyPoints = sentences.slice(0, 4).map((s) => s.trim()).filter(Boolean);

    return {
        summary,
        keyPoints,
        readingTime,
    };
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Check if AI features are available
 */
export function isAIAvailable(): boolean {
    return genAI !== null;
}

/**
 * Get available tags from database for context
 */
async function getAvailableTags(): Promise<string[]> {
    const tags = await prisma.tag.findMany({
        select: { name: true },
        orderBy: {
            questions: {
                _count: 'desc'
            }
        },
        take: 100, // Top 100 most used tags
    });
    return tags.map(t => t.name);
}

// ─── AI Tag Suggestion ────────────────────────────────────────────────────────

/**
 * Suggest relevant tags for a question using AI
 * Analyzes title and description to recommend appropriate tags
 */
export async function suggestTags(
    title: string,
    description: string
): Promise<TagSuggestion[]> {
    if (!genAI) {
        throw new Error('Gemini API key not configured. Set GEMINI_API_KEY environment variable.');
    }

    // Get available tags from database
    const availableTags = await getAvailableTags();

    const prompt = `You are a technical assistant helping users tag their programming questions on a Stack Overflow-like platform.

Available tags in our system: ${availableTags.join(', ')}

Question Title: ${title}

Question Description (excerpt): ${description.substring(0, 500)}

Task: Suggest 3-5 most relevant tags from the available tags list. Only suggest tags that exist in the available tags list.

Respond in JSON format:
{
  "tags": [
    {
      "name": "tag-name",
      "confidence": 0.95,
      "reason": "Brief reason why this tag is relevant"
    }
  ]
}`;

    try {
        const model = genAI.getGenerativeModel({ 
            model: CHAT_MODEL,
            generationConfig: {
                maxOutputTokens: MAX_TOKENS,
                temperature: 0.3, // Lower temperature for more consistent results
            },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();
        
        if (!content) {
            throw new Error('No response from AI');
        }

        // Extract JSON from response (Gemini might wrap it in code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return (parsed.tags || []).slice(0, 5); // Max 5 suggestions
    } catch (error) {
        console.error('Error suggesting tags:', error);
        if (isGeminiRecoverableError(error)) {
            return fallbackSuggestTags(title, description, availableTags);
        }
        throw new Error('Failed to generate tag suggestions');
    }
}

// ─── Question Quality Analysis ────────────────────────────────────────────────

/**
 * Analyze question quality and provide improvement suggestions
 * Helps users write better, more answerable questions
 */
export async function analyzeQuestionQuality(
    title: string,
    description: string
): Promise<QualityFeedback> {
    if (!genAI) {
        throw new Error('Gemini API key not configured. Set GEMINI_API_KEY environment variable.');
    }

    const prompt = `You are a quality reviewer for a Stack Overflow-like Q&A platform. Analyze this question and provide constructive feedback.

Question Title: ${title}

Question Description: ${description}

Evaluate the question based on:
1. Clarity - Is it clear what's being asked?
2. Specificity - Is it specific enough to be answerable?
3. Context - Does it provide necessary background?
4. Research effort - Does it show prior research?
5. Reproducibility - For technical issues, is there a minimal reproducible example?
6. Grammar and formatting - Is it well-written?

Respond in JSON format:
{
  "score": 75,
  "level": "good",
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "strengths": ["Strength 1", "Strength 2"]
}

Score: 0-100 (0-40: poor, 41-60: needs-improvement, 61-80: good, 81-100: excellent)
Level: "excellent", "good", "needs-improvement", or "poor"
Suggestions: 2-4 specific, actionable improvements
Strengths: 1-3 things the question does well`;

    try {
        const model = genAI.getGenerativeModel({ 
            model: CHAT_MODEL,
            generationConfig: {
                maxOutputTokens: MAX_TOKENS,
                temperature: 0.4,
            },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();
        
        if (!content) {
            throw new Error('No response from AI');
        }

        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            score: parsed.score || 50,
            level: parsed.level || 'needs-improvement',
            suggestions: parsed.suggestions || [],
            strengths: parsed.strengths || [],
        };
    } catch (error) {
        console.error('Error analyzing question quality:', error);
        if (isGeminiRecoverableError(error)) {
            return fallbackQuality(title, description);
        }
        throw new Error('Failed to analyze question quality');
    }
}

// ─── Answer Summarization ─────────────────────────────────────────────────────

/**
 * Generate a concise summary of a long answer
 * Helps users quickly understand lengthy technical explanations
 */
export async function summarizeAnswer(
    answerContent: string,
    questionTitle?: string
): Promise<AnswerSummary> {
    if (!genAI) {
        throw new Error('Gemini API key not configured. Set GEMINI_API_KEY environment variable.');
    }

    // Estimate reading time (average 200 words per minute)
    const wordCount = answerContent.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // If answer is short, don't summarize
    if (wordCount < 150) {
        return {
            summary: answerContent.substring(0, 200) + (answerContent.length > 200 ? '...' : ''),
            keyPoints: ['Answer is already concise'],
            readingTime: 1,
        };
    }

    const prompt = `You are summarizing a technical answer on a Q&A platform.

${questionTitle ? `Question: ${questionTitle}\n\n` : ''}Answer Content:
${answerContent.substring(0, 2000)} ${answerContent.length > 2000 ? '...(truncated)' : ''}

Task: Create a concise summary and extract key points.

Respond in JSON format:
{
  "summary": "A 2-3 sentence summary of the answer",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
}

Guidelines:
- Summary should be 2-3 sentences, capturing the main solution
- Extract 3-5 key points or steps
- Focus on actionable information
- Preserve technical accuracy`;

    try {
        const model = genAI.getGenerativeModel({ 
            model: CHAT_MODEL,
            generationConfig: {
                maxOutputTokens: MAX_TOKENS,
                temperature: 0.3,
            },
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const content = response.text();
        
        if (!content) {
            throw new Error('No response from AI');
        }

        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            summary: parsed.summary || 'Unable to generate summary',
            keyPoints: parsed.keyPoints || [],
            readingTime,
        };
    } catch (error) {
        console.error('Error summarizing answer:', error);
        if (isGeminiRecoverableError(error)) {
            return fallbackSummary(answerContent, readingTime);
        }
        throw new Error('Failed to generate answer summary');
    }
}

// ─── Batch Operations ─────────────────────────────────────────────────────────

/**
 * Analyze question and provide all AI insights at once
 * More efficient than calling each function separately
 */
export async function analyzeQuestionComplete(
    title: string,
    description: string
): Promise<{
    tags: TagSuggestion[];
    quality: QualityFeedback;
}> {
    if (!genAI) {
        throw new Error('Gemini API key not configured');
    }

    // Run tag suggestions and quality analysis in parallel
    const [tags, quality] = await Promise.all([
        suggestTags(title, description),
        analyzeQuestionQuality(title, description),
    ]);

    return { tags, quality };
}
