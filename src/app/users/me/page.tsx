'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';

export default function MyProfileRedirectPage() {
    const router = useRouter();
    const { status } = useSession();

    const { data, isLoading } = useQuery<{ success: boolean; data: { id: string } } | null>({
        queryKey: ['my-profile-id'],
        enabled: status === 'authenticated',
        queryFn: async () => {
            const res = await fetch('/api/v1/users/me');
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

        const userId = data?.data?.id;
        if (status === 'authenticated' && userId) {
            router.replace(`/users/${userId}`);
        }
    }, [status, data, router]);

    return (
        <main className="mx-auto max-w-3xl px-4 py-16 text-center text-gray-600">
            {isLoading || status === 'loading' ? 'Loading your profile...' : 'Redirecting to your profile...'}
        </main>
    );
}
