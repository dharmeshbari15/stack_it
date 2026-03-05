import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database reset and seeding...');

    // 1. Clear existing data (using truncate for restart identity)
    console.log('Clearing existing data...');
    // Order matters due to foreign key constraints
    const tables = ['Vote', 'Notification', 'QuestionTag', 'Answer', 'Question', 'Tag', 'User'];
    for (const table of tables) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    }

    console.log('Seeding new data...');

    // 2. Create Users
    const passwordHash = await bcrypt.hash('password123', 10);

    const usersData = [
        { username: 'alex_dev', email: 'alex@example.com', name: 'Alex Rivers' },
        { username: 'sara_codes', email: 'sara@example.com', name: 'Sara Chen' },
        { username: 'mike_t', email: 'mike@example.com', name: 'Mike Thompson' },
        { username: 'emily_j', email: 'emily@example.com', name: 'Emily Johnson' },
        { username: 'david_k', email: 'david@example.com', name: 'David Kim' },
        { username: 'lisa_m', email: 'lisa@example.com', name: 'Lisa Miller' },
        { username: 'ryan_p', email: 'ryan@example.com', name: 'Ryan Parker' },
        { username: 'chloe_w', email: 'chloe@example.com', name: 'Chloe Wong' },
        { username: 'mark_s', email: 'mark@example.com', name: 'Mark Stevens' },
        { username: 'anna_d', email: 'anna@example.com', name: 'Anna Davis' },
        { username: 'tech_guru', email: 'guru@example.com', name: 'John Guru' },
        { username: 'coder_b', email: 'coderb@example.com', name: 'Bob Coder' },
        { username: 'dev_ops_ninja', email: 'ninja@example.com', name: 'Sam Ninja' },
        { username: 'frontend_master', email: 'master@example.com', name: 'Alice Master' },
        { username: 'backend_beast', email: 'beast@example.com', name: 'Charlie Beast' }
    ];

    const users = [];
    for (const u of usersData) {
        const user = await prisma.user.create({
            data: {
                username: u.username,
                email: u.email,
                password_hash: passwordHash,
                role: 'USER'
            }
        });
        users.push(user);
    }
    console.log(`Created ${users.length} users.`);

    // 3. Create Tags
    const tagsData = ['React', 'Next.js', 'Prisma', 'PostgreSQL', 'Tailwind CSS', 'TypeScript', 'Node.js', 'Authentication', 'API', 'Docker', 'Testing', 'Security'];
    const tags = [];
    for (const tagName of tagsData) {
        const tag = await prisma.tag.create({
            data: { name: tagName }
        });
        tags.push(tag);
    }
    console.log(`Created ${tags.length} tags.`);

    // 4. Create Questions & Answers
    const questionsData = [
        {
            title: 'How to use Prisma with Supabase connection pooling?',
            description: 'I am trying to set up a Next.js app with Prisma and Supabase. I noticed that the connection pooling on Supabase requires a specific configuration for the database URL. Should I use the pooled connection string in my .env file, and do I need to disable the Prisma query engine cache?',
            authorIdx: 0,
            tags: ['Prisma', 'PostgreSQL', 'Next.js'],
            answers: [
                { authorIdx: 1, body: 'Yes, you should use the pooled connection string (usually port 6543/5432 depending on the mode). For Prisma, make sure to add `?pgbouncer=true` to the URL if you are using session mode. Also, ensure your `schema.prisma` has the `directUrl` pointing to the non-pooled connection for migrations.', score: 12 },
                { authorIdx: 2, body: 'I found that using the HTTP adapter for Prisma is sometimes better if you are on serverless (like Vercel). But if you stick with the TCP connection, the pgbouncer flag is critical.', score: 5 }
            ]
        },
        {
            title: 'What is the best way to handle global state in React 19?',
            description: 'With the new features in React 19, like improved Server Components and Actions, is standard Redux still the way to go? Or should I move towards something like Zustand or just rely on Context and useOptimistic?',
            authorIdx: 3,
            tags: ['React', 'Next.js'],
            answers: [
                { authorIdx: 4, body: 'Zustand is still excellent for client-side state because of its simplicity. However, for "server state" (data from your DB), TanStack Query is the industry standard. React 19 doesn’t change that much, it just makes data fetching slightly more integrated.', score: 20 },
                { authorIdx: 0, body: 'Actually, I’ve started using React Actions with `useActionState` and it covers 80% of what I used Redux for in simple apps.', score: 8 }
            ]
        },
        {
            title: 'Centering a div with Tailwind CSS in 2026',
            description: 'Is it still `flex items-center justify-center` or is there a newer utility in Tailwind v4 that makes this even easier?',
            authorIdx: 5,
            tags: ['Tailwind CSS'],
            answers: [
                { authorIdx: 6, body: 'Tailwind v4 introduced `place-content-center` which is a shortcut, but the flexbox way is still perfectly valid and widely understood.', score: 15 }
            ]
        },
        {
            title: 'Securely storing JWT in Next.js',
            description: 'Where is the safest place to store a JWT for a Next.js application? Should it be in an HttpOnly cookie or can I use localStorage if I have CSRF protection?',
            authorIdx: 7,
            tags: ['Authentication', 'Security', 'Next.js'],
            answers: [
                { authorIdx: 10, body: 'HttpOnly, Secure, SameSite=Lax cookies are the only safe way. Never store JWTs in localStorage as they are vulnerable to XSS attacks.', score: 35 },
                { authorIdx: 12, body: 'Agreed. NextAuth.js handles this automatically by default, so I highly recommend just using that instead of rolling your own.', score: 15 }
            ]
        },
        {
            title: 'Dockerizing a Monorepo with TurboRepo',
            description: 'I have a large monorepo with 5 Next.js apps. Deployment is getting slow. How can I optimize my Dockerfile using TurboRepo’s prune command?',
            authorIdx: 8,
            tags: ['Docker', 'Node.js'],
            answers: [
                { authorIdx: 11, body: 'Use `turbo prune --scope=myapp --docker`. This creates a subset of your monorepo with only the necessary files. Then, in your Dockerfile, you can copy this "out" directory and run a clean install.', score: 25 }
            ]
        },
        {
            title: 'Understanding TypeScript "Satisfies" Operator',
            description: 'Can someone explain the specific use case for `satisfies` vs type annotation? I keep seeing it in modern codebases but don’t quite get the benefit.',
            authorIdx: 9,
            tags: ['TypeScript'],
            answers: [
                { authorIdx: 1, body: 'Annotation FORCES a type, which might "lose" specific information. `satisfies` validates that it matches the type but RETAINS the most specific type possible. For example, if you satisfy a record of strings, you still know exactly which keys exist.', score: 42 }
            ]
        },
        {
            title: 'Best practices for API versioning in Next.js Route Handlers?',
            description: 'Should I use folder-based versioning like `/api/v1/...` or should I use headers to specify the version?',
            authorIdx: 13,
            tags: ['API', 'Next.js'],
            answers: [
                { authorIdx: 14, body: 'Folder-based (`/v1`, `/v2`) is much easier for clients to use and for you to manage with middleware. Header-based is "cleaner" from a REST perspective but practically more painful.', score: 10 }
            ]
        }
    ];

    for (const q of questionsData) {
        const question = await prisma.question.create({
            data: {
                title: q.title,
                description: q.description,
                author_id: users[q.authorIdx].id,
                tags: {
                    create: q.tags.map(tagName => ({
                        tag: {
                            connect: { name: tagName }
                        }
                    }))
                }
            }
        });

        for (const a of q.answers) {
            await prisma.answer.create({
                data: {
                    body: a.body,
                    score: a.score,
                    author_id: users[a.authorIdx].id,
                    question_id: question.id
                }
            });
        }
    }

    console.log(`Created ${questionsData.length} questions and ${questionsData.reduce((acc, q) => acc + q.answers.length, 0)} answers.`);

    console.log('Database seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
