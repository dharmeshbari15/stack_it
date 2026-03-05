const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const questions = await prisma.question.findMany({
            include: {
                author: { select: { id: true, username: true } },
                tags: { include: { tag: true } },
                _count: { select: { answers: true } },
            },
        });
        console.log("Success!", questions.length);
    } catch (err) {
        console.error("Prisma Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}
main();
