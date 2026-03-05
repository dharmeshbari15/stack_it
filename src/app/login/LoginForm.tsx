'use client';

// app/login/LoginForm.tsx
// Client component — handles form state, submission, and NextAuth signIn call.
// Kept separate from the page so the page itself can be a Server Component.

import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── Error Messages ───────────────────────────────────────────────────────────

const AUTH_ERRORS: Record<string, string> = {
    CredentialsSignin: 'Invalid email or password. Please try again.',
    Default: 'Something went wrong. Please try again.',
};

// ─── Form ─────────────────────────────────────────────────────────────────────

export default function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') ?? '/';

    // Map NextAuth error codes from the ?error= query param to readable messages
    const errorCode = searchParams.get('error');
    const initialError = errorCode
        ? (AUTH_ERRORS[errorCode] ?? AUTH_ERRORS.Default)
        : null;

    const [error, setError] = useState<string | null>(initialError);
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        startTransition(async () => {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false, // handle redirect manually to show inline errors
            });

            if (result?.error) {
                setError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS.Default);
                return;
            }

            // Successful login — navigate to the original destination
            router.push(callbackUrl);
            router.refresh(); // invalidate the Server Component cache so Navbar updates
        });
    }

    return (
        <div className="w-full max-w-md">
            {/* Card */}
            <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 28 28"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                        >
                            <rect
                                x="4"
                                y="4"
                                width="12"
                                height="12"
                                rx="2"
                                fill="#2563EB"
                                transform="rotate(45 14 4)"
                            />
                        </svg>
                        <span className="text-xl font-bold text-gray-900 tracking-tight">
                            StackIt
                        </span>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
                    <p className="text-sm text-gray-500">Sign in to your account to continue</p>
                </div>

                {/* Error banner */}
                {error && (
                    <div
                        role="alert"
                        className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="mt-0.5 h-4 w-4 shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="login-email"
                            className="text-sm font-medium text-gray-700"
                        >
                            Email address
                        </label>
                        <input
                            id="login-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="you@example.com"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                            disabled={isPending}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <label
                                htmlFor="login-password"
                                className="text-sm font-medium text-gray-700"
                            >
                                Password
                            </label>
                            {/* Placeholder — forgot password flow not in MVP scope */}
                            <span className="text-xs text-gray-400">Forgot password?</span>
                        </div>
                        <input
                            id="login-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            placeholder="••••••••"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                            disabled={isPending}
                        />
                    </div>

                    <button
                        id="login-submit"
                        type="submit"
                        disabled={isPending}
                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isPending ? (
                            <>
                                <svg
                                    className="h-4 w-4 animate-spin"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                Signing in…
                            </>
                        ) : (
                            'Sign in'
                        )}
                    </button>
                </form>

                {/* Divider */}
                <p className="mt-6 text-center text-sm text-gray-500">
                    Don&apos;t have an account?{' '}
                    <Link
                        href="/register"
                        className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
