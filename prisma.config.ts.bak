import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        // Uses the direct (non-pooled) URL for migrations
        url: process.env['DIRECT_URL']!,
    },
});
