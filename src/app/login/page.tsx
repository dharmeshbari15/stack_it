// app/login/page.tsx
// Login page — Server Component wrapper.
// LoginForm is a separate Client Component to keep this page RSC-compatible.
// The page metadata and centered layout are handled here.

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import LoginForm from './LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sign In',
    description: 'Sign in to your StackIt account.',
};

export default async function LoginPage() {
    // Already authenticated users should not see the login page
    const session = await auth();
    if (session?.user) {
        redirect('/');
    }

    return (
        // Full-height centered layout — off-white background matching the app
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gray-50 px-4 py-12">
            {/*
        Suspense is required here because LoginForm uses useSearchParams()
        which opts into dynamic rendering — Suspense prevents the build error.
      */}
            <Suspense fallback={null}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
