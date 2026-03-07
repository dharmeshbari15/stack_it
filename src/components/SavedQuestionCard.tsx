// components/SavedQuestionCard.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/useToast';

interface SavedQuestionCardProps {
    id: string;
    question_id: string;
    title: string;
    description: string;
    score: number;
    author_username: string;
    author_id: string;
    tags: Array<{ id: string; name: string }>;
    custom_tag?: string | null;
    created_at: string;
    onRemove?: (bookmarkId: string) => void;
    onTagUpdate?: (bookmarkId: string, tag: string | null) => void;
}

export const SavedQuestionCard: React.FC<SavedQuestionCardProps> = ({
    id,
    question_id,
    title,
    description,
    score,
    author_username,
    author_id,
    tags,
    custom_tag,
    created_at,
    onRemove,
    onTagUpdate,
}) => {
    const { showToast } = useToast();
    const [isEditingTag, setIsEditingTag] = useState(false);
    const [editingTag, setEditingTag] = useState(custom_tag || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleRemoveBookmark = async () => {
        if (!confirm('Remove this bookmark?')) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/v1/bookmarks/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                showToast('Failed to remove bookmark', 'error');
                return;
            }

            showToast('Bookmark removed', 'success');
            if (onRemove) {
                onRemove(id);
            }
        } catch (error) {
            showToast('Error removing bookmark', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTag = async () => {
        setIsLoading(true);
        try {
            const normalizedTag = editingTag.trim();
            console.log('Saving tag for bookmark:', id, 'with tag:', editingTag);
            
            const response = await fetch(`/api/v1/bookmarks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ custom_tag: normalizedTag || null }),
            });

            console.log('Response status:', response.status, 'OK:', response.ok);

            if (!response.ok) {
                try {
                    const errorData = await response.json();
                    console.error('API Error:', errorData);
                    const errorMsg = errorData.error?.message || errorData.message || 'Failed to update tag';
                    showToast(errorMsg, 'error');
                } catch (parseErr) {
                    console.error('Failed to parse error response:', parseErr);
                    const text = await response.text();
                    console.error('Response text:', text);
                    showToast(`Failed to update tag (${response.status})`, 'error');
                }
                return;
            }

            console.log('Tag update successful');
            const data = await response.json();
            console.log('Updated bookmark:', data);
            
            showToast('Tag updated', 'success');
            setIsEditingTag(false);
            setEditingTag(normalizedTag);
            if (onTagUpdate) {
                onTagUpdate(id, normalizedTag || null);
            }
        } catch (error) {
            console.error('Tag update error:', error);
            showToast('Error updating tag: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const truncateDescription = (text: string, maxLength: number = 150) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition hover:border-gray-300">
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                    {/* Title */}
                    <Link
                        href={`/questions/${question_id}`}
                        className="text-lg font-semibold text-blue-600 hover:text-blue-700 hover:underline block mb-2"
                    >
                        {title}
                    </Link>

                    {/* Description Preview */}
                    <p className="text-gray-600 text-sm mb-3">
                        {truncateDescription(description)}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {tags.map((tag) => (
                            <span
                                key={tag.id}
                                className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                            >
                                {tag.name}
                            </span>
                        ))}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>
                            by{' '}
                            <Link
                                href={`/users/${author_id}`}
                                className="text-blue-600 hover:underline"
                            >
                                {author_username}
                            </Link>
                        </span>
                        <span>Score: {score}</span>
                        <span>{new Date(created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Custom Tag Section */}
                    <div className="bg-gray-50 p-3 rounded mb-3">
                        {isEditingTag ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={editingTag}
                                    onChange={(e) => setEditingTag(e.target.value)}
                                    placeholder="Add a personal tag..."
                                    maxLength={100}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                                <button
                                    onClick={handleSaveTag}
                                    disabled={isLoading}
                                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditingTag(false);
                                        setEditingTag(custom_tag || '');
                                    }}
                                    disabled={isLoading}
                                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => setIsEditingTag(true)}
                                className="cursor-pointer text-sm"
                            >
                                {custom_tag ? (
                                    <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                        📌 {custom_tag}
                                    </span>
                                ) : (
                                    <span className="text-gray-500 italic">
                                        Click to add a personal tag...
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Remove Button */}
                <button
                    onClick={handleRemoveBookmark}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition disabled:opacity-50"
                    title="Remove bookmark"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};
