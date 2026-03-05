// auth.ts
// NextAuth.js v5 (Auth.js) core configuration.
//
// Strategy: Credentials-based authentication using email + password.
// Passwords are hashed with bcryptjs before storage (handled in the register API).
// JWT sessions are used (no database sessions) — simpler for a serverless deployment.
//
// The session user object is extended with `id` and `role` so both fields are
// available in server components via `auth()` and in client components via `useSession()`.

import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authConfig: NextAuthConfig = {
    // Custom pages — keeps the UI consistent with the StackIt design
    pages: {
        signIn: '/login',
        error: '/login', // show error on the same login page via ?error= query param
    },

    session: {
        strategy: 'jwt',
        // Sessions expire after 30 days of inactivity
        maxAge: 30 * 24 * 60 * 60,
    },

    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const email = credentials?.email as string | undefined;
                const password = credentials?.password as string | undefined;

                if (!email || !password) return null;

                // Look up the user by email
                const user = await prisma.user.findFirst({
                    where: { email },
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        password_hash: true,
                        role: true,
                    },
                });

                if (!user?.password_hash) return null;

                // Constant-time password comparison to prevent timing attacks
                const isValid = await compare(password, user.password_hash);
                if (!isValid) return null;

                // Return only what we want to store in the JWT
                return {
                    id: user.id,
                    email: user.email,
                    name: user.username,
                    role: user.role,
                };
            },
        }),
    ],

    callbacks: {
        // Persist the user's id and role into the JWT token
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role: string }).role;
            }
            return token;
        },
        // Expose id and role on the session.user object
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                (session.user as unknown as { role: string }).role = token.role as string;
            }
            return session;
        },
    },
};

// Export the auth helpers used throughout the app:
//   auth()        — get the session in Server Components / API routes
//   signIn()      — programmatic sign-in
//   signOut()     — programmatic sign-out
//   handlers      — the GET/POST route handlers for the catch-all route
export const { auth, signIn, signOut, handlers } = NextAuth(authConfig);
