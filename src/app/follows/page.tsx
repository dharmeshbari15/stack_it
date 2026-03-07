'use client'

import { FollowedList } from '@/components/FollowedList'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export default function FollowsPage() {
    const { data: session, status } = useSession()

    if (status === 'loading') {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-48"></div>
                    <div className="h-4 bg-gray-200 rounded w-96"></div>
                </div>
            </div>
        )
    }

    if (!session) {
        redirect('/login')
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Following</h1>
            <p className="text-gray-600 mb-8">
                Tags, questions, and users you follow. You will receive notifications for new activity.
            </p>
            <FollowedList />
        </div>
    )
}
