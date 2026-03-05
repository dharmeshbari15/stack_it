'use client';

// app/tags/page.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Hash, Search } from 'lucide-react';

interface TagData {
    id: string;
    name: string;
    questionCount: number;
}

export default function TagsPage() {
    const [search, setSearch] = React.useState('');

    const { data: tags, isLoading } = useQuery({
        queryKey: ['tags'],
        queryFn: async () => {
            const res = await fetch('/api/v1/tags');
            const result = await res.json();
            return result.data.tags as TagData[];
        }
    });

    const filteredTags = tags?.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

    return (
        <main className="mx-auto max-w-7xl px-4 py-12">
            <header className="mb-12 text-center max-w-2xl mx-auto">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
                    Explore Tags
                </h1>
                <p className="text-lg text-gray-500 font-medium mb-8">
                    Discover specialized topics and find questions within your area of expertise.
                </p>

                <div className="relative group max-w-md mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="search"
                        placeholder="Filter tags by name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-2xl border border-gray-200 bg-white py-4 pl-12 pr-4 text-sm outline-none ring-offset-2 transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                </div>
            </header>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-32 bg-gray-100 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredTags.map((tag) => (
                        <Link
                            key={tag.id}
                            href={`/questions?tag=${tag.name}`}
                            className="group relative bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Hash className="h-5 w-5" />
                                </div>
                                <span className="text-2xl font-black text-gray-100 group-hover:text-blue-50 transition-colors">
                                    #{tag.questionCount}
                                </span>
                            </div>
                            <h2 className="text-xl font-black text-gray-900 mb-1 capitalize">
                                {tag.name}
                            </h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {tag.questionCount} {tag.questionCount === 1 ? 'Question' : 'Questions'}
                            </p>

                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
