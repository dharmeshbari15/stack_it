# Quick Start: Search Features

## 🚀 Running the Application

### 1. Apply Search Optimization Indexes (Optional but Recommended)

For better performance, add database indexes:

```bash
# Connect to your PostgreSQL database
psql -U postgres -d stack_it

# Run the optimization script
\i prisma/migrations/search_optimization_indexes.sql

# Or using Docker
docker exec -i stackit-postgres psql -U postgres -d stack_it < prisma/migrations/search_optimization_indexes.sql
```

### 2. Start the Development Server

```bash
npm run dev
```

### 3. Test the Search Features

Open [http://localhost:3000](http://localhost:3000)

---

## ✅ Testing Checklist

### Basic Search
- [ ] Navigate to home page
- [ ] Type "react" in navbar search → Press Enter
- [ ] Verify results show on `/questions` page
- [ ] Check that "react" appears in question titles, descriptions, or tags

### Sort Options (on `/questions` page)
- [ ] Click **"Newest"** → Questions sorted by creation date (most recent first)
- [ ] Click **"Most Votes"** → Questions sorted by upvotes (highest first)
- [ ] Click **"Unanswered"** → Only shows questions with no answers
- [ ] Click **"Active"** → Questions sorted by last update time

### Tag Filtering
- [ ] Click any tag badge on a question card
- [ ] Verify URL changes to `/questions?tag=tagname`
- [ ] Only questions with that tag appear
- [ ] Active filter indicator shows at top

### Combined Filters
- [ ] Search for "hooks"
- [ ] Click "react" tag
- [ ] Click "Most Votes" sort
- [ ] Verify URL: `/questions?search=hooks&tag=react&sort=votes`
- [ ] Results match all criteria

### Clear Filters
- [ ] Apply multiple filters (search + tag + sort)
- [ ] Click **"Clear filters"** button
- [ ] All filters reset, shows all questions sorted by newest

### Pagination
- [ ] Apply a filter
- [ ] Navigate to page 2
- [ ] Verify filter persists
- [ ] Change filter → pagination resets to page 1

---

## 🎯 Feature Demos

### Demo 1: Find Popular React Questions
```
1. Go to /questions
2. Type "react" in search bar OR click a React tag
3. Click "Most Votes" button
4. See most upvoted React questions
```

### Demo 2: Help Answer Questions
```
1. Go to /questions
2. Click "Unanswered" button
3. Browse questions needing help
4. Click a question to answer
```

### Demo 3: Global Search
```
1. From any page, type "typescript" in navbar
2. Press Enter
3. Automatically navigates to filtered results
```

---

## 🔧 API Testing

### Using curl

```bash
# Basic search
curl "http://localhost:3000/api/v1/questions?search=react"

# Search with tag
curl "http://localhost:3000/api/v1/questions?search=hooks&tag=react"

# Most voted questions
curl "http://localhost:3000/api/v1/questions?sort=votes&limit=5"

# Unanswered questions
curl "http://localhost:3000/api/v1/questions?sort=unanswered"

# Complex query
curl "http://localhost:3000/api/v1/questions?search=authentication&tag=nodejs&sort=active&page=1"
```

### Using Browser DevTools

1. Open `/questions` page
2. Open Browser DevTools (F12)
3. Go to Network tab
4. Filter by search or sort
5. Inspect API requests to `/api/v1/questions`

---

## 📊 Expected Results

### Search by "react"
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "title": "How to use React hooks?",
        "tags": ["react", "javascript"],
        "upvotes": 15,
        "answers_count": 3
      }
    ],
    "total_questions": 42,
    "current_page": 1,
    "total_pages": 5
  }
}
```

### Sort by "votes"
- Questions ordered by upvotes (descending)
- Highest voted questions appear first
- Vote count visible on each card

### Sort by "unanswered"
- Only questions with `answers_count: 0`
- No accepted answer
- Great for contributors

---

## 🐛 Common Issues

### Search returns no results
**Solution:** Check if you have questions in the database. Run seed script:
```bash
npx tsx prisma/seed.ts
```

### Sort buttons don't work
**Solution:** Check browser console for errors. Ensure:
- React Query is configured
- `sort` parameter in URL
- API returns data

### Performance is slow
**Solution:** Run the optimization indexes:
```bash
docker exec -i stackit-postgres psql -U postgres -d stack_it < prisma/migrations/search_optimization_indexes.sql
```

---

## 🎨 UI Components Reference

### SearchFilters Component
```tsx
import { SearchFilters } from '@/components/SearchFilters';

// With search bar (questions page)
<SearchFilters showSearch />

// Without search bar (home page)
<SearchFilters />
```

### QuestionList Component
```tsx
import { QuestionList } from '@/components/QuestionList';

// Automatically reads URL parameters
<QuestionList />
```

---

## 🔄 State Management

### URL Parameters (Source of Truth)
```
/questions?search=react&tag=javascript&sort=votes&page=2
```

All components read from URL:
- `searchParams.get('search')`
- `searchParams.get('tag')`
- `searchParams.get('sort')`
- `searchParams.get('page')`

### React Query Cache
```typescript
queryKey: ['questions', page, search, tag, sort]
```

Automatically refetches when any parameter changes.

---

## 📈 Performance Tips

### 1. Database Indexes
✅ Run the optimization SQL script
✅ Analyze tables after adding data
✅ Monitor slow queries

### 2. Client-Side Optimization
✅ React Query caching
✅ URL-driven state (no prop drilling)
✅ Debounced search (future enhancement)

### 3. API Optimization
✅ Parallel queries with `Promise.all()`
✅ Limit results per page (default: 20)
✅ Efficient Prisma queries

---

## 📚 Related Documentation

- [SEARCH_FEATURES.md](./SEARCH_FEATURES.md) - Complete feature documentation
- [API Documentation](./README.md#api-endpoints) - API reference
- [Prisma Schema](./prisma/schema.prisma) - Database schema

---

## 🎓 Next Steps

1. ✅ Test all search features
2. ✅ Apply database indexes
3. ⏭️ Add search analytics (future)
4. ⏭️ Implement debounced search (future)
5. ⏭️ Upgrade to full-text search (future)
6. ⏭️ Consider Elasticsearch for scale (future)

---

**Quick Reference:**
- Home Page: [http://localhost:3000](http://localhost:3000)
- Questions: [http://localhost:3000/questions](http://localhost:3000/questions)
- Test Search: [http://localhost:3000/questions?search=react&sort=votes](http://localhost:3000/questions?search=react&sort=votes)

**Status:** ✅ Ready to Use!
