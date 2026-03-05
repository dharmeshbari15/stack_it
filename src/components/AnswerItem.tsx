import { formatDistanceToNow } from 'date-fns';
import DOMPurify from 'isomorphic-dompurify';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';

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
    userVote: number;
}

interface AnswerItemProps {
    answer: Answer;
    isAccepted?: boolean;
    questionAuthorId: string;
}

export function AnswerItem({ answer, isAccepted, questionAuthorId }: AnswerItemProps) {
    const { data: session } = useSession();
    const { id: questionId } = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const sanitizedBody = DOMPurify.sanitize(answer.body);

    const isQuestionAuthor = session?.user?.id === questionAuthorId;

    const acceptMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/v1/questions/${questionId}/accept-answer`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answerId: answer.id }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Failed to accept answer');
            }

            return response.json();
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['question', questionId] });
            const previousData = queryClient.getQueryData<any>(['question', questionId]);

            if (previousData) {
                queryClient.setQueryData(['question', questionId], {
                    ...previousData,
                    data: {
                        ...previousData.data,
                        accepted_answer_id: answer.id
                    }
                });
            }

            return { previousData };
        },
        onError: (err: any, _, context: any) => {
            if (context?.previousData) {
                queryClient.setQueryData(['question', questionId], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['question', questionId] });
        },
    });

    const voteMutation = useMutation({
        mutationFn: async (value: 1 | -1) => {
            if (!session) {
                router.push(`/login?callbackUrl=/questions/${questionId}`);
                throw new Error('Auth required');
            }

            const response = await fetch(`/api/v1/answers/${answer.id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Voting failed');
            }

            return response.json();
        },
        onMutate: async (newValue) => {
            await queryClient.cancelQueries({ queryKey: ['question', questionId] });
            const previousData = queryClient.getQueryData<any>(['question', questionId]);

            if (previousData) {
                const currentVote = answer.userVote;
                let scoreDelta = 0;

                if (currentVote === newValue) {
                    scoreDelta = -newValue;
                } else if (currentVote === 0) {
                    scoreDelta = newValue;
                } else {
                    scoreDelta = newValue * 2;
                }

                queryClient.setQueryData(['question', questionId], {
                    ...previousData,
                    data: {
                        ...previousData.data,
                        answers: previousData.data.answers.map((a: any) =>
                            a.id === answer.id
                                ? { ...a, score: a.score + scoreDelta, userVote: currentVote === newValue ? 0 : newValue }
                                : a
                        )
                    }
                });
            }

            return { previousData };
        },
        onError: (err: any, newValue, context: any) => {
            if (err.message !== 'Auth required' && context?.previousData) {
                queryClient.setQueryData(['question', questionId], context.previousData);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['question', questionId] });
        },
    });

    const handleVote = (value: 1 | -1) => {
        voteMutation.mutate(value);
    };

    return (
        <div id={`answer-${answer.id}`} className={`p-6 rounded-2xl border transition-all duration-300 ${isAccepted ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <div className="flex gap-4 sm:gap-6">
                {/* Voting Column */}
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={() => handleVote(1)}
                        disabled={voteMutation.isPending}
                        title="Upvote"
                        className={`p-1.5 rounded-lg transition-colors ${answer.userVote === 1
                            ? 'bg-blue-100 text-blue-600'
                            : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'
                            }`}
                    >
                        <svg className="w-6 h-6" fill={answer.userVote === 1 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                    </button>

                    <span className={`text-xl font-black tabular-nums ${answer.userVote === 1 ? 'text-blue-600' :
                        answer.userVote === -1 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                        {answer.score}
                    </span>

                    <button
                        onClick={() => handleVote(-1)}
                        disabled={voteMutation.isPending}
                        title="Downvote"
                        className={`p-1.5 rounded-lg transition-colors ${answer.userVote === -1
                            ? 'bg-red-100 text-red-600'
                            : 'hover:bg-gray-100 text-gray-400 hover:text-red-600'
                            }`}
                    >
                        <svg className="w-6 h-6" fill={answer.userVote === -1 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isAccepted ? (
                        <div className="mt-4 flex flex-col items-center text-green-600" title="Solution recognized by author">
                            <span className="text-[10px] font-black uppercase tracking-widest mb-1.5 animation-pulse">Solution</span>
                            <div className="bg-green-100 p-2 rounded-xl border border-green-200 shadow-sm">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    ) : isQuestionAuthor && (
                        <button
                            onClick={() => acceptMutation.mutate()}
                            disabled={acceptMutation.isPending}
                            title="Mark as solution"
                            className="mt-4 p-2 text-gray-300 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all group"
                        >
                            <svg className="w-8 h-8 opacity-40 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="flex-1 flex flex-col gap-6">
                    <div
                        className="prose prose-sm sm:prose-base max-w-none text-gray-800 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                    />

                    <div className="flex flex-wrap items-center justify-end gap-6 pt-4 border-t border-gray-100/50">
                        <div className="text-xs font-medium text-gray-400">
                            answered {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
                        </div>

                        <div className="flex items-center gap-3 bg-white border border-gray-100 px-4 py-2 rounded-2xl shadow-sm">
                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-inner">
                                {answer.author.username[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 font-medium">Contributor</span>
                                <span className="text-sm font-bold text-gray-900">@{answer.author.username}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
