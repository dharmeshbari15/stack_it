'use client';

import { formatDistanceToNow } from 'date-fns';
import DOMPurify from 'isomorphic-dompurify';

interface Author {
    id: string;
    username: string;
}

interface Answer {
    id: string;
    body: string;
    score: number;
    created_at: string;
    author: Author;
}

interface AnswerItemProps {
    answer: Answer;
    isAccepted?: boolean;
}

export function AnswerItem({ answer, isAccepted }: AnswerItemProps) {
    const sanitizedBody = DOMPurify.sanitize(answer.body);

    return (
        <div className={`p-6 rounded-2xl border ${isAccepted ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'}`}>
            <div className="flex gap-4">
                {/* Voting Placeholder (Functional in future tasks) */}
                <div className="flex flex-col items-center gap-2">
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <span className="text-lg font-bold text-gray-700">{answer.score}</span>
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {isAccepted && (
                        <div className="mt-2 text-green-600" title="Accepted Answer">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col gap-4">
                    <div
                        className="prose prose-sm sm:prose-base max-w-none text-gray-800"
                        dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                    />

                    <div className="flex flex-wrap items-center justify-end gap-4 mt-2">
                        <div className="text-xs text-gray-500">
                            Answered {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-gray-100 px-3 py-1.5 rounded-full shadow-sm text-sm">
                            <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                {answer.author.username[0].toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900">{answer.author.username}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
