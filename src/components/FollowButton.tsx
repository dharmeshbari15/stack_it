'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '@/lib/events'
import type { ApiResponse, FollowResponse } from '@/types/api'

interface FollowButtonProps {
    entityType: 'tag' | 'question' | 'user'
    entityId: string
    isFollowingInitial?: boolean
    className?: string
}

export function FollowButton({
    entityType,
    entityId,
    isFollowingInitial = false,
    className = ''
}: FollowButtonProps) {
    const { status } = useSession()
    const queryClient = useQueryClient()
    const [isFollowing, setIsFollowing] = useState(isFollowingInitial)
    const [isLoading, setIsLoading] = useState(false)

    const endpoint = useMemo(() => {
        switch (entityType) {
            case 'tag':
                return `/api/v1/tags/${entityId}/follow`
            case 'question':
                return `/api/v1/questions/${entityId}/follow`
            case 'user':
                return `/api/v1/users/${entityId}/follow`
        }
    }, [entityType, entityId])

    useEffect(() => {
        const checkFollowStatus = async () => {
            try {
                const response = await fetch(endpoint, { method: 'GET' })
                if (!response.ok) {
                    return
                }

                const payload = await response.json() as ApiResponse<FollowResponse>
                if (payload.success && payload.data) {
                    setIsFollowing(payload.data.is_following)
                }
            } catch (error) {
                console.error('Error checking follow status:', error)
            }
        }

        checkFollowStatus()
    }, [endpoint, status])

    const toggleFollow = async () => {
        if (status !== 'authenticated') {
            toast.error('Please sign in to follow content.')
            return
        }

        setIsLoading(true)
        try {
            const method = isFollowing ? 'DELETE' : 'POST'
            const response = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' }
            })

            if (!response.ok) {
                throw new Error('Failed to update follow status')
            }

            const payload = await response.json() as ApiResponse<FollowResponse>
            if (!payload.success || !payload.data) {
                throw new Error('Invalid follow response')
            }

            const nextState = payload.data.is_following
            setIsFollowing(nextState)
            queryClient.invalidateQueries({ queryKey: ['follows'] })
            toast.success(nextState ? 'Followed successfully' : 'Unfollowed successfully')
        } catch (error) {
            console.error('Error toggling follow:', error)
            toast.error('Could not update follow status. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const buttonText = isFollowing ? 'Unfollow' : 'Follow'
    const buttonClass = `px-4 py-2 rounded-md font-medium transition-colors ${
        isFollowing
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    } disabled:opacity-50 disabled:cursor-not-allowed ${className}`

    return (
        <button
            onClick={toggleFollow}
            disabled={isLoading}
            className={buttonClass}
            title={`${isFollowing ? 'Unfollow' : 'Follow'} ${entityType}`}
        >
            {isLoading ? '...' : buttonText}
        </button>
    )
}
