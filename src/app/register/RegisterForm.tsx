'use client';

// app/register/RegisterForm.tsx
// Client component — handles the multi-field registration form.
// On success: calls POST /api/v1/auth/register, then auto-signs the user in
// via NextAuth signIn() so they land on the app already authenticated.

import { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// ─── Field Error Helpers ──────────────────────────────────────────────────────

interface FieldErrors {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export default function RegisterForm() {
    const router = useRouter();
    const [errors, setErrors] = useState<FieldErrors>({});
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErrors({});

        const formData = new FormData(e.currentTarget);
        const username = (formData.get('username') as string).trim();
        const email = (formData.get('email') as string).trim();
        const password = formData.get('password') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        // Client-side validation — mirrors the Zod schema on the server
        const clientErrors: FieldErrors = {};
        if (username.length < 3)
            clientErrors.username = 'Username must be at least 3 characters.';
        if (!/^[a-zA-Z0-9_-]+$/.test(username))
            clientErrors.username =
                'Username can only contain letters, numbers, underscores and hyphens.';
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            clientErrors.email = 'Please enter a valid email address.';
        if (password.length < 8)
            clientErrors.password = 'Password must be at least 8 characters.';
        if (password !== confirmPassword)
            clientErrors.confirmPassword = 'Passwords do not match.';

        if (Object.keys(clientErrors).length > 0) {
            setErrors(clientErrors);
            return;
        }

        startTransition(async () => {
            // 1. Register the user via the REST API
            const res = await fetch('/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const data: { success: boolean; error?: { message: string; code?: string } } =
                await res.json();

            if (!res.ok || !data.success) {
                const msg = data.error?.message ?? 'Registration failed. Please try again.';
                const code = data.error?.code;
                if (code === 'EMAIL_TAKEN') setErrors({ email: msg });
                else if (code === 'USERNAME_TAKEN') setErrors({ username: msg });
                else setErrors({ general: msg });
                return;
            }

            // 2. Auto-sign-in with the credentials they just registered with
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setErrors({
                    general: 'Account created but could not sign in automatically. Please log in.',
                });
                router.push('/login');
                return;
            }

            // 3. Redirect to homepage with a fresh session
            router.push('/');
            router.refresh();
        });
    }

    return (
        <div className="w-full max-w-md">
            <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
                {/* Logo + heading */}
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
                    <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
                    <p className="text-sm text-gray-500">
                        Join the community and start asking questions
                    </p>
                </div>

                {/* General error banner */}
                {errors.general && (
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
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                    {/* Username */}
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="reg-username"
                            className="text-sm font-medium text-gray-700"
                        >
                            Username
                        </label>
                        <input
                            id="reg-username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            placeholder="e.g. dev_alice"
                            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:opacity-60 ${errors.username
                                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                                }`}
                            disabled={isPending}
                        />
                        <FieldError message={errors.username} />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="reg-email"
                            className="text-sm font-medium text-gray-700"
                        >
                            Email address
                        </label>
                        <input
                            id="reg-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="you@example.com"
                            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:opacity-60 ${errors.email
                                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                                }`}
                            disabled={isPending}
                        />
                        <FieldError message={errors.email} />
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="reg-password"
                            className="text-sm font-medium text-gray-700"
                        >
                            Password
                        </label>
                        <input
                            id="reg-password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            placeholder="At least 8 characters"
                            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:opacity-60 ${errors.password
                                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                                }`}
                            disabled={isPending}
                        />
                        <FieldError message={errors.password} />
                    </div>

                    {/* Confirm Password */}
                    <div className="flex flex-col gap-1.5">
                        <label
                            htmlFor="reg-confirm-password"
                            className="text-sm font-medium text-gray-700"
                        >
                            Confirm password
                        </label>
                        <input
                            id="reg-confirm-password"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            required
                            placeholder="Repeat your password"
                            className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:opacity-60 ${errors.confirmPassword
                                    ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
                                }`}
                            disabled={isPending}
                        />
                        <FieldError message={errors.confirmPassword} />
                    </div>

                    {/* Submit */}
                    <button
                        id="register-submit"
                        type="submit"
                        disabled={isPending}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
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
                                Creating account…
                            </>
                        ) : (
                            'Create account'
                        )}
                    </button>
                </form>

                {/* Footer link */}
                <p className="mt-6 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link
                        href="/login"
                        className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
