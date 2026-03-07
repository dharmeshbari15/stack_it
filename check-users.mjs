import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/stack_it?pgbouncer=true';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

try {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            username: true,
        }
    });
    
    console.log('Users in database:');
    console.log(JSON.stringify(users, null, 2));
    
    if (users.length === 0) {
        console.log('\n⚠️  No users found in database!');
    }
} catch (error) {
    console.error('Error:', error);
} finally {
    await prisma.$disconnect();
    await pool.end();
}
