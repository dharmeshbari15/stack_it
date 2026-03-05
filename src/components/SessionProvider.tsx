'use client';

// components/SessionProvider.tsx
// Thin wrapper around NextAuth's built-in SessionProvider.
// Must be a Client Component (uses React context internally).
//
// This enables `useSession()` to work in any client component throughout the app.
// The `session` prop is passed from the root layout's `auth()` call so the
// session is immediately available on first render — no loading flicker.

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface Props {
    children: React.ReactNode;
    /** Initial session from the server — eliminates the loading flash */
    session?: Session | null;
}

export default function SessionProvider({ children, session }: Props) {
    return (
        <NextAuthSessionProvider session={session}>
            {children}
        </NextAuthSessionProvider>
    );
}
