'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Plus } from 'lucide-react';

interface TagSuggestion {
    name: string;
    confidence: number;
    reason: string;
}

interface AITagSuggestionsProps {
    title: string;
    description: string;
    currentTags: string;
    onSelectTag: (tag: string) => void;
}

export function AITagSuggestions({ 
    title, 
    description, 
    currentTags,
    onSelectTag 
}: AITagSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Debounce: suggest tags after user stops typing for 2 seconds
        const timer = setTimeout(() => {
            if (title.length >= 15 && description.length >= 50) {
                fetchSuggestions();
            } else {
                setSuggestions([]);
            }
        }, 2000);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title, description]);

    const fetchSuggestions = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/v1/ai/suggest-tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 503) {
                    // AI not configured - silent fail
                    setSuggestions([]);
                    return;
                }
                throw new Error(data.error?.message || 'Failed to fetch suggestions');
            }

            // Filter out tags that are already added
            const existingTags = new Set(
                currentTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
            );
            const filtered = (data.data.suggestions || []).filter(
                (s: TagSuggestion) => !existingTags.has(s.name.toLowerCase())
            );

            setSuggestions(filtered);
        } catch (err) {
            console.error('Error fetching tag suggestions:', err);
            setError(err instanceof Error ? err.message : 'Failed to load suggestions');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-purple-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-medium">AI is suggesting tags...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return null; // Silent fail
    }

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">AI Tag Suggestions</h3>
            </div>

            {/* Suggestions */}
            <div className="space-y-3">
                {suggestions.map((suggestion, idx) => (
                    <div
                        key={idx}
                        className="bg-white/80 rounded-lg p-3 hover:bg-white transition-colors"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onSelectTag(suggestion.name)}
                                    className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 
                                               text-white text-sm font-medium rounded-full transition-colors"
                                >
                                    <Plus className="w-3 h-3" />
                                    {suggestion.name}
                                </button>
                                <span className="text-xs text-purple-700 font-medium">
                                    {Math.round(suggestion.confidence * 100)}% confident
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 ml-1">
                            {suggestion.reason}
                        </p>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="text-xs text-purple-700 opacity-75 mt-4 pt-3 border-t border-purple-200">
                💡 AI analyzed your question to suggest relevant tags
            </div>
        </div>
    );
}
