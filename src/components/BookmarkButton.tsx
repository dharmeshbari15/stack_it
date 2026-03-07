// components/BookmarkButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface BookmarkButtonProps {
    questionId: string;
    onBookmarkChange?: (isBookmarked: boolean) => void;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
    questionId,
    onBookmarkChange,
}) => {
    const { data: session, status } = useSession();
    const { showToast } = useToast();
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // Check if already bookmarked on mount
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.id) {
            setShowLoginPrompt(false);
            checkBookmarkStatus();
        }

        if (status === 'unauthenticated') {
            setIsBookmarked(false);
        }
    }, [questionId, status, session?.user?.id]);

    const checkBookmarkStatus = async () => {
        try {
            const response = await fetch(
                `/api/v1/questions/${questionId}/bookmark`,
                {
                    method: 'GET',
                }
            );

            if (response.ok) {
                const data = await response.json();
                setIsBookmarked(data.data.is_bookmarked);
            }
        } catch (error) {
            console.error('Failed to check bookmark status:', error);
        }
    };

    const handleToggleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (status !== 'authenticated') {
            setShowLoginPrompt(true);
            return;
        }

        setIsLoading(true);

        try {
            const method = isBookmarked ? 'DELETE' : 'POST';
            const response = await fetch(
                `/api/v1/questions/${questionId}/bookmark`,
                {
                    method,
                }
            );

            if (!response.ok) {
                const error = await response.json();
                showToast(error.message || 'Failed to update bookmark', 'error');
                return;
            }

            const data = await response.json();
            const newBookmarkedState = data.data.is_bookmarked;
            setIsBookmarked(newBookmarkedState);

            showToast(
                newBookmarkedState
                    ? 'Question bookmarked!'
                    : 'Bookmark removed!',
                'success'
            );

            if (onBookmarkChange) {
                onBookmarkChange(newBookmarkedState);
            }
        } catch (error) {
            showToast('An error occurred. Please try again.', 'error');
            console.error('Bookmark toggle error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (showLoginPrompt) {
        return (
            <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">
                    Sign in to bookmark questions
                </p>
                <Link
                    href="/login"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    Sign in
                </Link>
            </div>
        );
    }

    return (
        <button
            onClick={handleToggleBookmark}
            disabled={isLoading}
            className={`flex items-center gap-2 px-3 py-2 rounded border transition ${
                isBookmarked
                    ? 'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark this question'}
        >
            <span className="text-lg">
                {isBookmarked ? '★' : '☆'}
            </span>
            <span className="text-sm font-medium">
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </span>
        </button>
    );
};
