'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Link2, X } from 'lucide-react';

interface MarkDuplicateProps {
    questionId: string;
    isAdmin: boolean;
    isDuplicate?: boolean;
    duplicateOfId?: string | null;
}

export function MarkDuplicateButton({ questionId, isAdmin, isDuplicate, duplicateOfId }: MarkDuplicateProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [canonicalId, setCanonicalId] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isAdmin) {
        return null;
    }

    const handleMarkDuplicate = async () => {
        if (!canonicalId.trim()) {
            setError('Please enter the canonical question ID');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/v1/questions/${questionId}/mark-duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    canonicalQuestionId: canonicalId.trim(),
                    notes: notes.trim() || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to mark as duplicate');
            }

            // Success - refresh the page
            router.refresh();
            setIsOpen(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to mark as duplicate');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnmark = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/v1/questions/${questionId}/unmark-duplicate`, {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to unmark duplicate');
            }

            // Success - refresh the page
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to unmark duplicate');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isDuplicate) {
        return (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                        <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-orange-900 mb-1">
                                This question has been marked as a duplicate
                            </p>
                            {duplicateOfId && (
                                <a
                                    href={`/questions/${duplicateOfId}`}
                                    className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                                >
                                    View canonical question
                                    <Link2 className="h-3 w-3" />
                                </a>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleUnmark}
                        disabled={isSubmitting}
                        className="px-3 py-1 text-xs font-medium text-orange-700 bg-white border border-orange-300 rounded-lg hover:bg-orange-50 transition disabled:opacity-50"
                    >
                        {isSubmitting ? 'Unmarking...' : 'Unmark'}
                    </button>
                </div>
                {error && (
                    <p className="mt-2 text-xs text-red-600">{error}</p>
                )}
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
                <Link2 className="h-4 w-4" />
                Mark as Duplicate
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Mark as Duplicate</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="canonicalId" className="block text-sm font-medium text-gray-700 mb-1">
                                    Canonical Question ID *
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Enter the ID of the original question that this is a duplicate of.
                                </p>
                                <input
                                    id="canonicalId"
                                    type="text"
                                    value={canonicalId}
                                    onChange={(e) => setCanonicalId(e.target.value)}
                                    placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any notes about why this is a duplicate..."
                                    rows={3}
                                    maxLength={500}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {notes.length}/500 characters
                                </p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleMarkDuplicate}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Marking...' : 'Mark as Duplicate'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
