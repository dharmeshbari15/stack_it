'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Editor } from './Editor';

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

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<AskQuestionFormValues>({
        resolver: zodResolver(askQuestionSchema),
        defaultValues: {
            title: '',
            tags: '',
            description: '',
        },
    });

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
                <input
                    {...register('tags')}
                    type="text"
                    id="tags"
                    placeholder="e.g. nextjs, react, auth"
                    className={`w-full px-4 py-2.5 rounded-lg border ${errors.tags ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        } focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all`}
                />
                {errors.tags && <p className="mt-1 text-xs text-red-500">{errors.tags.message}</p>}
            </div>

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
