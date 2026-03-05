// middleware.ts
// Next.js middleware for route-level session protection using NextAuth v5.
//
// Protects /ask and /profile routes — redirects unauthenticated users to /login.
// Public routes (home, questions list, tags, individual question pages) are
// always accessible without a session (as per PRD: guest users can browse).

import { auth } from './auth';
import { NextResponse } from 'next/server';
import { rateLimit } from './src/lib/rate-limit';

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const pathname = req.nextUrl.pathname;
    const method = req.method;

    // ─── Rate Limiting ───────────────────────────────────────────────────────────
    // Apply protection to sensitive API routes
    if (method === 'POST') {
        const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

        // 1. Registration (5 requests per hour)
        if (pathname === '/api/v1/auth/register') {
            const { success, limit, remaining, reset } = rateLimit(`${ip}:register`, 5, 60 * 60 * 1000);
            if (!success) {
                return new NextResponse(
                    JSON.stringify({ error: { message: 'Too many registration attempts. Please try again in an hour.' } }),
                    {
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-RateLimit-Limit': limit.toString(),
                            'X-RateLimit-Remaining': remaining.toString(),
                            'X-RateLimit-Reset': reset.toString(),
                            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString()
                        }
                    }
                );
            }
        }

        // 2. Questions (10 requests per 15 mins)
        if (pathname === '/api/v1/questions') {
            const { success, limit, remaining, reset } = rateLimit(`${ip}:questions`, 10, 15 * 60 * 1000);
            if (!success) {
                return new NextResponse(
                    JSON.stringify({ error: { message: 'Too many questions posted. Please slow down.' } }),
                    {
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-RateLimit-Limit': limit.toString(),
                            'X-RateLimit-Remaining': remaining.toString(),
                            'X-RateLimit-Reset': reset.toString(),
                            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString()
                        }
                    }
                );
            }
        }
    }

    // ─── Route Protection ────────────────────────────────────────────────────────
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

// Only run middleware on app pages and specific API routes
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
