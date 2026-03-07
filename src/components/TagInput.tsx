'use client';

import { useEffect, useMemo, useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    maxTags?: number;
}

export function TagInput({ value, onChange, placeholder = 'Add a tag...', maxTags = 5 }: TagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [popularTags, setPopularTags] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const loadTags = async () => {
            try {
                const response = await fetch('/api/v1/tags?limit=50');
                const data = await response.json();
                if (response.ok && data.success) {
                    setPopularTags((data.data.tags || []).map((t: { name: string }) => t.name));
                }
            } catch (err) {
                console.error('Failed to load tag suggestions:', err);
            }
        };

        loadTags();
    }, []);

    const suggestions = useMemo(() => {
        const token = inputValue.trim().toLowerCase();
        if (!token) return [];

        return popularTags
            .filter((tag) => tag.toLowerCase().includes(token))
            .map((tag) => tag.toLowerCase())
            .filter((tag) => !value.includes(tag))
            .slice(0, 8);
    }, [inputValue, popularTags, value]);

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim().toLowerCase();
        if (!trimmedTag) return;

        // Prevent duplicates and limit count
        if (value.includes(trimmedTag)) {
            setInputValue('');
            return;
        }

        if (value.length >= maxTags) {
            setInputValue('');
            return;
        }

        onChange([...value, trimmedTag]);
        setInputValue('');
    };

    const removeTag = (tagToRemove: string) => {
        onChange(value.filter((tag) => tag !== tagToRemove));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
    };

    return (
        <div className="w-full">
            <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all bg-white min-h-[46px] items-center">
                {value.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100 animate-in fade-in zoom-in duration-200"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="p-0.5 hover:bg-blue-100 rounded-full transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}

                {value.length < maxTags && (
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => {
                            // Allow suggestion click to run before blur handling.
                            setTimeout(() => {
                                setShowSuggestions(false);
                                addTag(inputValue);
                            }, 120);
                        }}
                        placeholder={value.length === 0 ? placeholder : ''}
                        className="flex-1 bg-transparent border-none outline-none text-sm py-1 min-w-[120px] text-gray-900 placeholder:text-gray-400"
                    />
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && value.length < maxTags && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20 relative">
                    {suggestions.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                addTag(tag);
                                setShowSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}

            <p className="mt-1.5 text-[11px] text-gray-500 flex justify-between">
                <span>Press Enter or comma to add a tag</span>
                <span>{value.length}/{maxTags} tags</span>
            </p>
        </div>
    );
}
