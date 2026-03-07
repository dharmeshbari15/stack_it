// backfill-embeddings.mjs
// Script to generate embeddings for existing questions
// Usage: node backfill-embeddings.mjs

import { PrismaClient } from './src/generated/prisma/client.ts';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = 'text-embedding-3-small';
const BATCH_SIZE = 10;

function createQuestionText(title, description) {
    return `${title}\n${title}\n${description}`;
}

async function generateEmbedding(text) {
    const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text.trim(),
    });
    return response.data[0].embedding;
}

async function backfillBatch() {
    try {
        // Find questions without embeddings
        const questions = await prisma.question.findMany({
            where: {
                deleted_at: null,
                embedding: null,
            },
            take: BATCH_SIZE,
            select: {
                id: true,
                title: true,
                description: true,
            },
        });

        if (questions.length === 0) {
            console.log('✅ All questions have embeddings!');
            return 0;
        }

        console.log(`\n🔄 Processing batch of ${questions.length} questions...`);

        let processed = 0;
        let failed = 0;

        for (const question of questions) {
            try {
                const text = createQuestionText(question.title, question.description);
                const embedding = await generateEmbedding(text);
                const embeddingJson = JSON.stringify(embedding);

                await prisma.questionEmbedding.create({
                    data: {
                        question_id: question.id,
                        embedding: embeddingJson,
                        model_version: EMBEDDING_MODEL,
                    },
                });

                processed++;
                console.log(`  ✓ Embedded question: ${question.title.substring(0, 60)}...`);
            } catch (error) {
                failed++;
                console.error(`  ✗ Failed to embed question ${question.id}:`, error.message);
            }
        }

        console.log(`\n📊 Batch complete: ${processed} processed, ${failed} failed`);
        return questions.length;
    } catch (error) {
        console.error('❌ Error processing batch:', error);
        throw error;
    }
}

async function main() {
    console.log('🚀 Starting embedding backfill...\n');

    if (!process.env.OPENAI_API_KEY) {
        console.error('❌ Error: OPENAI_API_KEY environment variable not set');
        process.exit(1);
    }

    try {
        // Count total questions without embeddings
        const total = await prisma.question.count({
            where: {
                deleted_at: null,
                embedding: null,
            },
        });

        console.log(`📈 Total questions without embeddings: ${total}\n`);

        if (total === 0) {
            console.log('✅ All questions already have embeddings!');
            return;
        }

        let totalProcessed = 0;
        let batchCount = 0;

        // Process in batches
        while (true) {
            batchCount++;
            console.log(`\n📦 Batch ${batchCount}:`);
            
            const processed = await backfillBatch();
            
            if (processed === 0) {
                break;
            }

            totalProcessed += processed;

            // Rate limiting: wait 1 second between batches
            if (processed === BATCH_SIZE) {
                console.log('⏳ Waiting 1 second before next batch...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✅ Backfill complete!`);
        console.log(`   Total questions processed: ${totalProcessed}`);
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
