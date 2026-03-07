# Duplicate Detection System - Implementation Roadmap

**Project**: Stack Overflow-like Application (stack_it)  
**Date**: March 7, 2026  
**Timeline**: 6 weeks  
**Team Size**: 2-3 developers

---

## Implementation Phases

### Phase 0: Setup & Infrastructure (Week 1)

**Goal**: Set up database, install dependencies, configure environment

#### Tasks

- [ ] **Database Setup**
  - [ ] Install pgvector extension on PostgreSQL
    ```sql
    CREATE EXTENSION IF NOT EXISTS vector;
    SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
    ```
  - [ ] Run database migrations (see `DUPLICATE_DETECTION_MIGRATIONS.sql`)
    - [ ] QuestionEmbedding table
    - [ ] DuplicateLink table
    - [ ] EmbeddingRetryQueue table
    - [ ] Indexes (HNSW, B-tree)
    - [ ] Helper functions (get_canonical_question_id, etc.)
    - [ ] Views (QuestionsWithoutEmbeddings, ActiveDuplicates, etc.)
  - [ ] Verify all migrations successful
    ```sql
    -- Check tables exist
    \dt QuestionEmbedding DuplicateLink EmbeddingRetryQueue
    
    -- Check indexes
    \di *Embedding* *Duplicate*
    
    -- Check functions
    \df get_canonical_question_id would_create_duplicate_cycle
    ```

- [ ] **Environment Configuration**
  - [ ] Add OpenAI API key to `.env.local`
    ```env
    OPENAI_API_KEY=sk-...
    DUPLICATE_SIMILARITY_THRESHOLD=0.85
    ```
  - [ ] (Optional) Set up Redis for caching/rate limiting
    ```env
    REDIS_URL=redis://localhost:6379
    ```
  - [ ] Verify environment variables loaded
    ```typescript
    console.log('OpenAI configured:', !!process.env.OPENAI_API_KEY);
    ```

- [ ] **Update Prisma Schema**
  - [ ] Add QuestionEmbedding model to `schema.prisma`
  - [ ] Add DuplicateLink model to `schema.prisma`
  - [ ] Add relations to Question and User models
  - [ ] Run `npx prisma generate` to regenerate client
  - [ ] Verify types available in IDE
    ```typescript
    import { QuestionEmbedding, DuplicateLink } from '@/generated/prisma/client';
    ```

- [ ] **Dependencies**
  - [ ] No new npm packages required (use native fetch API)
  - [ ] (Optional) Install rate limiting library if using Redis
    ```bash
    npm install @upstash/ratelimit @upstash/redis
    ```

**Deliverable**: Database ready, environment configured, Prisma client generated

---

### Phase 1: Service Layer Implementation (Week 2-3)

**Goal**: Implement core business logic (embeddings, similarity, duplicates)

#### Tasks

- [ ] **EmbeddingService** (`src/lib/services/embedding-service.ts`)
  - [ ] Implement `prepareQuestionText()` method
    - [ ] Strip HTML tags from description
    - [ ] Truncate to 500 chars
    - [ ] Format: "Title: X\n\nDescription: Y"
  - [ ] Implement `generateEmbedding()` method
    - [ ] Call OpenAI Embeddings API (text-embedding-3-small)
    - [ ] Handle errors (rate limits, timeouts, API errors)
    - [ ] Retry logic (3 attempts with exponential backoff)
  - [ ] (Optional) Implement caching layer
    - [ ] In-memory Map cache (LRU eviction)
    - [ ] OR Redis cache (if using Redis)
  - [ ] Write unit tests (80%+ coverage)
    - [ ] Test HTML stripping
    - [ ] Test truncation
    - [ ] Test error handling (mock OpenAI API)

- [ ] **SimilarityService** (`src/lib/services/similarity-service.ts`)
  - [ ] Implement `findSimilarQuestions()` method
    - [ ] Build pgvector query with cosine distance
    - [ ] Filter by threshold (default 0.85)
    - [ ] Join with Question, User, Answer tables
    - [ ] Fetch tags separately (performance optimization)
  - [ ] Implement `cosineSimilarity()` utility (for testing)
  - [ ] Write unit tests
    - [ ] Test vector validation (must be 1536 dims)
    - [ ] Test threshold filtering
  - [ ] Write integration tests
    - [ ] Generate real embedding, search database
    - [ ] Verify results sorted by similarity

- [ ] **DuplicateService** (`src/lib/services/duplicate-service.ts`)
  - [ ] Implement `markAsDuplicate()` method
    - [ ] Validation: Both questions exist
    - [ ] Validation: Canonical not already duplicate (no chaining)
    - [ ] Validation: No circular reference (A→B, B→A)
    - [ ] Validation: Not already marked as duplicate
    - [ ] Insert DuplicateLink record
  - [ ] Implement `unmarkDuplicate()` method
    - [ ] Soft delete: Set unmarked_at, unmarked_by
  - [ ] Implement `isDuplicate()` method
  - [ ] Implement `getDuplicateInfo()` method
  - [ ] Implement `getDuplicates()` method (get all duplicates of canonical)
  - [ ] Implement `getCanonicalQuestionId()` method (use DB function)
  - [ ] Write unit tests (mock Prisma client)
    - [ ] Test validations trigger errors
    - [ ] Test successful marking/unmarking
  - [ ] Write integration tests
    - [ ] Create test questions, mark as duplicate, verify links

**Deliverable**: All services implemented and tested

---

### Phase 2: API Endpoints (Week 3-4)

**Goal**: Expose services via REST API

#### Tasks

- [ ] **POST /api/v1/questions/check-similarity**
  - [ ] Create route file: `src/app/api/v1/questions/check-similarity/route.ts`
  - [ ] Validate request body (Zod schema)
    - [ ] title: string (min 10, max 255)
    - [ ] description: string (min 20, max 10000)
    - [ ] tags: string[] (optional)
  - [ ] Rate limiting middleware
    - [ ] Unauthenticated: 10 req/min per IP
    - [ ] Authenticated: 30 req/min per user
  - [ ] Call EmbeddingService.generateEmbedding()
  - [ ] Call SimilarityService.findSimilarQuestions()
  - [ ] Return similar questions with similarity scores
  - [ ] Handle errors gracefully (return 400/429/503)
  - [ ] Add logging (timing, errors)
  - [ ] Test with Postman/curl
    ```bash
    curl -X POST http://localhost:3000/api/v1/questions/check-similarity \
      -H "Content-Type: application/json" \
      -d '{"title":"How to reverse array?","description":"I need to reverse an array in JavaScript"}'
    ```

- [ ] **POST /api/v1/questions/:id/mark-duplicate**
  - [ ] Create route file: `src/app/api/v1/questions/[id]/mark-duplicate/route.ts`
  - [ ] Authentication check (must be logged in)
  - [ ] Authorization check (must be MODERATOR or ADMIN)
  - [ ] Validate request body
    - [ ] canonical_id: string (UUID)
    - [ ] reason: string (optional)
  - [ ] Call DuplicateService.markAsDuplicate()
  - [ ] Return success response with canonical question info
  - [ ] Handle errors (400/401/403/404/409)
  - [ ] Test as moderator
    ```bash
    curl -X POST http://localhost:3000/api/v1/questions/abc123/mark-duplicate \
      -H "Authorization: Bearer {token}" \
      -H "Content-Type: application/json" \
      -d '{"canonical_id":"def456","reason":"Same question"}'
    ```

- [ ] **DELETE /api/v1/questions/:id/mark-duplicate**
  - [ ] Same route file, add DELETE handler
  - [ ] Authentication/authorization checks
  - [ ] Call DuplicateService.unmarkDuplicate()
  - [ ] Return success response
  - [ ] Test as moderator

- [ ] **Enhance GET /api/v1/questions/:id**
  - [ ] Modify existing route: `src/app/api/v1/questions/[id]/route.ts`
  - [ ] Call DuplicateService.getDuplicateInfo(questionId)
  - [ ] Include duplicate info in response (if applicable)
    ```typescript
    {
      ...question,
      duplicate_info: {
        is_duplicate: true,
        canonical_question: {...},
        marked_at: "...",
        marked_by: {...},
        reason: "..."
      }
    }
    ```
  - [ ] If canonical, include duplicates array
  - [ ] Test by fetching duplicate question

- [ ] **POST /api/v1/admin/embeddings/generate** (background job endpoint)
  - [ ] Create route file: `src/app/api/v1/admin/embeddings/generate/route.ts`
  - [ ] Admin-only authorization check
  - [ ] Accept filter params (batch_size, created_after, tag)
  - [ ] Find questions without embeddings
  - [ ] Return 202 Accepted with job info (or run synchronously if small batch)
  - [ ] Process questions in batches (rate limiting)
  - [ ] Log progress
  - [ ] Test by triggering backfill

**Deliverable**: All API endpoints functional and tested

---

### Phase 3: Embedding Backfill (Week 3)

**Goal**: Generate embeddings for all existing questions

#### Tasks

- [ ] **Create Backfill Script**
  - [ ] Create file: `prisma/scripts/backfill-embeddings.ts`
  - [ ] Query questions without embeddings (paginated, 100 at a time)
  - [ ] For each question:
    - [ ] Generate embedding (EmbeddingService)
    - [ ] Insert QuestionEmbedding record
    - [ ] Handle errors (add to retry queue)
    - [ ] Rate limiting (sleep 20ms between requests)
  - [ ] Log progress (console.log every 10 questions)
  - [ ] Estimate time: 100K questions × 20ms = 33 minutes
  - [ ] Run script
    ```bash
    npx tsx prisma/scripts/backfill-embeddings.ts
    ```

- [ ] **Monitor Backfill Progress**
  - [ ] Query view: `QuestionsWithoutEmbeddings`
    ```sql
    SELECT COUNT(*) FROM "QuestionsWithoutEmbeddings";
    ```
  - [ ] Check for errors in EmbeddingRetryQueue
    ```sql
    SELECT * FROM "EmbeddingRetryQueue" ORDER BY retry_count DESC;
    ```
  - [ ] Manually retry failed embeddings (or set up cron job)

- [ ] **Create Cron Job for Retry Queue**
  - [ ] Create file: `prisma/scripts/retry-failed-embeddings.ts`
  - [ ] Query EmbeddingRetryQueue (retry_count < 5)
  - [ ] Retry embedding generation
  - [ ] Delete from queue if successful, otherwise increment retry_count
  - [ ] Schedule cron job (every hour)
    ```bash
    # Add to crontab or use Vercel cron jobs
    0 * * * * npx tsx prisma/scripts/retry-failed-embeddings.ts
    ```

**Deliverable**: All existing questions have embeddings

---

### Phase 4: Frontend Integration (Week 4-5)

**Goal**: Build UI components for duplicate detection

#### Tasks

- [ ] **useDebounce Hook** (`src/hooks/useDebounce.ts`)
  - [ ] Implement generic debounce hook
    ```typescript
    export function useDebounce<T>(value: T, delay: number): T {
      const [debouncedValue, setDebouncedValue] = useState(value);
      useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
      }, [value, delay]);
      return debouncedValue;
    }
    ```

- [ ] **Enhance AskQuestionForm**
  - [ ] File: `src/components/AskQuestionForm.tsx` (or create if doesn't exist)
  - [ ] Add state for similar questions
    ```typescript
    const [similarQuestions, setSimilarQuestions] = useState<SimilarQuestion[]>([]);
    ```
  - [ ] Debounce title and description (1000ms)
  - [ ] useEffect: Call /api/v1/questions/check-similarity when debounced values change
    - [ ] Only trigger if title > 10 chars AND description > 20 chars
  - [ ] Display "Similar questions found" panel
    - [ ] Show top 5 results
    - [ ] Color-coded badges (0.95+: red, 0.90-0.94: orange, 0.85-0.89: yellow)
    - [ ] Similarity percentage (0-100%)
    - [ ] "This answered my question" button (redirect to question)
  - [ ] Loading spinner while checking
  - [ ] Test: Type question, wait 1 second, see suggestions appear

- [ ] **Enhance Question Detail Page**
  - [ ] File: `src/app/questions/[id]/page.tsx`
  - [ ] Fetch question with duplicate info (GET /api/v1/questions/:id)
  - [ ] If `duplicate_info.is_duplicate`:
    - [ ] Show alert banner: "This question is a duplicate"
    - [ ] Display canonical question title and link
    - [ ] Show marked_at, marked_by, reason
    - [ ] "View Original Question" button
  - [ ] If canonical (has duplicates):
    - [ ] Show "Duplicates of this question" section
    - [ ] List duplicate questions with links
  - [ ] Test: Navigate to duplicate question, see banner

- [ ] **ModeratorActions Component**
  - [ ] Create file: `src/components/ModeratorActions.tsx`
  - [ ] Props: `questionId`, `isModerator`, `isDuplicate`
  - [ ] Show "Mark as Duplicate" button (only if moderator and not duplicate)
  - [ ] Modal with:
    - [ ] Autocomplete search for canonical question (use existing search endpoint)
    - [ ] Reason text field (optional)
    - [ ] Confirmation button
  - [ ] Call POST /api/v1/questions/:id/mark-duplicate
  - [ ] Show success/error toast
  - [ ] Test as moderator: Mark question as duplicate

- [ ] **Visual Similarity Indicators**
  - [ ] Create utility function: `getSimilarityBadge(similarity: number)`
    - [ ] Returns badge component with color and text
  - [ ] Use in AskQuestionForm and anywhere similar questions displayed

**Deliverable**: Full UI flow for duplicate detection

---

### Phase 5: Testing & QA (Week 5)

**Goal**: Ensure system works correctly, performance is acceptable

#### Tasks

- [ ] **Unit Tests**
  - [ ] EmbeddingService: 80%+ coverage
  - [ ] SimilarityService: 80%+ coverage
  - [ ] DuplicateService: 80%+ coverage
  - [ ] API routes: Test error cases
  - [ ] Run: `npm test`

- [ ] **Integration Tests**
  - [ ] End-to-end: Create question → similarity check → mark duplicate → view duplicate
  - [ ] Test all API endpoints with real database
  - [ ] Test edge cases:
    - [ ] Circular duplicates (should reject)
    - [ ] Canonical is duplicate (should reject)
    - [ ] Question already duplicate (should reject)
    - [ ] Canonical deleted (promote oldest duplicate)

- [ ] **Performance Testing**
  - [ ] Load test: 100 concurrent similarity checks
    ```bash
    # Use artillery or k6
    artillery quick --count 100 --num 10 http://localhost:3000/api/v1/questions/check-similarity
    ```
  - [ ] Verify p95 latency < 500ms
  - [ ] Check database query performance
    ```sql
    EXPLAIN ANALYZE
    SELECT ...
    FROM "QuestionEmbedding" qe
    WHERE 1 - (qe.embedding <=> '[...]'::vector(1536)) >= 0.85
    ORDER BY qe.embedding <=> '[...]'::vector(1536) ASC
    LIMIT 5;
    ```
  - [ ] Verify HNSW index used (should see "Index Scan using hnsw")

- [ ] **Manual QA**
  - [ ] Create test questions with known duplicates
  - [ ] Verify similarity suggestions appear in real-time
  - [ ] Test marking as duplicate (as moderator)
  - [ ] Test unmarking duplicate (as moderator)
  - [ ] Verify duplicate banner shows on question page
  - [ ] Test on mobile (responsive design)

- [ ] **Error Handling**
  - [ ] Simulate OpenAI API failure (invalid API key)
  - [ ] Verify graceful degradation (question still created, no embedding)
  - [ ] Check retry queue populated
  - [ ] Test rate limiting (exceed 10 req/min as unauthenticated)

**Deliverable**: System tested and working correctly

---

### Phase 6: Moderator Training & Beta Launch (Week 5-6)

**Goal**: Train moderators, beta test with limited audience

#### Tasks

- [ ] **Moderator Documentation**
  - [ ] Write guide: "How to Use Duplicate Detection"
    - [ ] When to mark duplicates (vs. close as off-topic)
    - [ ] How to choose canonical question (oldest, best answered, highest score)
    - [ ] What to write in "reason" field
  - [ ] Create video walkthrough (5 minutes)

- [ ] **Moderator Training Session**
  - [ ] Schedule 1-hour training call with moderators
  - [ ] Demo duplicate detection workflow
  - [ ] Practice marking duplicates (test data)
  - [ ] Answer questions

- [ ] **Beta Launch (Moderators Only)**
  - [ ] Enable feature for moderators only (feature flag)
    ```typescript
    const canSeeDuplicateDetection = user.role === 'MODERATOR' || user.role === 'ADMIN';
    ```
  - [ ] Monitor usage for 1 week
  - [ ] Collect feedback via survey
  - [ ] Fix bugs reported by moderators
  - [ ] Tune similarity threshold if needed (based on false positive rate)

- [ ] **Analytics Dashboard**
  - [ ] Create admin page: `/admin/duplicates`
  - [ ] Show metrics:
    - [ ] Total duplicates marked (last 30 days)
    - [ ] Top moderators (by # duplicates marked)
    - [ ] Average similarity score when marking
    - [ ] False positive rate (if tracked)
  - [ ] Use views: `ModeratorDuplicateStats`, `ActiveDuplicates`

**Deliverable**: Moderators trained, feature beta tested

---

### Phase 7: Public Launch (Week 6)

**Goal**: Enable for all users, announce feature, monitor performance

#### Tasks

- [ ] **Enable for All Users**
  - [ ] Remove feature flag (or set to `true` for all)
  - [ ] Verify rate limiting works (10 req/min for unauthenticated)

- [ ] **Announcement**
  - [ ] Write blog post: "Introducing Duplicate Question Detection"
  - [ ] In-app notification: "New feature: See similar questions while asking"
  - [ ] Social media announcement

- [ ] **Monitoring & Alerts**
  - [ ] Set up Grafana dashboard (or equivalent)
    - [ ] Similarity check requests/min
    - [ ] Embedding generation success/failure rate
    - [ ] Duplicate marking rate
    - [ ] OpenAI API cost/day
    - [ ] Database query latency (p95)
  - [ ] Configure alerts (Slack or PagerDuty)
    - [ ] Embedding failure rate > 5%
    - [ ] Similarity check latency p95 > 1000ms
    - [ ] OpenAI API cost > $5/day (budget alert)
    - [ ] Database query latency p95 > 500ms

- [ ] **User Feedback Collection**
  - [ ] Add "Was this helpful?" button on similar questions panel
  - [ ] Track clicks: "This answered my question" (true positive)
  - [ ] Track submissions despite high similarity (possible false positive)

- [ ] **Iteration Plan**
  - [ ] Review metrics after 1 week
  - [ ] Tune similarity threshold if needed (0.85 → 0.87?)
  - [ ] Plan Phase 2 features (tag-weighted similarity, user feedback loop)

**Deliverable**: Feature live in production, metrics tracking

---

## Rollback Plan (If Things Go Wrong)

### Quick Rollback

1. **Disable real-time checks** (if causing performance issues)
   ```typescript
   // In AskQuestionForm.tsx
   const SIMILARITY_CHECK_ENABLED = false;  // Feature flag
   ```

2. **Disable embedding generation** (if OpenAI API issues)
   ```typescript
   // In question creation route
   if (process.env.ENABLE_EMBEDDINGS !== 'true') {
     console.log('Embeddings disabled, skipping');
     return;
   }
   ```

3. **Revert database changes** (last resort)
   ```sql
   -- Save data first
   CREATE TABLE "DuplicateLink_backup" AS SELECT * FROM "DuplicateLink";
   
   -- Drop tables (cascades to foreign keys)
   DROP TABLE "QuestionEmbedding" CASCADE;
   DROP TABLE "DuplicateLink" CASCADE;
   ```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Duplicate detection rate** | 40%+ of duplicates found | # questions marked / # total questions |
| **User satisfaction** | 80%+ "helpful" rating | Survey: "Was this feature helpful?" |
| **False positive rate** | <15% | # "Not helpful" / # suggestions shown |
| **API latency (p95)** | <500ms | Monitoring dashboard |
| **Embedding generation success rate** | >95% | # successes / # attempts |
| **OpenAI API cost** | <$50/month | OpenAI usage dashboard |

---

## Post-Launch: Phase 2 Features (Future)

### Planned Enhancements

1. **Tag-Weighted Similarity** (Week 7-8)
   - Boost similarity score when questions share tags
   - Formula: `adjusted = base * (1 + 0.1 × shared_tags / total_tags)`

2. **User Feedback Loop** (Week 8-9)
   - Track: User clicks "This answered my question"
   - Track: User submits despite high similarity warning
   - Use data to tune threshold dynamically

3. **Auto-Suggest on Submit** (Week 9-10)
   - If similarity ≥ 0.95, block submission
   - Require user to confirm "This is not a duplicate"

4. **Bulk Duplicate Management** (Week 10-11)
   - Admin dashboard: View all duplicate clusters
   - Approve/reject moderator markings
   - Merge answers from duplicate to canonical

5. **Multi-Language Support** (Future)
   - Use OpenAI `text-embedding-3-multilingual`
   - Cross-lingual duplicate detection

---

## Team Assignments (Suggested)

### Backend Developer
- [ ] Service layer implementation (EmbeddingService, SimilarityService, DuplicateService)
- [ ] API endpoints
- [ ] Database migrations
- [ ] Backfill script
- [ ] Unit/integration tests

### Frontend Developer
- [ ] UI components (AskQuestionForm, ModeratorActions)
- [ ] Duplicate banner on question detail page
- [ ] Visual similarity indicators
- [ ] Rate limiting UI (show "Please wait" message)

### DevOps / Full-Stack
- [ ] Database setup (pgvector installation)
- [ ] Environment configuration
- [ ] Monitoring dashboard (Grafana)
- [ ] Performance testing
- [ ] Deployment

### Product Manager / Lead
- [ ] Moderator training
- [ ] Documentation
- [ ] Announcement
- [ ] Collect feedback
- [ ] Decide on Phase 2 priorities

---

## Risk Mitigation

### Risk 1: OpenAI API Downtime
**Impact**: Embeddings can't be generated  
**Mitigation**:
- Fail gracefully; question still created
- Add to retry queue (process when API back up)
- Display message: "Duplicate detection temporarily unavailable"

### Risk 2: pgvector Performance Degradation
**Impact**: Slow similarity searches  
**Mitigation**:
- Monitor query latency (alert if p95 > 500ms)
- Tune HNSW index parameters (`m`, `ef_construction`)
- Add read replicas for similarity searches
- Plan migration to Pinecone if scale requires (deferred)

### Risk 3: High False Positive Rate
**Impact**: Users frustrated by irrelevant suggestions  
**Mitigation**:
- Start with conservative threshold (0.85)
- Collect user feedback ("Was this helpful?")
- Tune threshold based on data (increase to 0.87-0.90 if too noisy)

### Risk 4: Moderator Abuse/Mistakes
**Impact**: Questions incorrectly marked as duplicate  
**Mitigation**:
- Audit log all duplicate markings
- "Unmark duplicate" feature (soft delete)
- Review moderator stats (flag unusual activity)
- Contest system for users to appeal (future)

---

## Communication Plan

### Weekly Updates
Send to stakeholders every Friday:
- [ ] Progress update (tasks completed)
- [ ] Blockers (if any)
- [ ] Next week's plan
- [ ] Metrics (once live)

### Launch Announcement
- [ ] Internal: Email to team 1 week before launch
- [ ] Moderators: Training session 1 week before launch
- [ ] Users: In-app notification on launch day
- [ ] Public: Blog post + social media on launch day

---

**END OF IMPLEMENTATION ROADMAP**

---

## Quick Start Checklist (TL;DR)

For the impatient developer, here's the absolute minimum to get started:

1. ✅ Install pgvector: `CREATE EXTENSION IF NOT EXISTS vector;`
2. ✅ Run migrations: `psql < docs/DUPLICATE_DETECTION_MIGRATIONS.sql`
3. ✅ Add OpenAI API key to `.env`: `OPENAI_API_KEY=sk-...`
4. ✅ Build EmbeddingService (`src/lib/services/embedding-service.ts`)
5. ✅ Build SimilarityService (`src/lib/services/similarity-service.ts`)
6. ✅ Build API endpoint: `POST /api/v1/questions/check-similarity`
7. ✅ Test: `curl -X POST ... -d '{"title":"...","description":"..."}'`
8. ✅ Build frontend: Enhance AskQuestionForm with similarity panel
9. ✅ Backfill embeddings: `npx tsx prisma/scripts/backfill-embeddings.ts`
10. ✅ Launch! 🚀

Good luck! 🎉
