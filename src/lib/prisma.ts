// lib/prisma.ts
// Prisma Client singleton for Next.js API routes — Prisma 7 compatible.
//
// Prisma 7 uses the new "client" engine type which requires a driver adapter
// instead of the legacy Rust query engine binary. We use @prisma/adapter-pg
// with a pg Pool, configured with the pooled connection URL (pgBouncer).
//
// The singleton pattern prevents connection pool exhaustion during Next.js
// hot-reloads in development, while production modules are only evaluated once.

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
    var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set.');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === 'development'
                ? ['query', 'error', 'warn']
                : ['error'],
    });
}

export const prisma: PrismaClient = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
