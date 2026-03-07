// components/SavedQuestionsPage.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SavedQuestionCard } from './SavedQuestionCard';
import { SavedQuestionsFilter } from './SavedQuestionsFilter';
import LoadingSpinner from './ui/LoadingSpinner';
import { useToast } from '@/hooks/useToast';

interface Bookmark {
    id: string;
    question_id: string;
    custom_tag: string | null;
    created_at: string;
    question: {
        id: string;
        title: string;
        description: string;
        score: number;
        created_at: string;
        author: {
            id: string;
            username: string;
        };
        tags: Array<{ id: string; name: string }>;
    };
}

export const SavedQuestionsPage: React.FC = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { showToast } = useToast();

    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [uniqueTags, setUniqueTags] = useState<string[]>([]);
    const [pagination, setPagination] = useState({
        total: 0,
        limit: 20,
        offset: 0,
        currentPage: 1,
    });

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    // Fetch bookmarks
    const fetchBookmarks = useCallback(async (tag?: string | null, offset = 0) => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                limit: '20',
                offset: offset.toString(),
                ...(tag ? { tag } : {}),
            });

            const response = await fetch(
                `/api/v1/bookmarks?${queryParams.toString()}`,
                {
                    method: 'GET',
                }
            );

            if (!response.ok) {
                showToast('Failed to fetch bookmarks', 'error');
                return;
            }

            const data = await response.json();
            const newBookmarks = data.data.bookmarks;

            setBookmarks(newBookmarks);
            setFilteredBookmarks(newBookmarks);
            setPagination({
                total: data.data.total,
                limit: data.data.limit,
                offset: data.data.offset,
                currentPage: Math.floor(offset / 20) + 1,
            });

            // Backend returns distinct tags across all bookmarks for stable filtering.
            setUniqueTags(Array.isArray(data.data.available_tags) ? data.data.available_tags : []);
        } catch (error) {
            showToast('Error fetching bookmarks', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    // Initial load
    useEffect(() => {
        if (status === 'authenticated') {
            fetchBookmarks();
        }
    }, [status, fetchBookmarks]);

    const handleTagSelect = (tag: string | null) => {
        setSelectedTag(tag);
        setPagination((prev) => ({ ...prev, offset: 0, currentPage: 1 }));
        fetchBookmarks(tag, 0);
    };

    const handleRemoveBookmark = (bookmarkId: string) => {
        setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
        setFilteredBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
        setPagination((prev) => ({
            ...prev,
            total: prev.total - 1,
        }));
    };

    const handleTagUpdate = (bookmarkId: string, newTag: string | null) => {
        setBookmarks((prev) =>
            prev.map((b) =>
                b.id === bookmarkId ? { ...b, custom_tag: newTag } : b
            )
        );
        setFilteredBookmarks((prev) =>
            prev.map((b) =>
                b.id === bookmarkId ? { ...b, custom_tag: newTag } : b
            )
        );

        // Update unique tags
        if (newTag && !uniqueTags.includes(newTag)) {
            setUniqueTags([...uniqueTags, newTag].sort());
        }
    };

    const handlePrevPage = () => {
        const newOffset = pagination.offset - pagination.limit;
        setPagination((prev) => ({
            ...prev,
            offset: newOffset,
            currentPage: prev.currentPage - 1,
        }));
        fetchBookmarks(selectedTag, newOffset);
    };

    const handleNextPage = () => {
        const newOffset = pagination.offset + pagination.limit;
        setPagination((prev) => ({
            ...prev,
            offset: newOffset,
            currentPage: prev.currentPage + 1,
        }));
        fetchBookmarks(selectedTag, newOffset);
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">
                    ★ Saved Questions
                </h1>
                <Link
                    href="/questions"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                    Browse All Questions →
                </Link>
            </div>

            {/* Filter */}
            {(bookmarks.length > 0 || selectedTag || uniqueTags.length > 0) && (
                <SavedQuestionsFilter
                    tags={uniqueTags}
                    totalBookmarks={pagination.total}
                    selectedTag={selectedTag}
                    onTagSelect={handleTagSelect}
                />
            )}

            {/* Bookmarks List */}
            {bookmarks.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600 text-lg mb-4">
                        📋 You haven't bookmarked any questions yet.
                    </p>
                    <Link
                        href="/questions"
                        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Explore Questions
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {filteredBookmarks.map((bookmark) => (
                            <SavedQuestionCard
                                key={bookmark.id}
                                id={bookmark.id}
                                question_id={bookmark.question_id}
                                title={bookmark.question.title}
                                description={bookmark.question.description}
                                score={bookmark.question.score}
                                author_username={bookmark.question.author.username}
                                author_id={bookmark.question.author.id}
                                tags={bookmark.question.tags}
                                custom_tag={bookmark.custom_tag}
                                created_at={bookmark.created_at}
                                onRemove={handleRemoveBookmark}
                                onTagUpdate={handleTagUpdate}
                            />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.total > pagination.limit && (
                        <div className="flex justify-center items-center gap-4 py-6">
                            <button
                                onClick={handlePrevPage}
                                disabled={pagination.currentPage === 1}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ← Previous
                            </button>

                            <span className="text-sm text-gray-600">
                                Page {pagination.currentPage} of{' '}
                                {Math.ceil(pagination.total / pagination.limit)}
                                {selectedTag && (
                                    <span className="ml-2 text-gray-500">
                                        ({pagination.total} in "{selectedTag}")
                                    </span>
                                )}
                            </span>

                            <button
                                onClick={handleNextPage}
                                disabled={
                                    pagination.currentPage ===
                                    Math.ceil(pagination.total / pagination.limit)
                                }
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
