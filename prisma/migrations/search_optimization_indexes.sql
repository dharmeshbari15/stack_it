-- Search Optimization Indexes Migration
-- Run this after enabling pg_trgm extension
-- Created: March 7, 2026

-- Enable PostgreSQL trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for title searching (case-insensitive)
-- Supports ILIKE queries on title field
CREATE INDEX IF NOT EXISTS idx_question_title_lower 
ON "Question" (LOWER(title));

-- Index for description searching (case-insensitive)
-- Supports ILIKE queries on description field
CREATE INDEX IF NOT EXISTS idx_question_description_lower 
ON "Question" (LOWER(description));

-- Trigram index for fuzzy title search (typo tolerance)
CREATE INDEX IF NOT EXISTS idx_question_title_trgm 
ON "Question" USING gin (title gin_trgm_ops);

-- Trigram index for fuzzy description search
CREATE INDEX IF NOT EXISTS idx_question_description_trgm 
ON "Question" USING gin (description gin_trgm_ops);

-- Tag name search optimization (trigram)
CREATE INDEX IF NOT EXISTS idx_tag_name_trgm 
ON "Tag" USING gin (name gin_trgm_ops);

-- Composite index for vote-based sorting
-- Optimizes: ORDER BY upvotes DESC, created_at DESC
CREATE INDEX IF NOT EXISTS idx_question_upvotes_created 
ON "Question" (upvotes DESC, created_at DESC) 
WHERE deleted_at IS NULL;

-- Active questions optimization
-- Optimizes: ORDER BY updated_at DESC
CREATE INDEX IF NOT EXISTS idx_question_updated 
ON "Question" (updated_at DESC) 
WHERE deleted_at IS NULL;

-- Unanswered questions optimization
-- Optimizes filtering for questions with no answers
CREATE INDEX IF NOT EXISTS idx_question_unanswered 
ON "Question" (created_at DESC) 
WHERE deleted_at IS NULL 
  AND accepted_answer_id IS NULL;

-- Tag filtering optimization
-- Speeds up JOIN queries for tag-based filtering
CREATE INDEX IF NOT EXISTS idx_question_tag_question_id 
ON "QuestionTag" (question_id);

CREATE INDEX IF NOT EXISTS idx_question_tag_tag_id 
ON "QuestionTag" (tag_id);

-- Composite index for tag + question lookups
CREATE INDEX IF NOT EXISTS idx_question_tag_composite 
ON "QuestionTag" (tag_id, question_id);

-- Answer count optimization for questions
CREATE INDEX IF NOT EXISTS idx_answer_question_id 
ON "Answer" (question_id) 
WHERE deleted_at IS NULL;

-- Vote aggregation optimization
CREATE INDEX IF NOT EXISTS idx_vote_question_id 
ON "Vote" (question_id);

-- Author filtering optimization
CREATE INDEX IF NOT EXISTS idx_question_author_id 
ON "Question" (author_id) 
WHERE deleted_at IS NULL;

-- Full-text search preparation (optional, for future enhancement)
-- Uncomment these if implementing PostgreSQL full-text search

/*
-- Add tsvector column for full-text search
ALTER TABLE "Question" 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update existing rows
UPDATE "Question" 
SET search_vector = 
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B');

-- Create trigger to auto-update search_vector
CREATE OR REPLACE FUNCTION question_search_vector_update() 
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER question_search_vector_trigger
BEFORE INSERT OR UPDATE ON "Question"
FOR EACH ROW
EXECUTE FUNCTION question_search_vector_update();

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_question_search_vector 
ON "Question" USING gin(search_vector);
*/

-- Analyze tables to update statistics
ANALYZE "Question";
ANALYZE "Tag";
ANALYZE "QuestionTag";
ANALYZE "Answer";
ANALYZE "Vote";

-- Verify indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('Question', 'Tag', 'QuestionTag', 'Answer', 'Vote')
  AND schemaname = 'public'
ORDER BY tablename, indexname;
