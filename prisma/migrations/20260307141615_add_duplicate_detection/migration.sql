-- CreateEnum
CREATE TYPE "DuplicateStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "duplicate_of_id" TEXT;

-- CreateTable
CREATE TABLE "QuestionEmbedding" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "model_version" VARCHAR(50) NOT NULL DEFAULT 'text-embedding-3-small',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateLink" (
    "id" TEXT NOT NULL,
    "duplicate_id" TEXT NOT NULL,
    "canonical_id" TEXT NOT NULL,
    "marked_by_id" TEXT NOT NULL,
    "similarity_score" DOUBLE PRECISION,
    "marked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "DuplicateLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionEmbedding_question_id_key" ON "QuestionEmbedding"("question_id");

-- CreateIndex
CREATE INDEX "QuestionEmbedding_question_id_idx" ON "QuestionEmbedding"("question_id");

-- CreateIndex
CREATE INDEX "QuestionEmbedding_created_at_idx" ON "QuestionEmbedding"("created_at");

-- CreateIndex
CREATE INDEX "DuplicateLink_duplicate_id_idx" ON "DuplicateLink"("duplicate_id");

-- CreateIndex
CREATE INDEX "DuplicateLink_canonical_id_idx" ON "DuplicateLink"("canonical_id");

-- CreateIndex
CREATE INDEX "DuplicateLink_marked_by_id_idx" ON "DuplicateLink"("marked_by_id");

-- CreateIndex
CREATE INDEX "DuplicateLink_marked_at_idx" ON "DuplicateLink"("marked_at");

-- CreateIndex
CREATE UNIQUE INDEX "DuplicateLink_duplicate_id_canonical_id_key" ON "DuplicateLink"("duplicate_id", "canonical_id");

-- CreateIndex
CREATE INDEX "Question_duplicate_of_id_idx" ON "Question"("duplicate_of_id");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_duplicate_of_id_fkey" FOREIGN KEY ("duplicate_of_id") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionEmbedding" ADD CONSTRAINT "QuestionEmbedding_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateLink" ADD CONSTRAINT "DuplicateLink_duplicate_id_fkey" FOREIGN KEY ("duplicate_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateLink" ADD CONSTRAINT "DuplicateLink_canonical_id_fkey" FOREIGN KEY ("canonical_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicateLink" ADD CONSTRAINT "DuplicateLink_marked_by_id_fkey" FOREIGN KEY ("marked_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
