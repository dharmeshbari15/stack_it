'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@/types/api';

export default function MyProfileRedirectPage() {
    const router = useRouter();
    const { data: session, status } = useSession();

    const { data, isLoading } = useQuery<ApiResponse<{ id: string; username: string }> | null>({
        queryKey: ['my-profile-id'],
        enabled: status === 'authenticated',
        queryFn: async () => {
            const res = await fetch('/api/v1/users/me', {
                credentials: 'include',
                cache: 'no-store',
            });
            if (!res.ok) {
                return null;
            }
            return res.json();
        },
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/login?callbackUrl=/users/me');
            return;
        }

        if (status !== 'authenticated') {
            return;
        }

        const resolvedUserId = data?.data?.id ?? session?.user?.id;
        if (resolvedUserId) {
            router.replace(`/users/${resolvedUserId}`);
        }
    }, [status, data, session, router]);

    return (
        <main className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-600">
            {isLoading || status === 'loading' ? 'Loading your profile...' : 'Redirecting to your profile...'}
        </main>
    );
}
