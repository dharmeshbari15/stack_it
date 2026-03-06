// auth.ts
// NextAuth.js v5 (Auth.js) core configuration — server-only.
//
// This file extends the edge-safe config in auth.config.ts with the
// Credentials provider that needs database access (Prisma + bcryptjs).
// Middleware must NOT import this file — it should use auth.config.ts instead.

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authConfig } from './auth.config';

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,

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

                const isValid = await compare(password, user.password_hash);
                if (!isValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.username,
                    role: user.role,
                };
            },
        }),
    ],
});
