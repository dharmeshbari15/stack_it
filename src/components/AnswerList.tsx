'use client';

import { AnswerItem } from './AnswerItem';
import { AnswerListItem } from '@/types/api';

interface AnswerListProps {
    answers: AnswerListItem[];
    acceptedAnswerId: string | null;
    questionAuthorId: string;
}

export function AnswerList({ answers, acceptedAnswerId, questionAuthorId }: AnswerListProps) {
    if (answers.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <h3 className="text-lg font-medium text-gray-900">No answers yet</h3>
                <p className="text-gray-600 mt-2">Be the first to share your knowledge!</p>
            </div>
        );
    }

    const sortedAnswers = [...answers].sort((a, b) => {
        // 1. Accepted answer first
        if (a.id === acceptedAnswerId) return -1;
        if (b.id === acceptedAnswerId) return 1;

        // 2. Then by score (descending)
        if (b.score !== a.score) return b.score - a.score;

        // 3. Then by date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-black text-gray-900">
                    {answers.length} {answers.length === 1 ? 'Community Answer' : 'Community Answers'}
                </h2>
            </div>

            <div className="space-y-8">
                {sortedAnswers.map((answer) => (
                    <AnswerItem
                        key={answer.id}
                        answer={answer}
                        isAccepted={answer.id === acceptedAnswerId}
                        questionAuthorId={questionAuthorId}
                    />
                ))}
            </div>
        </div>
    );
}
