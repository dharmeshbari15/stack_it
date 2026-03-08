# Reputation & Gamification System - Implementation Complete

## Overview
A comprehensive reputation and gamification system has been successfully implemented for the StackIt Q&A platform. Users earn reputation points for contributing quality content, with escalating rewards for valuable contributions.

## Point System

### Question Voting
- **Upvote**: +5 reputation points
- **Downvote**: -2 reputation points

### Answer Voting  
- **Upvote**: +10 reputation points
- **Downvote**: -2 reputation points

### Answer Acceptance
- **Accept Answer**: +15 reputation points (awarded to answer author)
- **Unaccept Answer**: -15 reputation points (reversed if answer is unaccepted)

## Reputation Levels (Badges)

Users unlock different reputation levels as they accumulate reputation:

| Level | Threshold | Color | Permissions Unlocked |
|-------|-----------|-------|---------------------|
| 🟰 Newbie | 0+ | Light Gray | Ask questions (always available) |
| 🟩 Beginner | 15+ | Green | Vote on content |
| 🟦 Intermediate | 50+ | Blue | Post comments |
| 🟨 Advanced | 100+ | Orange | Edit own posts |
| ⭐ Expert | 5,000+ | Gold | Delete any posts |
| 👑 Elite | 10,000+ | Purple | Moderator actions |

## Implemented Features

### API Endpoints

#### 1. **Question Voting** ✅
```
POST /api/v1/questions/[id]/vote
Body: { voteType: "upvote" | "downvote" }
```
- Allows users to upvote or downvote questions
- Properly handles vote switching (changing vote type)
- Prevents self-voting reputation awards
- Updates question score in real-time
- Transactional operations ensure data consistency

#### 2. **Answer Voting** ✅
```
POST /api/v1/answers/[id]/vote
Body: { voteType: "upvote" | "downvote" }
```
- Allows users to upvote or downvote answers
- Same features as question voting
- Awards reputation to answer authors

#### 3. **Accept Answer** ✅
```
POST /api/v1/questions/[id]/accept-answer
Body: { answerId: "..." }
```
- Question authors can accept answers
- Awards +15 reputation to answer author
- Can change accepted answer (reverses previous reputation)
- Prevents self-acceptance reputation (when author votes on own answer)

#### 4. **Leaderboard** ✅
```
GET /api/v1/leaderboard?limit=5&page=1
```
Response includes:
- User ranking by reputation (descending)
- User information (username, email, reputation)
- Reputation level badge and color
- Question and answer counts
- Member since date
- Pagination support

Example Response:
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "username": "expert_user",
        "reputation": 1250,
        "level": {
          "level": "Expert",
          "color": "gold",
          "nextLevel": "Elite",
          "nextThreshold": 10000
        },
        "questions_count": 15,
        "answers_count": 45
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 100,
      "total_pages": 20
    }
  }
}
```

#### 5. **Reputation History** ✅
```
GET /api/v1/users/[id]/reputation-history?limit=50&page=1
```
Tracks all reputation changes with:
- Change type (QUESTION_UPVOTE, ANSWER_ACCEPTED, etc.)
- Amount earned/lost
- Reference ID (which question/answer caused the change)
- Timestamp
- Human-readable description

Example History Entry:
```json
{
  "change_type": "ANSWER_ACCEPTED",
  "description": "Answer accepted",
  "amount": 15,
  "reference_id": "answer_123",
  "created_at": "2026-03-07T14:30:00.000Z"
}
```

## Core Logic Library

### `/src/lib/reputation.ts`

Functions provided:
- `awardReputation()` - Atomically award/reverse reputation changes
- `getReputationLevel()` - Get current badge level for a reputation score
- `getUserPermissions()` - Check what actions a user can perform
- `hasReputationPermission()` - Verify specific permission (e.g., "comment")

Reputation thresholds:
- Vote (upvote/downvote): 15 points
- Comment: 50 points
- Edit own: 100 points
- Delete any: 5,000 points
- Moderator: 10,000 points

## Database Schema Updates

### New Fields
- `User.reputation` (Int) - Current reputation score
- `Question.score` (Int) - Vote score for question

### New Models
- `QuestionVote` - Tracks votes on questions (composite PK: user_id + question_id)
- `ReputationHistory` - Audit trail of all reputation changes

### New Enum
- `ReputationChangeType` - 6 change types:
  - QUESTION_UPVOTE
  - QUESTION_DOWNVOTE
  - ANSWER_UPVOTE
  - ANSWER_DOWNVOTE
  - ANSWER_ACCEPTED
  - ANSWER_UNACCEPTED

## Testing

All endpoints have been verified to work correctly:

✅ Questions API - Returns questions with voting data
✅ Users API - Returns user profiles with reputation
✅ Leaderboard API - Ranks users by reputation with badges
✅ Reputation History API - Tracks reputation changes
✅ Database Schema - Reputation fields properly added
✅ Voting Logic - Handles upvote, downvote, switching, and removal
✅ Reputation Awards - Points awarded/reversed correctly
✅ Transaction Safety - All operations atomic and consistent

## Usage Examples

### Voting on a Question
```bash
curl -X POST http://localhost:3000/api/v1/questions/q123/vote \
  -H "Content-Type: application/json" \
  -d '{"voteType": "upvote"}'
```

### Getting Leaderboard
```bash
curl http://localhost:3000/api/v1/leaderboard?limit=10
```

### Fetching User Reputation History
```bash
curl http://localhost:3000/api/v1/users/user123/reputation-history?limit=20
```

## Architecture Highlights

### Transaction Safety
All reputation-affecting operations use Prisma transactions to ensure:
- Vote and reputation changes are atomic
- No partial updates if errors occur
- Consistent leaderboard rankings

### Self-Vote Prevention
The system prevents users from earning reputation by voting on their own content:
- Answer upvote checks `answer.author_id !== session.user.id`
- Question upvote checks `question.author_id !== session.user.id`

### Vote Toggling
Users can:
- Click upvote once to add upvote
- Click upvote again to remove their upvote
- Click downvote to change their vote
- Vote reversal properly adjusts reputation

### Reputation Audit Trail
Every reputation change is tracked in `ReputationHistory`:
- What action caused it (QUESTION_UPVOTE, etc.)
- How many points were earned/lost
- Which content (question/answer ID) triggered it
- When it happened

## Future Enhancements

Potential additions:
- Reputation decay for old votes
- Voting reward caps (max points per action per day)
- Community moderation based on reputation
- Reputation badges display on user profiles
- Reputation milestones notifications
- Reputation-based content recommendations
- Anti-fraud detection for voting patterns

## Files Modified/Created

### Created
- `/src/lib/reputation.ts` - Core reputation logic
- `/src/app/api/v1/leaderboard/route.ts` - Leaderboard endpoint
- `/src/app/api/v1/users/[id]/reputation-history/route.ts` - History endpoint
- `/src/app/api/v1/questions/[id]/vote/route.ts` - Question voting endpoint
- `test-reputation-final.js` - Test suite

### Modified
- `prisma/schema.prisma` - Added reputation models and fields
- `/src/app/api/v1/answers/[id]/vote/route.ts` - Integrated reputation
- `/src/app/api/v1/questions/[id]/accept-answer/route.ts` - Integrated reputation

## Deployment Checklist

- [x] Database schema updated and migrated
- [x] API endpoints created and tested  
- [x] Reputation logic library complete
- [x] Transaction safety implemented
- [x] Error handling in place
- [x] API documentation provided
- [x] Test suite created
- [ ] Frontend UI components (leaderboard, badges, reputation display)
- [ ] Analytics dashboard
- [ ] Reputation notifications

## Conclusion

The reputation and gamification system provides a complete foundation for incentivizing quality contributions on the StackIt platform. The point system rewards valuable answers (+10) more than questions (+5), with additional bonuses for answer acceptance (+15), encouraging community members to solve problems thoroughly.

The system is fully functional, tested, and ready for frontend integration to display reputation badges and leaderboards to users.
