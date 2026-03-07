'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, X, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from '@/lib/events';
import { QuestionDetail } from '@/types/api';
import { Editor } from './Editor';
import { TagInput } from './TagInput';
import { CommentThread } from './CommentThread';
import { BookmarkButton } from './BookmarkButton';
import { FollowButton } from './FollowButton';
import { MarkDuplicateButton } from './MarkDuplicateButton';
import { RichContentRenderer } from './RichContentRenderer';

interface QuestionContentProps {
    question: Omit<QuestionDetail, 'answers'>;
}

export function QuestionContent({ question }: QuestionContentProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(question.title);
    const [description, setDescription] = useState(question.description);
    const [tags, setTags] = useState(question.tags);

    const isAuthor = session?.user?.id === question.author.id;
    const isAdmin = session?.user?.role === 'ADMIN';
    const isDuplicate = !!question.duplicate_of_id;

    const updateMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/v1/questions/${question.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, tags }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const msg = errorData.error?.message || 'Failed to update question';
                toast.error(msg);
                throw new Error(msg);
            }

            toast.success('Question updated successfully');
            return response.json();
        },
        onSuccess: () => {
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['question', question.id] });
            queryClient.invalidateQueries({ queryKey: ['questions'] });
        },
    });

    const voteMutation = useMutation({
        mutationFn: async (voteType: 'upvote' | 'downvote') => {
            if (!session) {
                router.push(`/login?callbackUrl=/questions/${question.id}`);
                throw new Error('Auth required');
            }

            const response = await fetch(`/api/v1/questions/${question.id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voteType }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const msg = errorData.error?.message || 'Voting failed';
                toast.error(msg);
                throw new Error(msg);
            }

            return response.json();
        },
        onMutate: async (newVoteType) => {
            await queryClient.cancelQueries({ queryKey: ['question', question.id] });
            const previousData = queryClient.getQueryData<any>(['question', question.id]);

            if (!previousData?.data) {
                return { previousData };
            }

            const currentVote = previousData.data.userVote ?? 0;
            const nextVote = newVoteType === 'upvote' ? 1 : -1;
            let scoreDelta = 0;

            if (currentVote === nextVote) {
                scoreDelta = -nextVote;
            } else if (currentVote === 0) {
                scoreDelta = nextVote;
            } else {
                scoreDelta = nextVote * 2;
            }

            queryClient.setQueryData(['question', question.id], {
                ...previousData,
                data: {
                    ...previousData.data,
                    score: (previousData.data.score ?? 0) + scoreDelta,
                    userVote: currentVote === nextVote ? 0 : nextVote,
                },
            });

            return { previousData };
        },
        onError: (error: any, _, context: any) => {
            if (error.message !== 'Auth required' && context?.previousData) {
                queryClient.setQueryData(['question', question.id], context.previousData);
            }
        },
        onSuccess: () => {
            toast.success('Vote recorded');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['question', question.id] });
            queryClient.invalidateQueries({ queryKey: ['questions'] });
        },
    });

    const handleVote = (voteType: 'upvote' | 'downvote') => {
        voteMutation.mutate(voteType);
    };

    return (
        <div className="space-y-6">
            {/* Duplicate Banner */}
            {isDuplicate && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-orange-900 mb-2">
                                This question has been marked as a duplicate
                            </h3>
                            <p className="text-sm text-orange-800 mb-3">
                                This question has already been answered. Please refer to the canonical question for the solution.
                            </p>
                            <Link
                                href={`/questions/${question.duplicate_of_id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-orange-300 text-orange-800 rounded-lg hover:bg-orange-50 transition text-sm font-medium"
                            >
                                View Original Question
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <div className="flex flex-col gap-6">
                {isEditing ? (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold text-lg"
                                placeholder="Enter a descriptive title..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Description</label>
                            <Editor content={description} onChange={setDescription} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Tags</label>
                            <TagInput value={tags} onChange={setTags} />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setTitle(question.title);
                                    setDescription(question.description);
                                    setTags(question.tags);
                                }}
                                className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </button>
                            <button
                                onClick={() => updateMutation.mutate()}
                                disabled={updateMutation.isPending || title.length < 10 || description.length < 30}
                                className="px-8 py-2.5 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" />
                                Save Changes
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="flex flex-col items-center gap-2">
                                    <button
                                        onClick={() => handleVote('upvote')}
                                        disabled={voteMutation.isPending}
                                        title="Upvote"
                                        className={`p-1.5 rounded-lg transition-colors ${question.userVote === 1
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'hover:bg-gray-100 text-gray-400 hover:text-blue-600'
                                            }`}
                                    >
                                        <svg className="w-6 h-6" fill={question.userVote === 1 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                        </svg>
                                    </button>

                                    <span className={`text-xl font-black tabular-nums ${question.userVote === 1 ? 'text-blue-600' :
                                        question.userVote === -1 ? 'text-red-600' : 'text-gray-900'
                                        }`}>
                                        {question.score ?? 0}
                                    </span>

                                    <button
                                        onClick={() => handleVote('downvote')}
                                        disabled={voteMutation.isPending}
                                        title="Downvote"
                                        className={`p-1.5 rounded-lg transition-colors ${question.userVote === -1
                                            ? 'bg-red-100 text-red-600'
                                            : 'hover:bg-gray-100 text-gray-400 hover:text-red-600'
                                            }`}
                                    >
                                        <svg className="w-6 h-6" fill={question.userVote === -1 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="flex-1">
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
                                    {question.title}
                                </h1>

                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-2 text-gray-900 font-medium">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            {question.author.username[0].toUpperCase()}
                                        </div>
                                        {question.author.username}
                                    </div>
                                    <span>•</span>
                                    <time dateTime={typeof question.created_at === 'string' ? question.created_at : question.created_at.toISOString()}>
                                        Asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                                    </time>
                                </div>
                            </div>

                            </div>

                            <div className="flex items-center gap-2">
                                <BookmarkButton questionId={question.id} />
                                <FollowButton 
                                    entityType="question" 
                                    entityId={question.id}
                                    className="text-xs"
                                />
                                {isAdmin && (
                                    <MarkDuplicateButton
                                        questionId={question.id}
                                        isAdmin={isAdmin}
                                        isDuplicate={isDuplicate}
                                        duplicateOfId={question.duplicate_of_id}
                                    />
                                )}
                                {isAuthor && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        title="Edit Question"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        <span>Edit</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <RichContentRenderer html={question.description} />

                        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                            {question.tags.map((tag) => (
                                <Link
                                    key={tag}
                                    href={`/questions?tag=${tag}`}
                                    className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 hover:bg-blue-100 transition-colors"
                                >
                                    {tag}
                                </Link>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <CommentThread
                                entityType="question"
                                entityId={question.id}
                                comments={question.comments}
                            />
                        </div>
                    </>
                )}
            </div>
            </div>
        </div>
    );
}
