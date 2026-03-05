'use client';

// components/ui/ErrorBoundary.tsx
// React class-based error boundary that catches unhandled render errors in
// any child subtree and shows a friendly fallback UI.
//
// React error boundaries MUST be class components — hooks cannot catch errors.
//
// Usage:
//   <ErrorBoundary>
//     <SomeComponent />
//   </ErrorBoundary>
//
//   Or with a custom fallback:
//   <ErrorBoundary fallback={<p>Something went wrong.</p>}>
//     <SomeComponent />
//   </ErrorBoundary>

import { Component, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
    children: ReactNode;
    /** Custom fallback UI. Defaults to the built-in ErrorFallback component. */
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

// ─── Default Fallback UI ─────────────────────────────────────────────────────

function ErrorFallback({
    error,
    onReset,
}: {
    error: Error | null;
    onReset: () => void;
}) {
    return (
        <div
            role="alert"
            className="flex min-h-[30vh] flex-col items-center justify-center gap-4 px-4 text-center"
        >
            {/* Error icon */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                    />
                </svg>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-900">
                    Something went wrong
                </h2>
                <p className="mt-1 max-w-sm text-sm text-gray-500">
                    {error?.message ?? 'An unexpected error occurred. Please try again.'}
                </p>
            </div>

            <button
                onClick={onReset}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
                Try again
            </button>
        </div>
    );
}

// ─── Error Boundary Class ─────────────────────────────────────────────────────

export default class ErrorBoundary extends Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // In production this would forward to an error monitoring service (e.g. Sentry)
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback ?? (
                    <ErrorFallback
                        error={this.state.error}
                        onReset={this.handleReset}
                    />
                )
            );
        }

        return this.props.children;
    }
}
