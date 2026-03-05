'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Author {
    id: string;
    username: string;
}

interface Question {
    id: string;
    title: string;
    description: string;
    author: Author;
    tags: string[];
    answers_count: number;
    accepted_answer_id: string | null;
    created_at: string;
}

interface QuestionCardProps {
    question: Question;
}

export function QuestionCard({ question }: QuestionCardProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start gap-4">
                    <Link
                        href={`/questions/${question.id}`}
                        className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
                    >
                        {question.title}
                    </Link>
                    {question.accepted_answer_id && (
                        <span className="flex-shrink-0 inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                            <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Solved
                        </span>
                    )}
                </div>

                <p className="text-gray-600 line-clamp-3 text-sm">
                    {question.description.replace(/<[^>]*>/g, '')}
                </p>

                <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag) => (
                        <Link
                            key={tag}
                            href={`/questions?tag=${tag}`}
                            className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 hover:bg-blue-100"
                        >
                            {tag}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <span>{question.answers_count} {question.answers_count === 1 ? 'answer' : 'answers'}</span>
                        </div>
                        <span>Asked by <span className="font-medium text-gray-900">{question.author.username}</span></span>
                    </div>
                    <time dateTime={question.created_at}>
                        {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                    </time>
                </div>
            </div>
        </div>
    );
}
