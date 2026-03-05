'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QuestionCard } from './QuestionCard';

interface QuestionsResponse {
    success: boolean;
    data: {
        questions: any[];
        total_pages: number;
        current_page: number;
        total_questions: number;
    };
}

export function QuestionList() {
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data, isLoading, isError, error } = useQuery<QuestionsResponse>({
        queryKey: ['questions', page],
        queryFn: async () => {
            const res = await fetch(`/api/v1/questions?page=${page}&limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch questions');
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-100 rounded-xl border border-gray-200" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-xl bg-red-50 p-6 text-center">
                <p className="text-red-700 font-medium">Error loading questions</p>
                <p className="text-red-600 text-sm">{(error as Error).message}</p>
            </div>
        );
    }

    const { questions, total_pages } = data?.data || { questions: [], total_pages: 0 };

    if (questions.length === 0) {
        return (
            <div className="rounded-xl bg-gray-50 border border-dashed border-gray-300 p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900">No questions yet</h3>
                <p className="text-gray-600 mt-2">Be the first to ask a question on StackIt!</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                {questions.map((question) => (
                    <QuestionCard key={question.id} question={question} />
                ))}
            </div>

            {total_pages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(total_pages, p + 1))}
                            disabled={page === total_pages}
                            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{total_pages}</span>
                            </p>
                        </div>
                        <div>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    <span className="sr-only">Previous</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(total_pages, p + 1))}
                                    disabled={page === total_pages}
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                >
                                    <span className="sr-only">Next</span>
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
