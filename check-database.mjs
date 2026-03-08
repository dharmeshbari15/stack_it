import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('Checking database...\\n');

  const questions = await prisma.question.findMany({
    take: 5,
    select: {
      id: true,
      title: true,
      author_id: true,
      created_at: true
    }
  });

  const answers = await prisma.answer.findMany({
    take: 5,
    select: {
      id: true,
      question_id: true,
      author_id: true,
      created_at: true
    }
  });

  const users = await prisma.user.findMany({
    take: 5,
    select: {
      id: true,
      username: true,
      email: true,
      reputation: true
    }
  });

  const bounties = await prisma.bounty.findMany({
    select: {
      id: true,
      question_id: true,
      amount: true,
      status: true
    }
  });

  const questionVersions = await prisma.questionVersion.findMany({
    take: 5,
    select: {
      id: true,
      question_id: true,
      version_number: true,
      created_at: true
    }
  });

  console.log(`📊 Database Summary:`);
  console.log(`  Questions: ${questions.length}`);
  console.log(`  Answers: ${answers.length}`);
  console.log(`  Users: ${users.length}`);
  console.log(`  Bounties: ${bounties.length}`);
  console.log(`  Question Versions: ${questionVersions.length}\\n`);

  if (questions.length > 0) {
    console.log('Sample Questions:');
    questions.forEach(q => console.log(`  - ID ${q.id}: ${q.title.substring(0, 50)}...`));
    console.log('');
  }

  if (users.length > 0) {
    console.log('Sample Users:');
    users.forEach(u => console.log(`  - ID ${u.id}: ${u.username} (${u.email}) - Reputation: ${u.reputation}`));
    console.log('');
  }

  if (bounties.length > 0) {
    console.log('Existing Bounties:');
    bounties.forEach(b => console.log(`  - ID ${b.id}: Question ${b.question_id} - ${b.amount} pts - ${b.status}`));
    console.log('');
  }

  if (questionVersions.length > 0) {
    console.log('Question Versions:');
    questionVersions.forEach(v => console.log(`  - ID ${v.id}: Question ${v.question_id} v${v.version_number}`));
    console.log('');
  }

  await prisma.$disconnect();
}

checkDatabase().catch(console.error);
