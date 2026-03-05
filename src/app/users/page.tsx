'use client';

// app/users/page.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Users as UsersIcon, Trophy, MessageSquare, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';

interface UserData {
    id: string;
    username: string;
    created_at: string;
    questionCount: number;
    answerCount: number;
    totalContributions: number;
}

export default function UsersPage() {
    const { data: usersData, isLoading } = useQuery({
        queryKey: ['users-directory'],
        queryFn: async () => {
            const res = await fetch('/api/v1/users');
            const result = await res.json();
            return result.data.users as UserData[];
        }
    });

    return (
        <main className="mx-auto max-w-7xl px-4 py-12">
            <header className="mb-12">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                    <UsersIcon className="h-3.5 w-3.5" />
                    Community Root
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                    Our Contributors
                </h1>
                <p className="text-lg text-gray-500 font-medium">
                    Meet the developers who make StackIt a better place for sharing knowledge.
                </p>
            </header>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="h-48 bg-gray-50 rounded-[2.5rem] animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {usersData?.map((user) => (
                        <Link
                            key={user.id}
                            href={`/users/${user.id}`}
                            className="group bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all flex flex-col justify-between"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-100">
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div className="h-10 w-10 rounded-full border border-gray-50 flex items-center justify-center text-gray-300 group-hover:border-blue-100 group-hover:text-blue-500 transition-colors">
                                    <Trophy className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mb-6">
                                <h2 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                    {user.username}
                                </h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">
                                    Joined {format(new Date(user.created_at), 'MMM yyyy')}
                                </p>
                            </div>

                            <div className="flex items-center gap-6 border-t border-gray-50 pt-6">
                                <div className="flex items-center gap-2">
                                    <HelpCircle className="h-4 w-4 text-orange-400" />
                                    <div>
                                        <p className="text-sm font-black text-gray-900 leading-none">{user.questionCount}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Questions</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-green-400" />
                                    <div>
                                        <p className="text-sm font-black text-gray-900 leading-none">{user.answerCount}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Answers</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
