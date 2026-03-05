'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Editor } from './Editor';

const answerSchema = z.object({
    body: z.string().min(30, 'Answer must be at least 30 characters long'),
});

type AnswerFormValues = z.infer<typeof answerSchema>;

interface PostAnswerFormProps {
    questionId: string;
}

export function PostAnswerForm({ questionId }: PostAnswerFormProps) {
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const {
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<AnswerFormValues>({
        resolver: zodResolver(answerSchema),
        defaultValues: {
            body: '',
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: AnswerFormValues) => {
            const response = await fetch(`/api/v1/questions/${questionId}/answers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to post answer');
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['question', questionId] });
            reset();
            setError(null);
        },
        onError: (err) => {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        },
    });

    const onSubmit = (values: AnswerFormValues) => {
        mutation.mutate(values);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Answer</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="min-h-[300px]">
                    <Controller
                        name="body"
                        control={control}
                        render={({ field }) => (
                            <Editor
                                content={field.value}
                                onChange={field.onChange}
                                placeholder="Write your answer here..."
                            />
                        )}
                    />
                </div>
                {errors.body && (
                    <p className="mt-1 text-xs text-red-500">{errors.body.message}</p>
                )}

                <div className="flex justify-start">
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="px-8 py-3 rounded-full bg-blue-600 text-white font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {mutation.isPending ? 'Posting...' : 'Post Your Answer'}
                    </button>
                </div>
            </form>
        </div>
    );
}
