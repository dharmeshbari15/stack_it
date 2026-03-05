'use client';

import { AnswerItem } from './AnswerItem';

interface Answer {
    id: string;
    body: string;
    score: number;
    created_at: string;
    author: {
        id: string;
        username: string;
    };
}

interface AnswerListProps {
    answers: Answer[];
    acceptedAnswerId: string | null;
}

export function AnswerList({ answers, acceptedAnswerId }: AnswerListProps) {
    if (answers.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                <h3 className="text-lg font-medium text-gray-900">No answers yet</h3>
                <p className="text-gray-600 mt-2">Be the first to share your knowledge!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                    {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
                </h2>
            </div>

            <div className="space-y-6">
                {answers.map((answer) => (
                    <AnswerItem
                        key={answer.id}
                        answer={answer}
                        isAccepted={answer.id === acceptedAnswerId}
                    />
                ))}
            </div>
        </div>
    );
}
