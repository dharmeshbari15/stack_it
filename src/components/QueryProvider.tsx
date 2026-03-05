'use client';

// components/QueryProvider.tsx
// TanStack Query (React Query) provider for client-side data fetching.
//
// Must be a Client Component because QueryClientProvider uses React context.
// We instantiate QueryClient with sensible defaults for a Q&A platform:
//  - staleTime: 60s  — questions/answers don't change every second
//  - gcTime: 5min    — keep cached data in memory for navigation speed
//  - retry: 1        — retry failed requests once before surfacing the error

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    // useState ensures each browser session gets its own QueryClient, preventing
    // shared state across users in server-side rendering environments.
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Data is considered fresh for 60 seconds
                        staleTime: 60 * 1000,
                        // Unused cached data is garbage-collected after 5 minutes
                        gcTime: 5 * 60 * 1000,
                        // Retry failed queries once before showing an error
                        retry: 1,
                        // Don't refetch when the window regains focus (reduces API noise)
                        refetchOnWindowFocus: false,
                    },
                    mutations: {
                        // Don't retry failed mutations — let the user decide to re-submit
                        retry: 0,
                    },
                },
            }),
    );

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}
