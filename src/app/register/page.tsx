// app/register/page.tsx
// Registration page — Server Component wrapper.
// Redirects already-authenticated users to home so they can't register twice.

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import RegisterForm from './RegisterForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Create Account',
    description: 'Create a free StackIt account to ask and answer questions.',
};

export default async function RegisterPage() {
    const session = await auth();
    if (session?.user) {
        redirect('/');
    }

    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-gray-50 px-4 py-12">
            <RegisterForm />
        </div>
    );
}
