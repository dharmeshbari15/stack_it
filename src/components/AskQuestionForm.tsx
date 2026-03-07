'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Editor } from './Editor';
import { SimilarQuestionsPanel } from './SimilarQuestionsPanel';
import { AITagSuggestions } from './AITagSuggestions';
import { AIQualityFeedback } from './AIQualityFeedback';

const askQuestionSchema = z.object({
    title: z.string()
        .min(10, 'Title must be at least 10 characters')
        .max(150, 'Title must be less than 150 characters'),
    tags: z.string()
        .min(1, 'At least one tag is required')
        .refine((val) => val.split(',').map(t => t.trim()).filter(Boolean).length > 0, 'At least one valid tag is required'),
    description: z.string()
        .min(30, 'Description must be at least 30 characters'),
});

type AskQuestionFormValues = z.infer<typeof askQuestionSchema>;

export function AskQuestionForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSimilarQuestions, setHasSimilarQuestions] = useState(false);
    const [popularTags, setPopularTags] = useState<string[]>([]);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<AskQuestionFormValues>({
        resolver: zodResolver(askQuestionSchema),
        defaultValues: {
            title: '',
            tags: '',
            description: '',
        },
    });

    // Watch form values for similarity checking
    const title = useWatch({ control, name: 'title' }) || '';
    const description = useWatch({ control, name: 'description' }) || '';
    const tagsValue = useWatch({ control, name: 'tags' }) || '';

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

    const { currentToken, existingTags } = useMemo(() => {
        const parts = tagsValue.split(',');
        const token = (parts[parts.length - 1] || '').trim().toLowerCase();
        const existing = new Set(
            parts
                .slice(0, -1)
                .map((p) => p.trim().toLowerCase())
                .filter(Boolean)
        );
        return { currentToken: token, existingTags: existing };
    }, [tagsValue]);

    const filteredTagSuggestions = useMemo(() => {
        if (!currentToken) return [];
        return popularTags
            .filter((tag) => tag.toLowerCase().includes(currentToken))
            .filter((tag) => !existingTags.has(tag.toLowerCase()))
            .slice(0, 8);
    }, [popularTags, currentToken, existingTags]);

    const applySuggestedTag = (tag: string) => {
        const parts = tagsValue.split(',');
        parts[parts.length - 1] = ` ${tag}`;
        const updated = parts
            .join(',')
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
            .join(', ');
        const nextValue = `${updated}, `;
        setValue('tags', nextValue, { shouldValidate: true, shouldDirty: true });
        setShowTagSuggestions(false);
    };

    const applyAITag = (tag: string) => {
        const existingTags = tagsValue
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);
        
        if (!existingTags.includes(tag)) {
            const newValue = existingTags.length > 0 
                ? `${existingTags.join(', ')}, ${tag}, `
                : `${tag}, `;
            setValue('tags', newValue, { shouldValidate: true, shouldDirty: true });
        }
    };

    const onSubmit = async (values: AskQuestionFormValues) => {
        setIsSubmitting(true);
        setError(null);

        try {
            // Parse tags from comma-separated string
            const tagsArray = values.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean);

            const response = await fetch('/api/v1/questions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: values.title,
                    description: values.description,
                    tags: tagsArray,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to post question');
            }

            // Success! Redirect to the new question's page or home
            router.push(`/questions/${data.data.id}`);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-black">
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-1">
                    Title
                </label>
                <p className="text-xs text-gray-500 mb-2">Be specific and imagine you're asking a question to another person.</p>
                <input
                    {...register('title')}
                    type="text"
                    id="title"
                    placeholder="e.g. How to implement custom authentication in Next.js 14?"
                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        } focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all`}
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            </div>

            <div>
                <label htmlFor="tags" className="block text-sm font-semibold text-gray-900 mb-1">
                    Tags
                </label>
                <p className="text-xs text-gray-500 mb-2">Add up to 5 tags to describe what your question is about. Separate them with commas.</p>
                <div className="relative">
                    <input
                        {...register('tags')}
                        type="text"
                        id="tags"
                        placeholder="e.g. nextjs, react, auth"
                        onFocus={() => setShowTagSuggestions(true)}
                        onBlur={() => {
                            // Delay so click on suggestion can register
                            setTimeout(() => setShowTagSuggestions(false), 120);
                        }}
                        className={`w-full px-4 py-2.5 rounded-lg border ${errors.tags ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                            } focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all`}
                    />

                    {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                            {filteredTagSuggestions.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        applySuggestedTag(tag);
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {errors.tags && <p className="mt-1 text-xs text-red-500">{errors.tags.message}</p>}
            </div>

            {/* AI Tag Suggestions */}
            {title.length >= 15 && description.length >= 50 && (
                <AITagSuggestions
                    title={title}
                    description={description}
                    currentTags={tagsValue}
                    onSelectTag={applyAITag}
                />
            )}

            <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-1">
                    Everything else
                </label>
                <p className="text-xs text-gray-500 mb-2">Include all the information someone would need to answer your question. (Rich text supported)</p>

                <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                        <Editor
                            content={field.value}
                            onChange={field.onChange}
                            placeholder="Steps to reproduce, expected behavior, what you've tried..."
                        />
                    )}
                />

                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
            </div>

            {/* AI Quality Feedback */}
            {title.length >= 10 && description.length >= 30 && (
                <AIQualityFeedback
                    title={title}
                    description={description}
                />
            )}

            {/* Similar Questions Panel */}
            {title.length >= 10 && description.length >= 30 && (
                <SimilarQuestionsPanel
                    title={title}
                    description={description}
                    onCheck={setHasSimilarQuestions}
                />
            )}

            <div className="flex justify-end pt-4 gap-3">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2.5 rounded-full bg-white text-gray-700 font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition active:scale-95"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-2.5 rounded-full bg-blue-600 text-white font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isSubmitting ? 'Posting...' : 'Post Question'}
                </button>
            </div>
        </form>
    );
}
