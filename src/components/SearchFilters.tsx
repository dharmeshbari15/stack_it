'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

type SortOption = 'newest' | 'votes' | 'unanswered' | 'active';

interface SearchFiltersProps {
    showSearch?: boolean;
}

export function SearchFilters({ showSearch = false }: SearchFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Derive state directly from URL params
    const urlSort = searchParams.get('sort') as SortOption;
    const sort = urlSort && ['newest', 'votes', 'unanswered', 'active'].includes(urlSort) ? urlSort : 'newest';
    const urlSearch = searchParams.get('search') || '';
    
    const [searchQuery, setSearchQuery] = useState(urlSearch);

    const handleSortChange = (newSort: SortOption) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', newSort);
        params.delete('page'); // Reset to page 1
        router.push(`/questions?${params.toString()}`);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery.trim()) {
            params.set('search', searchQuery.trim());
        } else {
            params.delete('search');
        }
        params.delete('page'); // Reset to page 1
        router.push(`/questions?${params.toString()}`);
    };

    const clearFilters = () => {
        setSearchQuery('');
        router.push('/questions');
    };

    const hasFilters = searchParams.get('search') || searchParams.get('tag') || sort !== 'newest';

    return (
        <div className="space-y-4">
            {/* Search Bar (Mobile/Desktop) */}
            {showSearch && (
                <form onSubmit={handleSearch} className="relative">
                    <label htmlFor="questions-search" className="sr-only">
                        Search questions
                    </label>
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </span>
                    <input
                        id="questions-search"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search questions by title, description, or tags..."
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                </form>
            )}

            {/* Sort Options */}
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <div className="flex flex-wrap gap-2">
                    <SortButton
                        active={sort === 'newest'}
                        onClick={() => handleSortChange('newest')}
                        label="Newest"
                    />
                    <SortButton
                        active={sort === 'votes'}
                        onClick={() => handleSortChange('votes')}
                        label="Most Votes"
                    />
                    <SortButton
                        active={sort === 'unanswered'}
                        onClick={() => handleSortChange('unanswered')}
                        label="Unanswered"
                    />
                    <SortButton
                        active={sort === 'active'}
                        onClick={() => handleSortChange('active')}
                        label="Active"
                    />
                </div>
                {hasFilters && (
                    <button
                        onClick={clearFilters}
                        className="ml-auto text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                        Clear filters
                    </button>
                )}
            </div>
        </div>
    );
}

interface SortButtonProps {
    active: boolean;
    onClick: () => void;
    label: string;
}

function SortButton({ active, onClick, label }: SortButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
            {label}
        </button>
    );
}
