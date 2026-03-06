// auth.config.ts
// Edge-safe NextAuth configuration — no database or Node.js-only imports.
//
// This file is imported by middleware.ts (which runs in Edge Runtime) so it
// must NOT import Prisma, pg, bcryptjs, or any other Node.js-only module.
// The full provider configuration (with DB access) lives in auth.ts.

import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
    pages: {
        signIn: '/login',
        error: '/login',
    },

    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },

    // Providers are added in auth.ts — keep this empty for Edge compatibility
    providers: [],

    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role: string }).role;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as unknown as { role: string }).role = token.role as string;
            }
            return session;
        },
    },
};
