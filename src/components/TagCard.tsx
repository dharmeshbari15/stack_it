'use client'

import Link from 'next/link'
import { Hash } from 'lucide-react'
import { FollowButton } from './FollowButton'

interface TagCardProps {
    id: string
    name: string
    questionCount: number
}

export function TagCard({ id, name, questionCount }: TagCardProps) {
    return (
        <div className="group relative bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
            <Link
                href={`/questions?tag=${name}`}
                className="block"
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Hash className="h-5 w-5" />
                    </div>
                    <span className="text-2xl font-black text-gray-100 group-hover:text-blue-50 transition-colors">
                        #{questionCount}
                    </span>
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-1 capitalize">
                    {name}
                </h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
                </p>

                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                </div>
            </Link>

            <div className="mt-4 pt-4 border-t border-gray-100">
                <FollowButton 
                    entityType="tag"
                    entityId={id}
                    className="w-full text-sm"
                />
            </div>
        </div>
    )
}
