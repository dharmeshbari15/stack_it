// prisma/seed.ts
// Database seed script with realistic mock data for StackIt Q&A platform

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { hash } from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting database seed...');

    // Clear existing data (in reverse order of dependencies)
    console.log('🧹 Cleaning existing data...');
    await prisma.notification.deleteMany();
    await prisma.vote.deleteMany();
    await prisma.questionTag.deleteMany();
    await prisma.answer.deleteMany();
    await prisma.question.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.user.deleteMany();

    // Create Users
    console.log('👥 Creating users...');
    const passwordHash = await hash('Password123!', 12);

    const alice = await prisma.user.create({
        data: {
            username: 'alice_dev',
            email: 'alice@example.com',
            password_hash: passwordHash,
            role: 'USER',
        },
    });

    const bob = await prisma.user.create({
        data: {
            username: 'bob_smith',
            email: 'bob@example.com',
            password_hash: passwordHash,
            role: 'USER',
        },
    });

    const charlie = await prisma.user.create({
        data: {
            username: 'charlie_code',
            email: 'charlie@example.com',
            password_hash: passwordHash,
            role: 'USER',
        },
    });

    const diana = await prisma.user.create({
        data: {
            username: 'diana_tech',
            email: 'diana@example.com',
            password_hash: passwordHash,
            role: 'ADMIN',
        },
    });

    const eve = await prisma.user.create({
        data: {
            username: 'eve_developer',
            email: 'eve@example.com',
            password_hash: passwordHash,
            role: 'USER',
        },
    });

    // Create Tags
    console.log('🏷️  Creating tags...');
    const jsTag = await prisma.tag.create({ data: { name: 'javascript' } });
    const tsTag = await prisma.tag.create({ data: { name: 'typescript' } });
    const reactTag = await prisma.tag.create({ data: { name: 'react' } });
    const nextjsTag = await prisma.tag.create({ data: { name: 'nextjs' } });
    const nodeTag = await prisma.tag.create({ data: { name: 'nodejs' } });
    const prismaTag = await prisma.tag.create({ data: { name: 'prisma' } });
    const postgresTag = await prisma.tag.create({ data: { name: 'postgresql' } });
    const cssTag = await prisma.tag.create({ data: { name: 'css' } });
    const apiTag = await prisma.tag.create({ data: { name: 'api' } });
    const authTag = await prisma.tag.create({ data: { name: 'authentication' } });
    const pythonTag = await prisma.tag.create({ data: { name: 'python' } });
    const dockerTag = await prisma.tag.create({ data: { name: 'docker' } });

    // Create Questions with Answers
    console.log('❓ Creating questions and answers...');

    // Question 1: React Hooks
    const q1 = await prisma.question.create({
        data: {
            title: 'How to use useEffect with async functions in React?',
            description: `I'm trying to fetch data in a useEffect hook but getting warnings about async functions. Here's my code:

\`\`\`javascript
useEffect(async () => {
  const data = await fetchData();
  setData(data);
}, []);
\`\`\`

What's the correct way to handle async operations in useEffect?`,
            author_id: alice.id,
            tags: {
                create: [
                    { tag_id: reactTag.id },
                    { tag_id: jsTag.id },
                ],
            },
        },
    });

    const a1_1 = await prisma.answer.create({
        data: {
            body: `You can't pass an async function directly to useEffect, but you can define an async function inside it:

\`\`\`javascript
useEffect(() => {
  const loadData = async () => {
    try {
      const result = await fetchData();
      setData(result);
    } catch (error) {
      console.error(error);
    }
  };
  
  loadData();
}, []);
\`\`\`

This pattern avoids the warning and gives you proper async/await support with error handling.`,
            question_id: q1.id,
            author_id: bob.id,
            score: 15,
        },
    });

    const a1_2 = await prisma.answer.create({
        data: {
            body: `Another clean approach is to use an IIFE (Immediately Invoked Function Expression):

\`\`\`javascript
useEffect(() => {
  (async () => {
    const data = await fetchData();
    setData(data);
  })();
}, []);
\`\`\`

Both approaches work well. Just remember to handle cleanup if the component unmounts before the request completes.`,
            question_id: q1.id,
            author_id: charlie.id,
            score: 8,
        },
    });

    // Update question with accepted answer
    await prisma.question.update({
        where: { id: q1.id },
        data: { accepted_answer_id: a1_1.id },
    });

    // Question 2: Next.js API Routes
    const q2 = await prisma.question.create({
        data: {
            title: 'What is the difference between API Routes and Server Actions in Next.js?',
            description: `I'm building a Next.js 14 app and confused about when to use API Routes vs Server Actions. Can someone explain the key differences and use cases for each?`,
            author_id: bob.id,
            tags: {
                create: [
                    { tag_id: nextjsTag.id },
                    { tag_id: tsTag.id },
                    { tag_id: apiTag.id },
                ],
            },
        },
    });

    await prisma.answer.create({
        data: {
            body: `Great question! Here are the key differences:

**API Routes:**
- Traditional REST endpoints (/api/...)
- Work with any client (external apps, mobile apps)
- Return JSON responses
- Good for public APIs or third-party integrations

**Server Actions:**
- Called directly from React components
- Only work within your Next.js app
- Can handle form submissions and mutations
- Automatically handle revalidation and caching
- Better TypeScript integration

Use **API Routes** when you need a public API. Use **Server Actions** for internal app mutations and form handling.`,
            question_id: q2.id,
            author_id: diana.id,
            score: 22,
        },
    });

    // Question 3: Prisma Relations
    const q3 = await prisma.question.create({
        data: {
            title: 'How to handle many-to-many relationships in Prisma?',
            description: `I need to create a many-to-many relationship between Users and Projects. What's the best way to model this in Prisma schema?`,
            author_id: charlie.id,
            tags: {
                create: [
                    { tag_id: prismaTag.id },
                    { tag_id: nodeTag.id },
                    { tag_id: postgresTag.id },
                ],
            },
        },
    });

    const a3_1 = await prisma.answer.create({
        data: {
            body: `Prisma supports implicit and explicit many-to-many relations:

**Implicit (simple):**
\`\`\`prisma
model User {
  id       String    @id @default(uuid())
  projects Project[]
}

model Project {
  id    String @id @default(uuid())
  users User[]
}
\`\`\`

**Explicit (with extra fields):**
\`\`\`prisma
model UserProject {
  userId    String
  projectId String
  role      String
  user      User    @relation(fields: [userId], references: [id])
  project   Project @relation(fields: [projectId], references: [id])
  
  @@id([userId, projectId])
}
\`\`\`

Use implicit for simple relations, explicit when you need junction table fields like timestamps or roles.`,
            question_id: q3.id,
            author_id: eve.id,
            score: 18,
        },
    });

    // Question 4: Authentication
    const q4 = await prisma.question.create({
        data: {
            title: 'JWT vs Session-based authentication: Which to choose?',
            description: `I'm implementing authentication for my web app. Should I use JWT tokens or traditional session-based auth? What are the pros and cons of each approach?`,
            author_id: eve.id,
            tags: {
                create: [
                    { tag_id: authTag.id },
                    { tag_id: nodeTag.id },
                    { tag_id: apiTag.id },
                ],
            },
        },
    });

    await prisma.answer.create({
        data: {
            body: `Both have their place. Here's a quick comparison:

**JWT Tokens:**
✅ Stateless (no server storage)
✅ Works well for microservices
✅ Mobile-friendly
❌ Can't invalidate easily
❌ Larger payload in requests

**Session-based:**
✅ Easy to invalidate
✅ Server has full control
✅ Smaller cookie size
❌ Requires server storage
❌ Sticky sessions in clusters

For most web apps, I recommend **session-based** with httpOnly cookies. For APIs consumed by mobile apps, use **JWT**.`,
            question_id: q4.id,
            author_id: alice.id,
            score: 31,
        },
    });

    // Question 5: CSS Flexbox
    const q5 = await prisma.question.create({
        data: {
            title: 'Vertically center a div with flexbox',
            description: `What's the cleanest way to vertically and horizontally center a div using flexbox? I've tried several approaches but nothing seems to work consistently.`,
            author_id: alice.id,
            tags: {
                create: [{ tag_id: cssTag.id }],
            },
        },
    });

    const a5_1 = await prisma.answer.create({
        data: {
            body: `The simplest flexbox centering pattern:

\`\`\`css
.container {
  display: flex;
  justify-content: center; /* horizontal */
  align-items: center;     /* vertical */
  min-height: 100vh;       /* full viewport height */
}
\`\`\`

That's it! This centers the child both horizontally and vertically.`,
            question_id: q5.id,
            author_id: bob.id,
            score: 12,
        },
    });

    // Question 6: Docker Networking
    const q6 = await prisma.question.create({
        data: {
            title: 'Connect Node.js app to PostgreSQL in Docker Compose',
            description: `My Node.js application can't connect to the PostgreSQL database when both are running in Docker Compose. I'm getting \`ECONNREFUSED\` errors. How do I configure networking correctly?`,
            author_id: bob.id,
            tags: {
                create: [
                    { tag_id: dockerTag.id },
                    { tag_id: nodeTag.id },
                    { tag_id: postgresTag.id },
                ],
            },
        },
    });

    await prisma.answer.create({
        data: {
            body: `In Docker Compose, use the service name as the hostname. Here's a working example:

\`\`\`yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: myuser
      POSTGRES_PASSWORD: mypassword
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
  
  app:
    build: .
    environment:
      DATABASE_URL: "postgresql://myuser:mypassword@postgres:5432/mydb"
    depends_on:
      - postgres
\`\`\`

Key point: Use \`postgres\` (the service name) as the hostname, not \`localhost\`.`,
            question_id: q6.id,
            author_id: charlie.id,
            score: 25,
        },
    });

    // Question 7: Python async/await
    const q7 = await prisma.question.create({
        data: {
            title: 'Understanding async/await in Python',
            description: `I'm new to Python's asyncio library. Can someone explain how async/await works and when I should use it instead of regular synchronous code?`,
            author_id: charlie.id,
            tags: {
                create: [{ tag_id: pythonTag.id }],
            },
        },
    });

    const a7_1 = await prisma.answer.create({
        data: {
            body: `Async/await in Python is for I/O-bound operations (network requests, file I/O, database queries):

\`\`\`python
import asyncio
import aiohttp

async def fetch_data(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.json()

# Run multiple requests concurrently
async def main():
    urls = ['http://api1.com', 'http://api2.com']
    results = await asyncio.gather(*[fetch_data(url) for url in urls])
    print(results)

asyncio.run(main())
\`\`\`

Use async when you have multiple I/O operations that can run concurrently. Don't use it for CPU-bound tasks.`,
            question_id: q7.id,
            author_id: diana.id,
            score: 14,
        },
    });

    // Create Votes
    console.log('👍 Creating votes...');
    await prisma.vote.createMany({
        data: [
            { user_id: alice.id, answer_id: a1_1.id, value: 1 },
            { user_id: charlie.id, answer_id: a1_1.id, value: 1 },
            { user_id: diana.id, answer_id: a1_1.id, value: 1 },
            { user_id: eve.id, answer_id: a1_1.id, value: 1 },
            { user_id: alice.id, answer_id: a1_2.id, value: 1 },
            { user_id: bob.id, answer_id: a3_1.id, value: 1 },
            { user_id: charlie.id, answer_id: a3_1.id, value: 1 },
            { user_id: alice.id, answer_id: a5_1.id, value: 1 },
            { user_id: diana.id, answer_id: a7_1.id, value: 1 },
        ],
    });

    // Create Notifications
    console.log('🔔 Creating notifications...');
    await prisma.notification.createMany({
        data: [
            {
                user_id: alice.id,
                actor_id: bob.id,
                type: 'ANSWER',
                reference_id: a1_1.id,
                is_read: false,
            },
            {
                user_id: alice.id,
                actor_id: charlie.id,
                type: 'ANSWER',
                reference_id: a1_2.id,
                is_read: true,
            },
            {
                user_id: bob.id,
                actor_id: diana.id,
                type: 'ANSWER',
                reference_id: q2.id,
                is_read: false,
            },
            {
                user_id: charlie.id,
                actor_id: eve.id,
                type: 'ANSWER',
                reference_id: a3_1.id,
                is_read: false,
            },
            {
                user_id: alice.id,
                actor_id: diana.id,
                type: 'SYSTEM',
                reference_id: 'welcome',
                is_read: true,
            },
        ],
    });

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log('  - 5 users created (password for all: Password123!)');
    console.log('  - 12 tags created');
    console.log('  - 7 questions created');
    console.log('  - 8 answers created');
    console.log('  - 9 votes created');
    console.log('  - 5 notifications created');
    console.log('\n🔐 Login credentials:');
    console.log('  - alice@example.com / Password123!');
    console.log('  - bob@example.com / Password123!');
    console.log('  - charlie@example.com / Password123!');
    console.log('  - diana@example.com / Password123! (ADMIN)');
    console.log('  - eve@example.com / Password123!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
