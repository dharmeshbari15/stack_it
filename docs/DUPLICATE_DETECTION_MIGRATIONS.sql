-- ============================================================================
-- DUPLICATE QUESTION DETECTION SYSTEM - DATABASE MIGRATIONS
-- ============================================================================
-- Project: Stack Overflow-like Application (stack_it)
-- Date: March 7, 2026
-- Purpose: SQL migrations for duplicate detection feature
--
-- EXECUTION ORDER:
--   1. Enable pgvector extension
--   2. Create QuestionEmbedding table
--   3. Create DuplicateLink table
--   4. Create indexes for performance
--   5. Create retry queue for failed embeddings
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MIGRATION 1: Enable pgvector Extension
-- ----------------------------------------------------------------------------
-- Run this first to enable vector similarity search in PostgreSQL

CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
-- Expected output: vector | 0.5.0 (or higher)


-- ----------------------------------------------------------------------------
-- MIGRATION 2: Create QuestionEmbedding Table
-- ----------------------------------------------------------------------------
-- Stores vector embeddings (1536 dimensions) for each question
-- One-to-one relationship: Each question has 0 or 1 embedding

CREATE TABLE "QuestionEmbedding" (
  "id" TEXT NOT NULL,
  "question_id" TEXT NOT NULL,
  "embedding" vector(1536) NOT NULL,  -- OpenAI text-embedding-3-small (1536 dims)
  "model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  "token_count" INTEGER,  -- Num tokens used (for cost tracking)
  "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "QuestionEmbedding_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "QuestionEmbedding_question_id_key" UNIQUE ("question_id"),
  CONSTRAINT "QuestionEmbedding_question_id_fkey" 
    FOREIGN KEY ("question_id") 
    REFERENCES "Question"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

-- Standard B-tree index for question_id lookups
CREATE INDEX "QuestionEmbedding_question_id_idx" 
  ON "QuestionEmbedding"("question_id");

-- HNSW index for fast approximate nearest neighbor search
-- Parameters:
--   m = 16: Number of bi-directional links per node (higher = better recall, larger index)
--   ef_construction = 64: Size of dynamic candidate list during index build (higher = better quality, slower build)
-- Trade-off: These are balanced defaults; tune if needed
CREATE INDEX "QuestionEmbedding_embedding_hnsw_idx" 
  ON "QuestionEmbedding" 
  USING hnsw (embedding vector_cosine_ops) 
  WITH (m = 16, ef_construction = 64);

-- Performance tuning (OPTIONAL - uncomment if search is slow):
-- SET hnsw.ef_search = 40;  -- Default is 40; increase for better recall (slower search)

COMMENT ON TABLE "QuestionEmbedding" IS 'Vector embeddings for similarity search of questions';
COMMENT ON COLUMN "QuestionEmbedding"."embedding" IS '1536-dimensional vector from OpenAI text-embedding-3-small';
COMMENT ON INDEX "QuestionEmbedding_embedding_hnsw_idx" IS 'HNSW index for fast cosine similarity search';


-- ----------------------------------------------------------------------------
-- MIGRATION 3: Create DuplicateLink Table
-- ----------------------------------------------------------------------------
-- Represents one-to-one duplicate relationships
-- Each duplicate question points to exactly one canonical question

CREATE TABLE "DuplicateLink" (
  "id" TEXT NOT NULL,
  "duplicate_id" TEXT NOT NULL,      -- Question marked as duplicate
  "canonical_id" TEXT NOT NULL,      -- The "original" question (can have many duplicates)
  "marked_by" TEXT NOT NULL,         -- User ID of moderator who marked it
  "marked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason" TEXT,                     -- Optional explanation (shown to users)
  "similarity_score" DOUBLE PRECISION,  -- Cosine similarity at time of marking (for analytics)
  "unmarked_at" TIMESTAMP(3),        -- NULL if active; set when unmarked (soft delete)
  "unmarked_by" TEXT,                -- User ID of moderator who unmarked it
  "unmarked_reason" TEXT,            -- Optional explanation for unmarking
  
  CONSTRAINT "DuplicateLink_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DuplicateLink_duplicate_id_key" UNIQUE ("duplicate_id"),  -- Each Q is duplicate of at most 1
  CONSTRAINT "DuplicateLink_duplicate_id_fkey" 
    FOREIGN KEY ("duplicate_id") 
    REFERENCES "Question"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT "DuplicateLink_canonical_id_fkey" 
    FOREIGN KEY ("canonical_id") 
    REFERENCES "Question"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT "DuplicateLink_marked_by_fkey" 
    FOREIGN KEY ("marked_by") 
    REFERENCES "User"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT "DuplicateLink_unmarked_by_fkey" 
    FOREIGN KEY ("unmarked_by") 
    REFERENCES "User"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE,
  CONSTRAINT "DuplicateLink_different_questions_check" 
    CHECK ("duplicate_id" != "canonical_id")  -- Prevent Q being duplicate of itself
);

-- Index for fast lookups: "Is this question a duplicate?"
CREATE INDEX "DuplicateLink_duplicate_id_idx" 
  ON "DuplicateLink"("duplicate_id");

-- Index for fast lookups: "What questions are duplicates of this one?"
CREATE INDEX "DuplicateLink_canonical_id_idx" 
  ON "DuplicateLink"("canonical_id");

-- Index for analytics: Recent duplicate markings
CREATE INDEX "DuplicateLink_marked_at_idx" 
  ON "DuplicateLink"("marked_at");

-- Index for analytics: Moderator activity
CREATE INDEX "DuplicateLink_marked_by_idx" 
  ON "DuplicateLink"("marked_by");

-- Partial index: Only active duplicates (excludes unmarked)
CREATE INDEX "DuplicateLink_active_idx" 
  ON "DuplicateLink"("canonical_id") 
  WHERE "unmarked_at" IS NULL;

COMMENT ON TABLE "DuplicateLink" IS 'One-to-one duplicate question relationships';
COMMENT ON COLUMN "DuplicateLink"."duplicate_id" IS 'Question that is a duplicate (unique constraint ensures 1-to-1)';
COMMENT ON COLUMN "DuplicateLink"."canonical_id" IS 'The original question (can have many duplicates pointing to it)';
COMMENT ON CONSTRAINT "DuplicateLink_different_questions_check" ON "DuplicateLink" IS 'Prevent question from being duplicate of itself';


-- ----------------------------------------------------------------------------
-- MIGRATION 4: Create EmbeddingRetryQueue Table
-- ----------------------------------------------------------------------------
-- Tracks questions where embedding generation failed (for retry cron job)

CREATE TABLE "EmbeddingRetryQueue" (
  "id" TEXT NOT NULL,
  "question_id" TEXT NOT NULL,
  "retry_count" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_retry_at" TIMESTAMP(3),
  
  CONSTRAINT "EmbeddingRetryQueue_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EmbeddingRetryQueue_question_id_key" UNIQUE ("question_id"),
  CONSTRAINT "EmbeddingRetryQueue_question_id_fkey" 
    FOREIGN KEY ("question_id") 
    REFERENCES "Question"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
  CONSTRAINT "EmbeddingRetryQueue_max_retries_check" 
    CHECK ("retry_count" <= 10)  -- Prevent infinite retries
);

CREATE INDEX "EmbeddingRetryQueue_retry_count_idx" 
  ON "EmbeddingRetryQueue"("retry_count");

COMMENT ON TABLE "EmbeddingRetryQueue" IS 'Queue of questions with failed embedding generation (for retry cron job)';


-- ----------------------------------------------------------------------------
-- MIGRATION 5: Helper Functions
-- ----------------------------------------------------------------------------

-- Function: Get canonical question for a given question (follows duplicate chain)
CREATE OR REPLACE FUNCTION get_canonical_question_id(p_question_id TEXT)
RETURNS TEXT AS $$
DECLARE
  v_canonical_id TEXT;
  v_visited TEXT[] := ARRAY[]::TEXT[];
  v_max_depth INTEGER := 10;
  v_depth INTEGER := 0;
BEGIN
  v_canonical_id := p_question_id;
  
  -- Follow duplicate chain until we find canonical (or detect cycle)
  LOOP
    -- Check if we've visited this ID (cycle detection)
    IF v_canonical_id = ANY(v_visited) THEN
      RAISE EXCEPTION 'Circular duplicate detected: %', v_visited;
    END IF;
    
    -- Check max depth (prevent infinite loops)
    IF v_depth >= v_max_depth THEN
      RAISE EXCEPTION 'Max duplicate chain depth exceeded';
    END IF;
    
    v_visited := array_append(v_visited, v_canonical_id);
    v_depth := v_depth + 1;
    
    -- Check if current question is a duplicate
    SELECT canonical_id INTO v_canonical_id
    FROM "DuplicateLink"
    WHERE duplicate_id = v_canonical_id
      AND unmarked_at IS NULL;
    
    -- If no duplicate link found, we've reached the canonical
    IF NOT FOUND THEN
      RETURN v_visited[array_length(v_visited, 1)];
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_canonical_question_id IS 'Traverses duplicate chain to find canonical question ID (with cycle detection)';


-- Function: Check if marking as duplicate would create a cycle
CREATE OR REPLACE FUNCTION would_create_duplicate_cycle(
  p_duplicate_id TEXT,
  p_canonical_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- If canonical itself is a duplicate, reject (no chaining: A→B→C)
  IF EXISTS (
    SELECT 1 FROM "DuplicateLink" 
    WHERE duplicate_id = p_canonical_id 
      AND unmarked_at IS NULL
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- If duplicate has other questions pointing to it, need to check transitivity
  IF EXISTS (
    SELECT 1 FROM "DuplicateLink" 
    WHERE canonical_id = p_duplicate_id 
      AND unmarked_at IS NULL
      AND duplicate_id = p_canonical_id
  ) THEN
    RETURN TRUE;  -- Direct cycle: A→B, B→A
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION would_create_duplicate_cycle IS 'Returns TRUE if marking would create a circular duplicate relationship';


-- ----------------------------------------------------------------------------
-- MIGRATION 6: Views for Analytics & Monitoring
-- ----------------------------------------------------------------------------

-- View: Questions without embeddings (for monitoring)
CREATE OR REPLACE VIEW "QuestionsWithoutEmbeddings" AS
SELECT 
  q.id,
  q.title,
  q.created_at,
  q.author_id,
  CASE 
    WHEN erq.question_id IS NOT NULL THEN 'IN_RETRY_QUEUE'
    ELSE 'PENDING'
  END AS status,
  erq.retry_count,
  erq.last_error
FROM "Question" q
LEFT JOIN "QuestionEmbedding" qe ON qe.question_id = q.id
LEFT JOIN "EmbeddingRetryQueue" erq ON erq.question_id = q.id
WHERE q.deleted_at IS NULL
  AND qe.id IS NULL;

COMMENT ON VIEW "QuestionsWithoutEmbeddings" IS 'Questions that need embedding generation (for monitoring dashboard)';


-- View: Active duplicate links (excludes unmarked)
CREATE OR REPLACE VIEW "ActiveDuplicates" AS
SELECT 
  dl.id,
  dl.duplicate_id,
  dl.canonical_id,
  dl.marked_by,
  dl.marked_at,
  dl.reason,
  dl.similarity_score,
  q_dup.title AS duplicate_title,
  q_can.title AS canonical_title,
  u.username AS marked_by_username
FROM "DuplicateLink" dl
JOIN "Question" q_dup ON q_dup.id = dl.duplicate_id
JOIN "Question" q_can ON q_can.id = dl.canonical_id
JOIN "User" u ON u.id = dl.marked_by
WHERE dl.unmarked_at IS NULL
  AND q_dup.deleted_at IS NULL
  AND q_can.deleted_at IS NULL;

COMMENT ON VIEW "ActiveDuplicates" IS 'Active duplicate relationships with question titles (for admin dashboard)';


-- View: Duplicate statistics by moderator
CREATE OR REPLACE VIEW "ModeratorDuplicateStats" AS
SELECT 
  u.id AS user_id,
  u.username,
  COUNT(CASE WHEN dl.unmarked_at IS NULL THEN 1 END) AS active_duplicates_marked,
  COUNT(CASE WHEN dl.unmarked_at IS NOT NULL THEN 1 END) AS duplicates_unmarked,
  COUNT(*) AS total_actions,
  MIN(dl.marked_at) AS first_action,
  MAX(dl.marked_at) AS last_action
FROM "User" u
LEFT JOIN "DuplicateLink" dl ON dl.marked_by = u.id
WHERE u.role IN ('MODERATOR', 'ADMIN')
GROUP BY u.id, u.username;

COMMENT ON VIEW "ModeratorDuplicateStats" IS 'Moderator activity statistics for duplicate marking';


-- ----------------------------------------------------------------------------
-- MIGRATION 7: Sample Queries (for testing)
-- ----------------------------------------------------------------------------

-- Query 1: Find top 5 similar questions to a given embedding
-- Replace $1 with actual embedding vector
/*
SELECT 
  q.id,
  q.title,
  q.description,
  q.score,
  1 - (qe.embedding <=> $1::vector(1536)) AS similarity,
  (SELECT COUNT(*) FROM "Answer" WHERE question_id = q.id AND deleted_at IS NULL) AS answer_count
FROM "QuestionEmbedding" qe
JOIN "Question" q ON q.id = qe.question_id
WHERE 
  q.deleted_at IS NULL
  AND 1 - (qe.embedding <=> $1::vector(1536)) >= 0.85  -- Similarity threshold
ORDER BY qe.embedding <=> $1::vector(1536) ASC
LIMIT 5;
*/


-- Query 2: Get duplicate info for a question
/*
SELECT 
  dl.canonical_id,
  q.title AS canonical_title,
  dl.marked_at,
  dl.reason,
  u.username AS marked_by
FROM "DuplicateLink" dl
JOIN "Question" q ON q.id = dl.canonical_id
JOIN "User" u ON u.id = dl.marked_by
WHERE dl.duplicate_id = $1
  AND dl.unmarked_at IS NULL;
*/


-- Query 3: Get all duplicates of a canonical question
/*
SELECT 
  dl.duplicate_id,
  q.title AS duplicate_title,
  dl.marked_at,
  dl.similarity_score
FROM "DuplicateLink" dl
JOIN "Question" q ON q.id = dl.duplicate_id
WHERE dl.canonical_id = $1
  AND dl.unmarked_at IS NULL
ORDER BY dl.marked_at DESC;
*/


-- Query 4: Check if question is a duplicate (optimized for frontend)
/*
SELECT 
  EXISTS (
    SELECT 1 FROM "DuplicateLink" 
    WHERE duplicate_id = $1 AND unmarked_at IS NULL
  ) AS is_duplicate;
*/


-- ----------------------------------------------------------------------------
-- ROLLBACK INSTRUCTIONS (if needed)
-- ----------------------------------------------------------------------------

/*
-- To rollback all changes (USE WITH CAUTION):

DROP VIEW IF EXISTS "ModeratorDuplicateStats" CASCADE;
DROP VIEW IF EXISTS "ActiveDuplicates" CASCADE;
DROP VIEW IF EXISTS "QuestionsWithoutEmbeddings" CASCADE;

DROP FUNCTION IF EXISTS would_create_duplicate_cycle CASCADE;
DROP FUNCTION IF EXISTS get_canonical_question_id CASCADE;

DROP TABLE IF EXISTS "EmbeddingRetryQueue" CASCADE;
DROP TABLE IF EXISTS "DuplicateLink" CASCADE;
DROP TABLE IF EXISTS "QuestionEmbedding" CASCADE;

DROP EXTENSION IF EXISTS vector CASCADE;
*/


-- ----------------------------------------------------------------------------
-- POST-MIGRATION VERIFICATION
-- ----------------------------------------------------------------------------

-- Check pgvector extension is installed
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('QuestionEmbedding', 'DuplicateLink', 'EmbeddingRetryQueue');

-- Check indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('QuestionEmbedding', 'DuplicateLink')
ORDER BY tablename, indexname;

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_canonical_question_id', 'would_create_duplicate_cycle');

-- Check views exist
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('QuestionsWithoutEmbeddings', 'ActiveDuplicates', 'ModeratorDuplicateStats');

-- ============================================================================
-- END OF MIGRATIONS
-- ============================================================================
