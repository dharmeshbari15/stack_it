// lib/prisma.ts
// Prisma Client singleton for Next.js API routes.
//
// Next.js hot-reload re-evaluates modules on every change in development,
// creating a new PrismaClient instance each time and exhausting the DB
// connection pool quickly. We persist the instance on the global object
// during development; in production modules are only evaluated once anyway.

import { PrismaClient } from '@prisma/client';

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
    global.prisma ??
    new PrismaClient({
        log:
            process.env.NODE_ENV === 'development'
                ? ['query', 'error', 'warn']
                : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
