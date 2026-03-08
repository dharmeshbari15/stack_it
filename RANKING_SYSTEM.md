# Ranking System & Dashboard Documentation

## Overview

The StackIt platform now includes a comprehensive ranking system with a gamified reputation model and interactive dashboard. Users can track their progress, view global rankings, and understand their standing in the community.

## Features

### 1. **Reputation Points System**

Users earn reputation points through community participation:

| Action | Points | Description |
|--------|--------|-------------|
| Question Upvote | +5 | Your question is upvoted by another user |
| Question Downvote | -2 | Your question is downvoted |
| Answer Upvote | +10 | Your answer is upvoted |
| Answer Downvote | -2 | Your answer is downvoted |
| Answer Accepted | +15 | Your answer is marked as the solution |

### 2. **Reputation Levels**

Users progress through 6+ reputation tiers with increasing privileges:

| Level | Reputation | Color | Permissions Unlocked |
|-------|-----------|-------|-------|
| **Newbie** | 0 | Gray | View content |
| **Beginner** | 15+ | Green | Vote on questions/answers |
| **Intermediate** | 50+ | Blue | Leave comments |
| **Advanced** | 100+ | Orange | Edit your own posts |
| **Expert** | 5,000+ | Gold | Delete posts |
| **Elite** | 10,000+ | Purple | Moderation privileges |

### 3. **Global Leaderboard**

A public rankings page showing:
- Users ranked by reputation (default view)
- Filter by "Top Questioners" (sorted by questions_count)
- Filter by "Top Answerers" (sorted by answers_count)
- User profiles with join date and activity stats
- Medal emojis for top 3 users (🥇🥈🥉)
- Pagination support (20 users per page)

**Access:** `/leaderboard`

### 4. **Personal Dashboard**

An authenticated user dashboard with three tabs:

#### **Overview Tab**
- User profile card with reputation badge
- Current rank and ranking percentile
- Progress bar to next level
- Statistics (questions asked, answers provided)
- Reputation breakdown (how points are earned)

#### **Leaderboard Tab**
- View global rankings within the dashboard
- See your rank highlighted
- Full table with all user stats
- Pagination support

#### **History Tab**
- Complete reputation change history
- Timestamps for each action
- Point values (+/- amounts)
- Descriptions of what earned/cost points
- Paginated (10 entries per page)

**Access:** `/dashboard` (requires authentication)

### 5. **User Profile Enhancement**

Each user profile now displays:
- Current reputation and level badge
- Global rank and percentile
- Progress to next level with visual progress bar
- Achievement badges (upvotes, accepted answers, content created)
- Member since date and overall stats

## API Endpoints

### Get Leaderboard

```bash
GET /api/v1/leaderboard?limit=20&page=1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "id": "user_id",
        "username": "top_user",
        "reputation": 250,
        "level": {
          "level": "Expert",
          "color": "gold",
          "nextLevel": "Elite",
          "nextThreshold": 10000
        },
        "questions_count": 5,
        "answers_count": 12,
        "member_since": "2026-03-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

### Get User Ranking Stats

```bash
GET /api/v1/users/{userId}/ranking
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "john_doe",
      "reputation": 85,
      "level": {
        "level": "Advanced",
        "color": "orange",
        "nextLevel": "Veteran",
        "nextThreshold": 2000
      },
      "rank": 15,
      "totalUsers": 100,
      "member_since": "2026-01-15T00:00:00Z",
      "questions_count": 3,
      "answers_count": 8
    },
    "stats": {
      "reputation": 85,
      "rank": 15,
      "level": "Advanced",
      "badges": {
        "upvotes_on_answers": 5,
        "upvotes_on_questions": 2,
        "downvotes_on_answers": 0,
        "downvotes_on_questions": 0,
        "accepted_answers": 2
      },
      "content": {
        "questions_asked": 3,
        "answers_provided": 8
      }
    }
  }
}
```

### Get User Reputation History

```bash
GET /api/v1/users/{userId}/reputation-history?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "john_doe",
      "reputation": 85
    },
    "history": [
      {
        "id": "history_id",
        "change_type": "ANSWER_UPVOTE",
        "description": "Answer upvoted",
        "amount": 10,
        "reference_id": "answer_id",
        "created_at": "2026-03-07T10:30:00Z"
      }
    ]
  }
}
```

### Vote on Question

```bash
POST /api/v1/questions/{id}/vote
Content-Type: application/json

{
  "value": 1  // 1 for upvote, -1 for downvote
}
```

### Vote on Answer

```bash
POST /api/v1/answers/{id}/vote
Content-Type: application/json

{
  "vote_type": "upvote"  // or "downvote"
}
```

### Accept Answer

```bash
POST /api/v1/questions/{id}/accept-answer
Content-Type: application/json

{
  "answer_id": "answer_id"
}
```

## Navigation Updates

### Main Navigation
The navbar now includes:
- **"Rankings"** link in desktop nav (`/leaderboard`)
- **"Reputation Dashboard"** in user profile dropdown (authenticated users only)

### Quick Links
- **Leaderboard**: `/leaderboard` (public)
- **Dashboard**: `/dashboard` (authenticated)
- **User Profile**: `/users/{userId}` (includes ranking stats)

## Components

### ReputationDashboard
Main dashboard component with tabbed interface.

**Props:** None (uses Next auth & internal fetching)

**Features:**
- Tab navigation (Overview, Leaderboard, History)
- Real-time data fetching from APIs
- Progress visualization
- Reputation calculation

**File:** `src/components/ReputationDashboard.tsx`

### UserRankingStats
Displays user ranking statistics for profile pages.

**Props:**
- `userId` (string): The user ID to display stats for

**Features:**
- Rank card with position and percentile
- Reputation display with progress bar
- Achievement badges
- Responsive grid layout

**File:** `src/components/UserRankingStats.tsx`

## Database Schema

### User Model Updates

```prisma
model User {
  // ... existing fields
  reputation Int @default(0)
}
```

### Question Model Updates

```prisma
model Question {
  // ... existing fields
  score Int @default(0)  // Vote count (upvotes + downvotes)
}
```

### New Models

#### ReputationHistory
Tracks all reputation changes with audit trail:

```prisma
model ReputationHistory {
  id           String   @id @default(cuid())
  user_id      String
  change_type  String   // QUESTION_UPVOTE, ANSWER_UPVOTE, ANSWER_ACCEPTED, etc.
  amount       Int      // +5, +10, +15, -2
  reference_id String?  // ID of the question/answer
  created_at   DateTime @default(now())
  
  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
```

#### QuestionVote
Tracks votes on questions:

```prisma
model QuestionVote {
  user_id      String
  question_id  String
  value        Int      // 1 for upvote, -1 for downvote
  created_at   DateTime @default(now())
  
  user     User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  question Question @relation(fields: [question_id], references: [id], onDelete: Cascade)
  
  @@id([user_id, question_id])
}
```

## Usage Examples

### Display User Dashboard

```tsx
import ReputationDashboard from '@/components/ReputationDashboard';

export default function DashboardPage() {
  return <ReputationDashboard />;
}
```

### Display User Ranking Stats on Profile

```tsx
import UserRankingStats from '@/components/UserRankingStats';

export default function UserProfile({ userId }: { userId: string }) {
  return (
    <>
      {/* ... other profile content ... */}
      <UserRankingStats userId={userId} />
    </>
  );
}
```

### Fetch User Ranking

```typescript
const response = await fetch(`/api/v1/users/${userId}/ranking`);
const data = await response.json();
console.log(`${data.data.user.username} is rank #${data.data.user.rank}`);
```

## Styling & Theming

### Color Scheme

Color values are mapped from badge colors:

```typescript
const colorMap = {
  lightgray: '#A0AEC0',  // Newbie
  green: '#48BB78',      // Beginner
  blue: '#4299E1',       // Intermediate
  orange: '#ED8936',     // Advanced
  red: '#F56565',        // Veteran
  gold: '#ECC94B',       // Expert
  purple: '#9F7AEA'      // Elite
};
```

### Responsive Design

- Desktop: Full multi-column layouts
- Tablet: 2-3 columns depending on width
- Mobile: Single column with stacked cards

### Animations

- Progress bar fills smoothly: `width 0.3s ease`
- Row hovers highlight on leaderboard
- Smooth transitions on button states

## Performance Considerations

### Database Optimization

- Leaderboard queries use:
  - Efficient `ORDER BY reputation DESC`
  - Pagination with `LIMIT` and `OFFSET`
  - `_count` aggregation for quick stats
  
- Ranking calculation:
  - Uses indexed `reputation` field
  - Count queries are optimized with WHERE clauses
  - Combines into single response

### Caching Strategies (Future)

- Cache leaderboard (regenerate every 5 minutes)
- Cache user ranking (invalidate on reputation change)
- Client-side caching of non-critical data

## Security

### Authorization Rules

- **Leaderboard:** Public access (no auth required)
- **Dashboard:** Authenticated users only
  - Redirects to login if not authenticated
  - Can only view your own dashboard
- **User Profile:** Public view
  - Anyone can see another user's ranking and stats
  - Only reputation and activity stats visible (no private data)

### Data Privacy

- Reputation history is private (only user can view theirs)
- Vote details are not exposed in public APIs
- Email addresses not visible on profiles

## Testing

The system has been tested with:
- ✅ Leaderboard API (verified working)
- ✅ User ranking stats retrieval
- ✅ Reputation history tracking
- ✅ Vote point calculations
- ✅ Level progression logic

### Test Data

Seed includes:
- 5 sample users
- 7 questions
- 8 answers
- Various votes and interactions
- Full reputation history

## Deployment Checklist

- [x] Database schema pushed
- [x] API endpoints created
- [x] Components built and styled
- [x] Navigation updated
- [x] Test suite passing
- [ ] Performance optimization (if needed)
- [ ] Analytics integration (future)
- [ ] Achievement notifications (future)
- [ ] Reputation badges on posts (future)

## Future Enhancements

1. **Achievement Badges**
   - Special badges for milestones (100 upvotes, 10 accepted, etc.)
   - Visual badges displayed on user profiles

2. **Reputation Notifications**
   - Real-time notifications when reputation changes
   - "You've reached Expert level!" notifications

3. **Leaderboard Filters**
   - Filter by time period (this week, this month, all time)
   - Filter by specific badges or achievements

4. **Trending Content**
   - Show trending questions/answers based on recent votes
   - Rankings by velocity (growth rate)

5. **Gamification Extensions**
   - Streak tracking (consecutive days of activity)
   - Seasonal leaderboards
   - Community challenges

6. **Analytics Dashboard**
   - Reputation trends graph (timeline)
   - Activity heatmap
   - Comparative analytics

## Troubleshooting

### Leaderboard showing 0 reputation

- Verify votes are being recorded
- Check ReputationHistory entries in database
- Ensure `awardReputation()` is being called

### Progress bar not updating

- Clear browser cache
- Verify API endpoint returns latest reputation
- Check for client-side data staleness

### Rankings incorrect

- Verify User.reputation field is being updated
- Check for race conditions in voting transactions
- Ensure no duplicate reputation awards

## Support

For issues or questions about the ranking system:
1. Check the API responses for error messages
2. Verify database schema matches Prisma definitions
3. Review component prop types match expected data
4. Check browser console for client-side errors
5. Review server logs for API errors
