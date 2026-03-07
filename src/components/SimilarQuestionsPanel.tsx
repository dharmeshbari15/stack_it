'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';

interface SimilarQuestion {
    id: string;
    title: string;
    description: string;
    score: number;
    similarity: number;
    created_at: string;
    tags: string[];
}

interface SimilarQuestionsProps {
    title: string;
    description: string;
    onCheck?: (hasSimilar: boolean) => void;
}

export function SimilarQuestionsPanel({ title, description, onCheck }: SimilarQuestionsProps) {
    const [similarQuestions, setSimilarQuestions] = useState<SimilarQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkSimilarity = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/questions/check-similarity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, description }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to check for similar questions');
            }

            const similar = data.data.similar_questions || [];
            setSimilarQuestions(similar);
            onCheck?.(similar.length > 0);
        } catch (err) {
            console.error('Error checking similarity:', err);
            setError(err instanceof Error ? err.message : 'Failed to check for similar questions');
        } finally {
            setIsLoading(false);
        }
    }, [title, description, onCheck]);

    useEffect(() => {
        // Debounce: only check after user stops typing for 1 second
        const timer = setTimeout(() => {
            if (title.length >= 10 && description.length >= 30) {
                checkSimilarity();
            } else {
                setSimilarQuestions([]);
                onCheck?.(false);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [title, description, checkSimilarity, onCheck]);

    if (isLoading) {
        return (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-2 text-blue-800 font-semibold mb-3">
                    <div className="h-5 w-5 bg-blue-200 rounded"></div>
                    <div className="h-4 w-48 bg-blue-200 rounded"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-blue-200 rounded w-full"></div>
                    <div className="h-4 bg-blue-200 rounded w-3/4"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
                <p className="text-sm text-yellow-800">
                    Could not check for similar questions. You can still post your question.
                </p>
            </div>
        );
    }

    if (similarQuestions.length === 0) {
        return null;
    }

    // Determine warning level based on highest similarity
    const highestSimilarity = Math.max(...similarQuestions.map((q) => q.similarity));
    const isHighSimilarity = highestSimilarity >= 0.85;

    return (
        <div
            className={`border rounded-2xl p-6 ${
                isHighSimilarity
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-blue-50 border-blue-100'
            }`}
        >
            <div className="flex items-start gap-3 mb-4">
                {isHighSimilarity ? (
                    <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                ) : (
                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                    <h3
                        className={`font-bold mb-1 ${
                            isHighSimilarity ? 'text-orange-900' : 'text-blue-900'
                        }`}
                    >
                        {isHighSimilarity
                            ? '⚠️ Your question seems very similar to existing questions'
                            : 'Similar questions found'}
                    </h3>
                    <p
                        className={`text-sm ${
                            isHighSimilarity ? 'text-orange-800' : 'text-blue-800'
                        }`}
                    >
                        {isHighSimilarity
                            ? 'Please check if any of these questions answer your problem before posting.'
                            : 'These questions might be related to yours. Take a look to see if they help.'}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {similarQuestions.map((question) => (
                    <Link
                        key={question.id}
                        href={`/questions/${question.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {question.title}
                                    </h4>
                                    <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                    {question.description}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <span className="font-semibold text-gray-700">
                                            {question.score}
                                        </span>{' '}
                                        votes
                                    </span>
                                    {question.tags.length > 0 && (
                                        <div className="flex gap-1">
                                            {question.tags.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div
                                className={`flex-shrink-0 px-2 py-1 rounded-lg text-xs font-bold ${
                                    question.similarity >= 0.9
                                        ? 'bg-red-100 text-red-700'
                                        : question.similarity >= 0.85
                                        ? 'bg-orange-100 text-orange-700'
                                        : question.similarity >= 0.80
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-blue-100 text-blue-700'
                                }`}
                            >
                                {Math.round(question.similarity * 100)}% match
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {isHighSimilarity && (
                <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                    <p className="text-xs text-orange-900 font-medium">
                        💡 <strong>Tip:</strong> If none of these questions solve your problem, explain in
                        your question what makes it different from the existing ones.
                    </p>
                </div>
            )}
        </div>
    );
}
