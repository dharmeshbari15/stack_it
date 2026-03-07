'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import LoadingSpinner from './ui/LoadingSpinner'
import { FollowButton } from './FollowButton'
import type { 
    ApiResponse,
    FollowedTagsResponse,
    FollowedQuestionsResponse,
    FollowedUsersResponse 
} from '@/types/api'

interface FollowsData {
    tags: FollowedTagsResponse['tags']
    questions: FollowedQuestionsResponse['questions']
    users: FollowedUsersResponse['users']
}

export function FollowedList() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['follows'],
        queryFn: async () => {
            const response = await fetch('/api/v1/user/follows')
            if (!response.ok) {
                throw new Error('Failed to fetch followed items')
            }

            const payload = await response.json() as ApiResponse<FollowsData>
            if (!payload.success || !payload.data) {
                throw new Error('Invalid follows response')
            }

            return payload.data
        }
    })

    if (isLoading) {
        return <LoadingSpinner />
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">Error loading followed items</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Followed Tags */}
            <section>
                <h3 className="text-lg font-semibold mb-4">Followed Tags</h3>
                {data?.tags && data.tags.length > 0 ? (
                    <div className="space-y-2">
                        {data.tags.map(tag => (
                            <div key={tag.id} className="flex items-center justify-between gap-3 p-3 border border-gray-200 rounded-md">
                                <Link
                                    href={`/tags?tag=${encodeURIComponent(tag.name)}`}
                                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                                >
                                    {tag.name}
                                </Link>
                                <FollowButton
                                    entityType="tag"
                                    entityId={tag.id}
                                    isFollowingInitial
                                    className="text-xs"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">You are not following any tags</p>
                )}
            </section>

            {/* Followed Questions */}
            <section>
                <h3 className="text-lg font-semibold mb-4">Followed Questions</h3>
                {data?.questions && data.questions.length > 0 ? (
                    <div className="space-y-3">
                        {data.questions.map(question => (
                            <div key={question.id} className="p-3 border border-gray-200 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                <div className="flex items-start justify-between gap-3">
                                    <Link
                                        href={`/questions/${question.id}`}
                                        className="block min-w-0"
                                    >
                                        <h4 className="font-medium text-gray-900">{question.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            by <span className="font-medium">{question.author.username}</span>
                                        </p>
                                    </Link>
                                    <FollowButton
                                        entityType="question"
                                        entityId={question.id}
                                        isFollowingInitial
                                        className="text-xs shrink-0"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">You are not following any questions</p>
                )}
            </section>

            {/* Followed Users */}
            <section>
                <h3 className="text-lg font-semibold mb-4">Followed Users</h3>
                {data?.users && data.users.length > 0 ? (
                    <div className="space-y-3">
                        {data.users.map(user => (
                            <div key={user.id} className="p-3 border border-gray-200 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                <div className="flex items-start justify-between gap-3">
                                    <Link
                                        href={`/users/${user.id}`}
                                        className="block min-w-0"
                                    >
                                        <h4 className="font-medium text-gray-900">{user.username}</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {user._count?.questions ?? 0} questions • {user._count?.answers ?? 0} answers
                                        </p>
                                    </Link>
                                    <FollowButton
                                        entityType="user"
                                        entityId={user.id}
                                        isFollowingInitial
                                        className="text-xs shrink-0"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">You are not following any users</p>
                )}
            </section>
        </div>
    )
}
