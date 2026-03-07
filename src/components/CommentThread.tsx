'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import DOMPurify from 'isomorphic-dompurify';
import { Edit2, Trash2, MessageSquareReply, ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import { toast } from '@/lib/events';
import { CommentListItem } from '@/types/api';

interface CommentThreadProps {
    entityType: 'question' | 'answer';
    entityId: string;
    comments: CommentListItem[];
}

interface CommentComposerProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onCancel?: () => void;
    isPending: boolean;
    submitLabel: string;
    placeholder: string;
}

function CommentComposer({
    value,
    onChange,
    onSubmit,
    onCancel,
    isPending,
    submitLabel,
    placeholder,
}: CommentComposerProps) {
    return (
        <div className="space-y-2">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder={placeholder}
            />
            <div className="flex items-center justify-end gap-2">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                    </button>
                )}
                <button
                    onClick={onSubmit}
                    disabled={isPending || value.trim().length === 0}
                    className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Check className="h-3.5 w-3.5" />
                    {submitLabel}
                </button>
            </div>
        </div>
    );
}

export function CommentThread({ entityType, entityId, comments }: CommentThreadProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const { id: questionId } = useParams();
    const queryClient = useQueryClient();

    const [collapsedById, setCollapsedById] = useState<Record<string, boolean>>({});
    const [replyingToId, setReplyingToId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draftById, setDraftById] = useState<Record<string, string>>({});
    const [editBody, setEditBody] = useState('');
    const [rootDraft, setRootDraft] = useState('');

    const postEndpoint = entityType === 'question'
        ? `/api/v1/questions/${entityId}/comments`
        : `/api/v1/answers/${entityId}/comments`;

    const invalidateQuestion = () => {
        queryClient.invalidateQueries({ queryKey: ['question', questionId] });
    };

    const createMutation = useMutation({
        mutationFn: async ({ body, parentId }: { body: string; parentId?: string }) => {
            if (!session?.user?.id) {
                router.push(`/login?callbackUrl=/questions/${questionId}`);
                throw new Error('Authentication required');
            }

            const res = await fetch(postEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body, parentId: parentId ?? null }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Failed to add comment');
            }

            return res.json();
        },
        onSuccess: () => {
            setReplyingToId(null);
            setRootDraft('');
            setDraftById({});
            toast.success('Comment posted');
            invalidateQuestion();
        },
        onError: (error: Error) => {
            if (error.message !== 'Authentication required') {
                toast.error(error.message);
            }
        },
    });

    const editMutation = useMutation({
        mutationFn: async ({ commentId, body }: { commentId: string; body: string }) => {
            const res = await fetch(`/api/v1/comments/${commentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Failed to update comment');
            }

            return res.json();
        },
        onSuccess: () => {
            setEditingId(null);
            setEditBody('');
            toast.success('Comment updated');
            invalidateQuestion();
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const deleteMutation = useMutation({
        mutationFn: async (commentId: string) => {
            const res = await fetch(`/api/v1/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Failed to delete comment');
            }

            return res.json();
        },
        onSuccess: () => {
            toast.success('Comment deleted');
            invalidateQuestion();
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const toggleCollapse = (commentId: string) => {
        setCollapsedById((prev) => ({
            ...prev,
            [commentId]: !prev[commentId],
        }));
    };

    const startEdit = (comment: CommentListItem) => {
        setEditingId(comment.id);
        setEditBody(comment.body);
    };

    const startReply = (commentId: string) => {
        setReplyingToId(commentId);
        setDraftById((prev) => ({
            ...prev,
            [commentId]: prev[commentId] ?? '',
        }));
    };

    const renderNodes = (nodes: CommentListItem[], depth = 0) => (
        <div className="space-y-3">
            {nodes.map((comment) => {
                const isAuthor = session?.user?.id === comment.author.id;
                const hasReplies = comment.replies.length > 0;
                const isCollapsed = collapsedById[comment.id] ?? false;
                const replyDraft = draftById[comment.id] ?? '';
                const indent = Math.min(depth * 20, 80);
                const sanitizedBody = DOMPurify.sanitize(comment.body);

                return (
                    <div key={comment.id} className="rounded-xl border border-gray-100 bg-white" style={{ marginLeft: indent }}>
                        <div className="p-3">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="rounded-md bg-blue-50 px-2 py-0.5 font-bold text-blue-700">
                                        @{comment.author.username}
                                    </span>
                                    <span className="text-gray-400">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                    {new Date(comment.updated_at).getTime() > new Date(comment.created_at).getTime() && (
                                        <span className="text-gray-400">(edited)</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1">
                                    {hasReplies && (
                                        <button
                                            onClick={() => toggleCollapse(comment.id)}
                                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                        >
                                            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                            {comment.replies.length}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => startReply(comment.id)}
                                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                    >
                                        <MessageSquareReply className="h-3.5 w-3.5" />
                                        Reply
                                    </button>
                                    {isAuthor && (
                                        <>
                                            <button
                                                onClick={() => startEdit(comment)}
                                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Delete this comment?')) {
                                                        deleteMutation.mutate(comment.id);
                                                    }
                                                }}
                                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {editingId === comment.id ? (
                                <CommentComposer
                                    value={editBody}
                                    onChange={setEditBody}
                                    onSubmit={() => editMutation.mutate({ commentId: comment.id, body: editBody })}
                                    onCancel={() => {
                                        setEditingId(null);
                                        setEditBody('');
                                    }}
                                    isPending={editMutation.isPending}
                                    submitLabel="Save"
                                    placeholder="Update your comment..."
                                />
                            ) : (
                                <div
                                    className="prose prose-sm max-w-none text-gray-800"
                                    dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                                />
                            )}

                            {replyingToId === comment.id && (
                                <div className="mt-3 border-t border-gray-100 pt-3">
                                    <CommentComposer
                                        value={replyDraft}
                                        onChange={(value) => setDraftById((prev) => ({ ...prev, [comment.id]: value }))}
                                        onSubmit={() => createMutation.mutate({ body: replyDraft, parentId: comment.id })}
                                        onCancel={() => {
                                            setReplyingToId(null);
                                            setDraftById((prev) => ({ ...prev, [comment.id]: '' }));
                                        }}
                                        isPending={createMutation.isPending}
                                        submitLabel="Reply"
                                        placeholder="Reply with @username support..."
                                    />
                                </div>
                            )}
                        </div>

                        {hasReplies && !isCollapsed && (
                            <div className="border-t border-gray-100 bg-gray-50/50 p-3">
                                {renderNodes(comment.replies, depth + 1)}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wide text-gray-500">Comments</h3>
                <span className="text-xs font-semibold text-gray-400">Threaded replies enabled</span>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <CommentComposer
                    value={rootDraft}
                    onChange={setRootDraft}
                    onSubmit={() => createMutation.mutate({ body: rootDraft })}
                    isPending={createMutation.isPending}
                    submitLabel="Add Comment"
                    placeholder="Write a comment. Mention someone with @username"
                />
            </div>

            {comments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
                    No comments yet. Start the discussion.
                </div>
            ) : (
                renderNodes(comments)
            )}
        </section>
    );
}
