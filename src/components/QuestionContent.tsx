'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import { useSession } from 'next-auth/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, X, Check } from 'lucide-react';
import { toast } from '@/lib/events';
import { QuestionDetail } from '@/types/api';
import { Editor } from './Editor';
import { TagInput } from './TagInput';

interface QuestionContentProps {
    question: Omit<QuestionDetail, 'answers'>;
}

export function QuestionContent({ question }: QuestionContentProps) {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(question.title);
    const [description, setDescription] = useState(question.description);
    const [tags, setTags] = useState(question.tags);

    const isAuthor = session?.user?.id === question.author.id;
    const sanitizedContent = DOMPurify.sanitize(question.description);

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

    return (
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

                        <div className="prose prose-blue max-w-none text-gray-800"
                            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                        />

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
                    </>
                )}
            </div>

            <style jsx global>{`
        .prose pre {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 1.25rem;
          border-radius: 0.75rem;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          margin: 1.5rem 0;
          overflow-x: auto;
        }
        .prose blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1.5rem;
          color: #4b5563;
          font-style: italic;
          margin: 1.5rem 0;
        }
        .prose code:not(pre code) {
          background: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          color: #1f2937;
        }
      `}</style>
        </div>
    );
}
