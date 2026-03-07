import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/stack_it?pgbouncer=true';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

try {
    console.log('Checking QuestionVotes in database...\n');
    
    const votes = await prisma.questionVote.findMany({
        include: {
            user: {
                select: {
                    username: true,
                    email: true
                }
            },
            question: {
                select: {
                    title: true
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        },
        take: 10
    });
    
    if (votes.length === 0) {
        console.log('❌ No votes found in database!');
    } else {
        console.log(`✓ Found ${votes.length} recent votes:\n`);
        votes.forEach((vote, idx) => {
            console.log(`${idx + 1}. ${vote.user.username} (${vote.user.email})`);
            console.log(`   Vote: ${vote.value > 0 ? 'UPVOTE' : 'DOWNVOTE'} on "${vote.question.title.substring(0, 50)}..."`);
            console.log(`   User ID: ${vote.user_id}`);
            console.log(`   Question ID: ${vote.question_id}`);
            console.log(`   Created: ${vote.created_at}\n`);
        });
    }
} catch (error) {
    console.error('Error:', error);
} finally {
    await prisma.$disconnect();
    await pool.end();
}
