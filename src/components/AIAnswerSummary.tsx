'use client';

import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface AnswerSummary {
    summary: string;
    keyPoints: string[];
    readingTime: number;
}

interface AIAnswerSummaryProps {
    answerContent: string;
    questionTitle?: string;
}

export function AIAnswerSummary({ 
    answerContent, 
    questionTitle 
}: AIAnswerSummaryProps) {
    const [summary, setSummary] = useState<AnswerSummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Only show summary button for longer answers
    const wordCount = answerContent.split(/\s+/).length;
    if (wordCount < 150) {
        return null;
    }

    const generateSummary = async () => {
        if (summary) {
            setIsExpanded(!isExpanded);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/ai/summarize-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    content: answerContent,
                    questionTitle 
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 503) {
                    // AI not configured
                    return;
                }
                throw new Error(data.error?.message || 'Failed to generate summary');
            }

            setSummary(data.data);
            setIsExpanded(true);
        } catch (err) {
            console.error('Error generating summary:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate summary');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="my-4">
            {/* Summary Toggle Button */}
            <button
                onClick={generateSummary}
                disabled={isLoading}
                className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 
                           hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating AI Summary...</span>
                    </>
                ) : (
                    <>
                        <Sparkles className="w-4 h-4" />
                        <span>
                            {summary ? (isExpanded ? 'Hide' : 'Show') + ' AI Summary' : 'Generate AI Summary'}
                        </span>
                        {summary && (
                            isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                    </>
                )}
            </button>

            {/* Error State */}
            {error && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                </div>
            )}

            {/* Summary Content */}
            {summary && isExpanded && (
                <div className="mt-3 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            <h4 className="font-semibold text-purple-900">AI-Generated Summary</h4>
                        </div>
                        <span className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                            ~{summary.readingTime} min read (full answer)
                        </span>
                    </div>

                    {/* Summary Text */}
                    <div className="text-sm text-gray-800 leading-relaxed">
                        {summary.summary}
                    </div>

                    {/* Key Points */}
                    {summary.keyPoints.length > 0 && (
                        <div>
                            <h5 className="text-sm font-semibold text-purple-900 mb-2">
                                Key Points:
                            </h5>
                            <ul className="space-y-2">
                                {summary.keyPoints.map((point, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className="text-purple-600 font-bold mt-0.5">•</span>
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-xs text-purple-700 opacity-75 pt-3 border-t border-purple-200">
                        💡 This is an AI-generated summary. Read the full answer for complete details.
                    </div>
                </div>
            )}
        </div>
    );
}
