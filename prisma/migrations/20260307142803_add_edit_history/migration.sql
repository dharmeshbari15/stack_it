-- CreateTable
CREATE TABLE "QuestionVersion" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[],
    "edited_by_id" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edit_reason" VARCHAR(500),

    CONSTRAINT "QuestionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerVersion" (
    "id" TEXT NOT NULL,
    "answer_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "edited_by_id" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edit_reason" VARCHAR(500),

    CONSTRAINT "AnswerVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestionVersion_question_id_edited_at_idx" ON "QuestionVersion"("question_id", "edited_at");

-- CreateIndex
CREATE INDEX "QuestionVersion_edited_by_id_idx" ON "QuestionVersion"("edited_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionVersion_question_id_version_number_key" ON "QuestionVersion"("question_id", "version_number");

-- CreateIndex
CREATE INDEX "AnswerVersion_answer_id_edited_at_idx" ON "AnswerVersion"("answer_id", "edited_at");

-- CreateIndex
CREATE INDEX "AnswerVersion_edited_by_id_idx" ON "AnswerVersion"("edited_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerVersion_answer_id_version_number_key" ON "AnswerVersion"("answer_id", "version_number");

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_edited_by_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerVersion" ADD CONSTRAINT "AnswerVersion_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerVersion" ADD CONSTRAINT "AnswerVersion_edited_by_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
