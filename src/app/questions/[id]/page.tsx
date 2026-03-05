'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { QuestionContent } from '@/components/QuestionContent';
import { AnswerList } from '@/components/AnswerList';
import Link from 'next/link';

interface QuestionResponse {
    success: boolean;
    data: any;
}

export default function QuestionDetailPage() {
    const { id } = useParams();
    const router = useRouter();

    const { data, isLoading, isError, error } = useQuery<QuestionResponse>({
        queryKey: ['question', id],
        queryFn: async () => {
            const res = await fetch(`/api/v1/questions/${id}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error('404');
                throw new Error('Failed to fetch question');
            }
            return res.json();
        },
        retry: (failureCount, error: any) => {
            if (error.message === '404') return false;
            return failureCount < 3;
        }
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
                    <div className="h-10 bg-gray-200 rounded w-1/4 mb-4" />
                    <div className="h-96 bg-gray-200 rounded-2xl" />
                    <div className="h-48 bg-gray-200 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (isError) {
        if (error.message === '404') {
            return (
                <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
                    <h1 className="text-4xl font-black text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600 mb-8 text-center max-w-md">
                        The question you are looking for might have been deleted by an administrator or never existed.
                    </p>
                    <Link href="/" className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition">
                        Back to Feed
                    </Link>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-red-600 font-bold text-xl mb-4">Something went wrong</p>
                    <button
                        onClick={() => router.refresh()}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        Try refreshing the page
                    </button>
                </div>
            </div>
        );
    }

    const question = data?.data;

    return (
        <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header / Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href="/" className="hover:text-blue-600 transition-colors">Questions</Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    <span className="truncate max-w-[200px]">{question.title}</span>
                </div>

                <QuestionContent question={question} />

                <div className="border-t border-gray-200 pt-12">
                    <AnswerList answers={question.answers} acceptedAnswerId={question.accepted_answer_id} />
                </div>

                {/* Answer Form Placeholder (Future Task) */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Know the answer?</h3>
                    <p className="text-gray-600 mb-6">Your expertise could help this developer move forward.</p>
                    <button className="px-8 py-3 rounded-full bg-blue-600 text-white font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
                        Post Your Answer
                    </button>
                </div>
            </div>
        </div>
    );
}
