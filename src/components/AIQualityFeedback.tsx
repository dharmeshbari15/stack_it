'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface QualityFeedback {
    score: number;
    level: 'excellent' | 'good' | 'needs-improvement' | 'poor';
    suggestions: string[];
    strengths: string[];
}

interface AIQualityFeedbackProps {
    title: string;
    description: string;
}

export function AIQualityFeedback({ title, description }: AIQualityFeedbackProps) {
    const [feedback, setFeedback] = useState<QualityFeedback | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Debounce: analyze after user stops typing for 2 seconds
        const timer = setTimeout(() => {
            if (title.length >= 10 && description.length >= 30) {
                analyzeQuality();
            } else {
                setFeedback(null);
            }
        }, 2000);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, description]);

    const analyzeQuality = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/ai/analyze-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 503) {
                    // AI not configured - silent fail
                    setFeedback(null);
                    return;
                }
                throw new Error(data.error?.message || 'Failed to analyze question');
            }

            setFeedback(data.data);
        } catch (err) {
            console.error('Error analyzing question:', err);
            setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-purple-700">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">AI is analyzing your question...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return null; // Silent fail for better UX
    }

    if (!feedback) {
        return null;
    }

    // Color scheme based on quality level
    const colorScheme = {
        excellent: {
            bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
            border: 'border-green-200',
            icon: 'text-green-600',
            title: 'text-green-800',
            text: 'text-green-700',
        },
        good: {
            bg: 'bg-gradient-to-r from-blue-50 to-cyan-50',
            border: 'border-blue-200',
            icon: 'text-blue-600',
            title: 'text-blue-800',
            text: 'text-blue-700',
        },
        'needs-improvement': {
            bg: 'bg-gradient-to-r from-yellow-50 to-orange-50',
            border: 'border-yellow-200',
            icon: 'text-yellow-600',
            title: 'text-yellow-800',
            text: 'text-yellow-700',
        },
        poor: {
            bg: 'bg-gradient-to-r from-red-50 to-pink-50',
            border: 'border-red-200',
            icon: 'text-red-600',
            title: 'text-red-800',
            text: 'text-red-700',
        },
    };

    const colors = colorScheme[feedback.level];
    const Icon = feedback.level === 'excellent' || feedback.level === 'good' 
        ? CheckCircle2 
        : feedback.level === 'needs-improvement' 
        ? Info 
        : AlertTriangle;

    return (
        <div className={`${colors.bg} border ${colors.border} rounded-xl p-5 space-y-4`}>
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className={`w-5 h-5 ${colors.icon}`} />
                    <h3 className={`font-semibold ${colors.title}`}>
                        AI Quality Analysis
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                    <span className={`text-lg font-bold ${colors.title}`}>
                        {feedback.score}/100
                    </span>
                </div>
            </div>

            {/* Strengths */}
            {feedback.strengths.length > 0 && (
                <div>
                    <h4 className={`text-sm font-semibold ${colors.text} mb-2 flex items-center gap-1`}>
                        <CheckCircle2 className="w-4 h-4" />
                        What&#39;s Good
                    </h4>
                    <ul className={`text-sm ${colors.text} space-y-1 ml-5`}>
                        {feedback.strengths.map((strength, idx) => (
                            <li key={idx} className="list-disc">
                                {strength}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Suggestions */}
            {feedback.suggestions.length > 0 && (
                <div>
                    <h4 className={`text-sm font-semibold ${colors.text} mb-2 flex items-center gap-1`}>
                        <Info className="w-4 h-4" />
                        How to Improve
                    </h4>
                    <ul className={`text-sm ${colors.text} space-y-1 ml-5`}>
                        {feedback.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="list-disc">
                                {suggestion}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Footer note */}
            <div className={`text-xs ${colors.text} opacity-75 pt-2 border-t ${colors.border}`}>
                💡 This analysis is AI-generated to help you write better questions
            </div>
        </div>
    );
}
