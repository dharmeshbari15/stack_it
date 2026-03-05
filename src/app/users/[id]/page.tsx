'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, MessageSquare, HelpCircle, User as UserIcon, Trophy } from 'lucide-react';
import Link from 'next/link';

interface UserData {
    id: string;
    username: string;
    created_at: string;
    _count: {
        questions: number;
        answers: number;
    };
}

interface Post {
    id: string;
    type: 'QUESTION' | 'ANSWER';
    title: string;
    content: string;
    created_at: string;
    metadata: {
        answerCount?: number;
        score?: number;
        questionId?: string;
    };
}

const [activeTab, setActiveTab] = React.useState<'all' | 'questions' | 'answers'>('all');

const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
        const res = await fetch(`/api/v1/users/${userId}`);
        if (!res.ok) throw new Error('User not found');
        const result = await res.json();
        return result.data as UserData;
    }
});

const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
        const res = await fetch(`/api/v1/users/${userId}/posts`);
        if (!res.ok) throw new Error('Failed to fetch posts');
        const result = await res.json();
        return result.data as Post[];
    }
});

if (userLoading) {
    return (
        <div className="mx-auto max-w-5xl px-4 py-12 animate-pulse">
            <div className="h-40 bg-gray-100 rounded-3xl mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="h-24 bg-gray-50 rounded-2xl" />
                <div className="h-24 bg-gray-50 rounded-2xl" />
            </div>
            <div className="h-96 bg-gray-50 rounded-3xl" />
        </div>
    );
}

if (!user) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <UserIcon className="w-16 h-16 text-gray-200 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">User not found</h1>
            <p className="text-gray-500 mt-2">The profile you are looking for doesn't exist.</p>
            <Link href="/" className="mt-6 text-blue-600 font-semibold hover:underline">Go Home</Link>
        </div>
    );
}

const filteredPosts = posts?.filter(post => {
    if (activeTab === 'all') return true;
    if (activeTab === 'questions') return post.type === 'QUESTION';
    if (activeTab === 'answers') return post.type === 'ANSWER';
    return true;
}) ?? [];

return (
    <div className="mx-auto max-w-5xl px-4 py-12">
        {/* Header Card */}
        <div className="relative overflow-hidden bg-white border border-gray-100 rounded-3xl shadow-sm p-8 mb-8 group">
            <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />

            <div className="relative flex flex-col md:flex-row items-center gap-8">
                <div className="w-32 h-32 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-xl shrink-0">
                    {user.username[0].toUpperCase()}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                            {user.username}
                        </h1>
                        <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                            <Trophy className="w-3 h-3" />
                            Community Member
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-500 text-sm">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 opacity-70" />
                            Joined {format(new Date(user.created_at), 'MMMM yyyy')}
                        </div>
                        <div className="flex items-center gap-1.5">
                            < Trophy className="w-4 h-4 opacity-70" />
                            {user._count.questions + user._count.answers} Contributions
                        </div>
                    </div>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                    <button className="w-full md:w-auto px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all active:scale-95">
                        Share Profile
                    </button>
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
                onClick={() => setActiveTab('questions')}
                className={`bg-white border p-6 rounded-2xl flex items-center gap-4 transition-all hover:shadow-md ${activeTab === 'questions' ? 'border-orange-200 ring-2 ring-orange-50 bg-orange-50/10' : 'border-gray-100'}`}
            >
                <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                    <HelpCircle className="w-6 h-6" />
                </div>
                <div className="text-left">
                    <p className="text-2xl font-black text-gray-900 leading-none">{user._count.questions}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase mt-1">Questions Asked</p>
                </div>
            </button>
            <button
                onClick={() => setActiveTab('answers')}
                className={`bg-white border p-6 rounded-2xl flex items-center gap-4 transition-all hover:shadow-md ${activeTab === 'answers' ? 'border-green-200 ring-2 ring-green-50 bg-green-50/10' : 'border-gray-100'}`}
            >
                <div className="bg-green-100 p-3 rounded-xl text-green-600">
                    <MessageSquare className="w-6 h-6" />
                </div>
                <div className="text-left">
                    <p className="text-2xl font-black text-gray-900 leading-none">{user._count.answers}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase mt-1">Answers Shared</p>
                </div>
            </button>
        </div>

        {/* Activity Feed */}
        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50/30 gap-4">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`text-sm font-bold tracking-tight transition-colors relative pb-1 ${activeTab === 'all' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        All Activity
                        {activeTab === 'all' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('questions')}
                        className={`text-sm font-bold tracking-tight transition-colors relative pb-1 ${activeTab === 'questions' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Questions
                        {activeTab === 'questions' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 rounded-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('answers')}
                        className={`text-sm font-bold tracking-tight transition-colors relative pb-1 ${activeTab === 'answers' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Answers
                        {activeTab === 'answers' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 rounded-full" />}
                    </button>
                </div>
                <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                    {activeTab === 'all' ? 'Combined Feed' : `${activeTab} view`}
                </div>
            </div>

            <div className="divide-y divide-gray-50">
                {postsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-8 animate-pulse">
                            <div className="h-4 w-3/4 bg-gray-100 rounded mb-4" />
                            <div className="h-3 w-1/2 bg-gray-50 rounded" />
                        </div>
                    ))
                ) : filteredPosts.length > 0 ? (
                    filteredPosts.map((post) => (
                        <div key={post.id} className="p-8 hover:bg-blue-50/30 transition-colors group">
                            <div className="flex items-start gap-4">
                                <div className={`
                                        p-2.5 rounded-xl shrink-0 mt-1
                                        ${post.type === 'QUESTION' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}
                                    `}>
                                    {post.type === 'QUESTION' ? <HelpCircle className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`
                                                text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full
                                                ${post.type === 'QUESTION' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}
                                            `}>
                                            {post.type}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {format(new Date(post.created_at), 'MMM dd, yyyy')}
                                        </span>
                                    </div>
                                    <Link
                                        href={`/questions/${post.type === 'QUESTION' ? post.id : post.metadata.questionId}`}
                                        className="block text-lg font-black text-gray-900 leading-tight hover:text-blue-600 transition-colors mb-2"
                                    >
                                        {post.title}
                                    </Link>
                                    <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                                        {post.content}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    {post.type === 'QUESTION' ? (
                                        <div className="text-right">
                                            <p className="text-sm font-black text-gray-900 leading-tight">{post.metadata.answerCount}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Answers</p>
                                        </div>
                                    ) : (
                                        <div className="text-right">
                                            <p className="text-sm font-black text-green-600 leading-tight">+{post.metadata.score}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Score</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                        <p className="text-gray-400 font-medium">No activity found in this category.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
);
}
