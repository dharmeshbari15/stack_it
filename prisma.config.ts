import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
        seed: 'tsx prisma/seed.ts',
    },
    datasource: {
        // Keep optional so `prisma generate` can run even when DATABASE_URL is not set.
        url: process.env.DATABASE_URL ?? '',
    },
});
