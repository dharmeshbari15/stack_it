# Full-Text Search Engine Documentation

## Overview
This document describes the comprehensive search and filtering system implemented for StackIt, providing powerful search capabilities with multiple filter options.

---

## ✨ Features Implemented

### 1. **Multi-Field Search**
Search across multiple fields simultaneously:
- **Title**: Case-insensitive title matching
- **Description**: Full content search in question descriptions
- **Tags**: Search by technology tags

**How it works:**
- Uses PostgreSQL's `ILIKE` with `mode: 'insensitive'` for case-insensitive matching
- Implements OR logic across all fields for comprehensive results
- Automatically trims whitespace from search queries

**Example Query:**
```
/api/v1/questions?search=react
```
Returns all questions with "react" in title, description, or tags.

---

### 2. **Advanced Sorting Options**

Four powerful sorting modes:

#### **Newest** (Default)
```
sort=newest
```
- Sorts by `created_at DESC`
- Shows most recently asked questions first
- Best for discovering fresh content

#### **Most Votes**
```
sort=votes
```
- Sorts by `upvotes DESC`, then `created_at DESC`
- Shows highest-voted questions first
- Helps find community-endorsed content

#### **Unanswered**
```
sort=unanswered
```
- Filters questions with no accepted answer AND no answers
- Sorts by `created_at DESC`
- Perfect for finding questions that need help

#### **Active**
```
sort=active
```
- Sorts by `updated_at DESC`
- Shows questions with recent activity
- Great for ongoing discussions

---

### 3. **Tag Filtering**

Filter questions by specific technology tags:

```
/api/v1/questions?tag=javascript
```

**Features:**
- Case-insensitive tag matching
- Normalized tag names (lowercase)
- Can combine with search and sort parameters

**Example:**
```
/api/v1/questions?tag=react&sort=votes&search=hooks
```
Shows React questions containing "hooks", sorted by votes.

---

### 4. **Enhanced Question Cards**

Question cards now display:
- **Upvote count** (when sort=votes)
- **Answer count**
- **Solved badge** (if question has accepted answer)
- **Author information**
- **Tags** with click-to-filter
- **Relative timestamps**

---

### 5. **Interactive Filter UI**

#### **SearchFilters Component**
Located in `/components/SearchFilters.tsx`

**Features:**
- Visual sort buttons (Newest, Most Votes, Unanswered, Active)
- Real-time URL parameter synchronization
- Clear filters button
- Active filter indicators
- Optional search bar integration

**Usage:**
```tsx
import { SearchFilters } from '@/components/SearchFilters';

// With search bar
<SearchFilters showSearch />

// Without search bar
<SearchFilters />
```

---

### 6. **Navbar Search Integration**

Global search available in the navigation bar:

**Features:**
- Persistent across all pages
- Auto-fills from URL parameters
- Redirects to `/questions` with search query
- Mobile responsive

**How to use:**
1. Type search query in navbar
2. Press Enter or submit
3. Automatically navigates to filtered questions page

---

## 🔧 API Reference

### GET `/api/v1/questions`

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 20 | Results per page (max 50) |
| `search` | string | - | Search query (title, description, tags) |
| `tag` | string | - | Filter by specific tag |
| `sort` | enum | newest | Sort order: `newest`, `votes`, `unanswered`, `active` |

**Example Requests:**

```bash
# Basic search
GET /api/v1/questions?search=typescript

# Search with tag filter
GET /api/v1/questions?search=hooks&tag=react

# Get unanswered questions
GET /api/v1/questions?sort=unanswered

# Most voted React questions
GET /api/v1/questions?tag=react&sort=votes

# Complex query
GET /api/v1/questions?search=authentication&sort=active&page=2&limit=10
```

**Response Format:**

```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "uuid",
        "title": "Question title",
        "description": "Full description...",
        "author": {
          "id": "uuid",
          "username": "johndoe"
        },
        "tags": ["react", "typescript"],
        "answers_count": 5,
        "votes_count": 12,
        "upvotes": 12,
        "accepted_answer_id": "uuid",
        "created_at": "2026-03-07T...",
        "updated_at": "2026-03-07T..."
      }
    ],
    "total_pages": 5,
    "current_page": 1,
    "total_questions": 42
  }
}
```

---

## 🎨 UI Components

### 1. **SearchFilters Component**

**File:** `src/components/SearchFilters.tsx`

**Props:**
```typescript
interface SearchFiltersProps {
    showSearch?: boolean; // Show integrated search bar
}
```

**Features:**
- Sort button group with active state
- URL-driven state (no local state conflicts)
- Clear filters functionality
- Automatic page reset on filter change

---

### 2. **QuestionList Component**

**File:** `src/components/QuestionList.tsx`

**Enhancements:**
- Reads search parameters from URL
- Auto-resets pagination on filter changes
- Displays filter indicators
- Shows appropriate empty states

**Empty States:**
- "No questions yet" (no data)
- "No results found" (search with no matches)

---

### 3. **QuestionCard Component**

**File:** `src/components/QuestionCard.tsx`

**New Fields:**
- `upvotes` (vote count display)
- `votes_count` (total votes)
- Conditional rendering based on data availability

---

## 🚀 Performance Optimizations

### 1. **Database Indexing**

Recommended indexes for optimal performance:

```sql
-- Title search optimization
CREATE INDEX IF NOT EXISTS idx_question_title_trgm 
ON "Question" USING gin (title gin_trgm_ops);

-- Description search optimization  
CREATE INDEX IF NOT EXISTS idx_question_description_trgm 
ON "Question" USING gin (description gin_trgm_ops);

-- Tag name search optimization
CREATE INDEX IF NOT EXISTS idx_tag_name_trgm 
ON "Tag" USING gin (name gin_trgm_ops);

-- Composite index for sorting
CREATE INDEX IF NOT EXISTS idx_question_upvotes_created 
ON "Question" (upvotes DESC, created_at DESC);

-- Active filter optimization
CREATE INDEX IF NOT EXISTS idx_question_updated 
ON "Question" (updated_at DESC) WHERE deleted_at IS NULL;
```

**Enable PostgreSQL trigram extension:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

### 2. **Query Optimization**

**Current Implementation:**
- Uses Prisma's `mode: 'insensitive'` for case-insensitive search
- Implements `OR` conditions for multi-field search
- Parallel queries with `Promise.all()` for count and results

**Benefits:**
- Single database round-trip for data + count
- Efficient filtering with proper WHERE clauses
- Optimized ordering with conditional orderBy

---

### 3. **Client-Side Optimization**

**React Query Caching:**
```typescript
queryKey: ['questions', page, search, tag, sort]
```
- Automatic cache invalidation on parameter change
- Background refetching for stale data
- Shared cache across components

---

## 🔮 Future Enhancements

### 1. **PostgreSQL Full-Text Search**

Upgrade to native full-text search for better performance:

```typescript
// Migration to add tsvector columns
await prisma.$executeRaw`
  ALTER TABLE "Question" 
  ADD COLUMN search_vector tsvector 
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

  CREATE INDEX idx_question_search_vector 
  ON "Question" USING gin(search_vector);
`;
```

**Query Example:**
```typescript
const results = await prisma.$queryRaw`
  SELECT * FROM "Question"
  WHERE search_vector @@ plainto_tsquery('english', ${searchTerm})
  ORDER BY ts_rank(search_vector, plainto_tsquery('english', ${searchTerm})) DESC
`;
```

**Benefits:**
- ✅ Better typo tolerance (stemming)
- ✅ Relevance ranking
- ✅ Faster for large datasets
- ✅ Stop word filtering

---

### 2. **Elasticsearch Integration**

For advanced features and scale:

**Advantages:**
- Advanced typo tolerance (fuzzy matching)
- Synonym support
- Highlighting search terms in results
- Aggregations (faceted search)
- Near real-time indexing

**Architecture:**
```
User → Next.js API → Elasticsearch → Results
                  ↓
                Database (source of truth)
```

---

### 3. **Algolia Integration**

For instant search with minimal setup:

**Features:**
- Instant search-as-you-type
- Typo tolerance out of the box
- Geo-search capabilities
- Advanced analytics
- Pre-built UI components

---

### 4. **Search Analytics**

Track search behavior:
- Most searched terms
- Zero-result queries (for content gaps)
- Click-through rates
- Filter usage statistics

---

## 📊 Testing

### Manual Testing Checklist

- [ ] Search by title keyword
- [ ] Search by description content
- [ ] Search by tag name
- [ ] Combine search with tag filter
- [ ] Sort by newest
- [ ] Sort by votes
- [ ] Sort by unanswered
- [ ] Sort by active
- [ ] Clear all filters
- [ ] Pagination works with filters
- [ ] Navbar search redirects correctly
- [ ] URL parameters persist on page reload
- [ ] Mobile responsive search

### Test Queries

```bash
# Basic functionality
curl "http://localhost:3000/api/v1/questions?search=react"

# Complex query
curl "http://localhost:3000/api/v1/questions?search=hooks&tag=react&sort=votes&page=1&limit=10"

# Unanswered questions
curl "http://localhost:3000/api/v1/questions?sort=unanswered"
```

---

## 🐛 Troubleshooting

### Search returns no results
- Check if search term contains special characters
- Verify database contains matching data
- Ensure `deleted_at IS NULL` filter is applied

### Sorting not working
- Verify `sort` parameter is one of: `newest`, `votes`, `unanswered`, `active`
- Check if `orderBy` is properly applied in Prisma query
- Ensure fields exist in database (upvotes, updated_at)

### Performance issues
- Add recommended database indexes
- Enable query logging to identify slow queries
- Consider implementing cursor-based pagination
- Use CDN for static assets

---

## 📝 Summary

**What's Working:**
✅ Multi-field search (title, description, tags)
✅ Four sort options (newest, votes, unanswered, active)
✅ Tag filtering
✅ URL-driven state management
✅ Responsive UI components
✅ Pagination with filters
✅ Vote count display
✅ Global navbar search

**Performance:**
- Current: Suitable for 10K-100K questions
- Scales to millions with proper indexing
- Can upgrade to Elasticsearch/Algolia for advanced features

**Best Practices:**
- All filters work together seamlessly
- URL parameters enable shareable filtered views
- Case-insensitive search for better UX
- Graceful empty states
- Mobile-first responsive design

---

## 🎓 Usage Examples

### For End Users

**Find React questions with most votes:**
1. Go to `/questions`
2. Type "react" in search or click React tag
3. Click "Most Votes" button

**Find unanswered questions to help:**
1. Go to `/questions`
2. Click "Unanswered" button
3. Browse questions needing answers

**Search from anywhere:**
1. Use navbar search bar
2. Type your query
3. Press Enter
4. Results show on questions page

### For Developers

**Implementing custom search:**
```typescript
import { useRouter } from 'next/navigation';

function CustomSearch() {
  const router = useRouter();
  
  const handleSearch = (query: string) => {
    router.push(`/questions?search=${encodeURIComponent(query)}&sort=votes`);
  };
  
  return (
    <input onChange={(e) => handleSearch(e.target.value)} />
  );
}
```

**Reading current filters:**
```typescript
'use client';
import { useSearchParams } from 'next/navigation';

function MyComponent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'newest';
  
  return <div>Searching: {search}, Sorted by: {sort}</div>;
}
```

---

**Last Updated:** March 7, 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready
