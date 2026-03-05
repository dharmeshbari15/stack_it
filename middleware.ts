// middleware.ts
// Next.js middleware for route-level session protection using NextAuth v5.
//
// Protects /ask and /profile routes — redirects unauthenticated users to /login.
// Public routes (home, questions list, tags, individual question pages) are
// always accessible without a session (as per PRD: guest users can browse).

import { auth } from './auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const pathname = req.nextUrl.pathname;

    // Routes that require authentication
    const protectedPaths = ['/ask', '/profile', '/settings'];
    const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

    if (isProtected && !isLoggedIn) {
        const loginUrl = new URL('/login', req.nextUrl.origin);
        // Preserve the intended destination for redirect after login
        loginUrl.searchParams.set('callbackUrl', req.nextUrl.href);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
});

// Only run middleware on app pages — skip on static assets and API routes
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
