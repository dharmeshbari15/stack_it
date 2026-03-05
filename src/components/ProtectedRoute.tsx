'use client';

// components/ProtectedRoute.tsx
// Client-side route guard for authenticated-only page content.
//
// Works alongside middleware.ts (which handles the server-side redirect):
// - Middleware catches the initial request and redirects before HTML is sent.
// - This component guards against client-side navigation (e.g. next/link, router.push)
//   that bypasses the middleware, and shows a loading state during session hydration.
//
// Usage — wrap the page's content (not the layout):
//
//   export default function AskPage() {
//     return (
//       <ProtectedRoute>
//         <AskQuestionForm />
//       </ProtectedRoute>
//     );
//   }

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
    children: React.ReactNode;
    /**
     * Optional: minimum role required to access this content.
     * Defaults to any authenticated user.
     */
    requiredRole?: 'USER' | 'ADMIN';
}

export default function ProtectedRoute({
    children,
    requiredRole,
}: ProtectedRouteProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    const isLoading = status === 'loading';
    const isAuthenticated = status === 'authenticated';
    const userRole = (session?.user as { role?: string } | undefined)?.role;

    // Insufficient role (e.g. non-admin visiting admin-only pages)
    const hasRequiredRole = !requiredRole || userRole === requiredRole;

    useEffect(() => {
        if (isLoading) return; // wait until session is resolved

        if (!isAuthenticated) {
            // Redirect to login with callbackUrl so they return after signing in
            router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
            return;
        }

        if (!hasRequiredRole) {
            // Authenticated but insufficient role — redirect to home
            router.replace('/');
        }
    }, [isLoading, isAuthenticated, hasRequiredRole, router, pathname]);

    // Show spinner while the session is being resolved from the server
    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <LoadingSpinner size="lg" label="Checking authentication…" />
            </div>
        );
    }

    // Render nothing while the redirect is in-flight
    if (!isAuthenticated || !hasRequiredRole) {
        return null;
    }

    return <>{children}</>;
}
