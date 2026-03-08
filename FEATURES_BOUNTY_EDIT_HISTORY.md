# StackIt Features: Bounty System & Edit History

## Feature 1: Question Bounty System

### Overview
Users can offer reputation as a bounty to incentivize better answers to their questions. This creates a community-driven way to prioritize important problems.

### Features

#### 1.1 Offer a Bounty
- **Who Can**: Any authenticated user on their own questions
- **Reputation Cost**: 10-5000 reputation points
- **Duration**: 1-365 days (default: 7 days)
- **Unique Constraint**: One active bounty per user per question

```typescript
POST /api/v1/questions/{id}/bounties
{
  "reputation_amount": 50,
  "duration_days": 7
}
```

**Response:**
```json
{
  "id": "bounty-uuid",
  "question_id": "q-uuid",
  "reputation_amount": 50,
  "offered_by": { "id": "user-uuid", "username": "john" },
  "offered_at": "2026-03-08T10:00:00Z",
  "expires_at": "2026-03-15T10:00:00Z",
  "status": "ACTIVE",
  "time_remaining": 604800000
}
```

#### 1.2 View Bounties
- Display total active bounty on question cards
- Show bounty details in expandable panel
- Display who offered each bounty

```typescript
GET /api/v1/questions/{id}/bounties
```

**Response:**
```json
[
  {
    "id": "bounty-uuid",
    "reputation_amount": 50,
    "offered_by": { "id": "user-uuid", "username": "john" },
    "status": "ACTIVE",
    "expires_at": "2026-03-15T10:00:00Z",
    "time_remaining": 604800000,
    "awarded_to": null
  }
]
```

#### 1.3 Auto-Award to Best Answer
- When bounty expires, automatically awards to the highest-scoring answer
- Question author can manually award bounty before expiry
- Awarded user receives full reputation amount

```typescript
POST /api/v1/bounties/{id}/award
{
  "awarded_to_user_id": "user-uuid"
}
```

#### 1.4 Cancel Bounty
- Only bounty offerer can cancel
- Refunds full reputation amount
- Can only cancel active bounties

```typescript
DELETE /api/v1/bounties/{id}
```

### UI Components

#### BountyCard
Location: `src/components/BountyCard.tsx`

- **OfferBountyForm**: Form to create new bounty
  - Reputation slider (10-500 in demo, max 5000)
  - Duration selector
  - Validation against user's reputation balance

- **BountyItem**: Display individual bounty
  - Active bounty status with countdown
  - Option to cancel (for offerer)
  - Display awarded bounty with recipient

### Database Model
```prisma
model Bounty {
  id              String    @id @default(uuid())
  question_id     String
  offered_by_id   String
  reputation_amount Int
  offered_at      DateTime  @default(now())
  expires_at      DateTime
  status          BountyStatus @default(ACTIVE)
  awarded_to_id   String?
  awarded_at      DateTime?
  awarded_reason  String?   @db.VarChar(500)
  
  question        Question  @relation(fields: [question_id], references: [id], onDelete: Cascade)
  offered_by      User      @relation("BountiesOffered", fields: [offered_by_id], references: [id], onDelete: Cascade)
  awarded_to      User?     @relation("BountiesAwarded", fields: [awarded_to_id], references: [id], onDelete: SetNull)

  @@unique([question_id, offered_by_id])
  @@index([question_id, status])
  @@index([expires_at])
}

enum BountyStatus {
  ACTIVE
  AWARDED
  EXPIRED
  CANCELLED
}
```

### Core Functions
Location: `src/lib/bounty.ts`

- `offerBounty(questionId, userId, reputationAmount, durationDays)` - Create bounty
- `awardBounty(bountyId, awardedToUserId)` - Award to specific user
- `autoAwardBountyToBestAnswer(questionId)` - Auto-award to highest scorer
- `getQuestionBounties(questionId)` - Get all bounties for question
- `getTotalActiveBounty(questionId)` - Sum of active bounties
- `cancelBounty(bountyId, userId)` - Cancel and refund
- `cleanupExpiredBounties()` - Cron job to process expiry

---

## Feature 2: Edit History & Version Control

### Overview
Every edit to a question or answer creates a version. Users can view the history of changes, see who edited and when, and rollback to previous versions if needed.

### Features

#### 2.1 Automatic Version Creation
- Version created on every question/answer edit
- Tracks: content, edit reason, editor, timestamp
- Version numbering starts at 1 for initial creation

#### 2.2 View Version History
- Get all versions for question or answer
- Show latest version first
- Display editor info and timestamp

```typescript
GET /api/v1/questions/{id}/versions
GET /api/v1/answers/{id}/versions
```

**Response:**
```json
{
  "versions": [
    {
      "version_number": 2,
      "title": "Updated title",
      "description": "Updated description",
      "tags": ["javascript", "react"],
      "edit_reason": "Fixed typo",
      "edited_at": "2026-03-08T10:00:00Z",
      "edited_by": {
        "id": "user-uuid",
        "username": "john"
      }
    },
    {
      "version_number": 1,
      "title": "Original title",
      "description": "Original description",
      "tags": ["javascript"],
      "edit_reason": null,
      "edited_at": "2026-03-08T09:00:00Z",
      "edited_by": { "id": "user-uuid", "username": "john" }
    }
  ],
  "total": 2
}
```

#### 2.3 View Diffs
- Compare any two versions
- Shows line-by-line changes
- Highlights added (+) and removed (-) lines
- Summary: count of added/removed lines

```typescript
GET /api/v1/versions/diff?type=question&entity_id={id}&from_version=1&to_version=2
```

**Response:**
```json
{
  "type": "question",
  "from_version": 1,
  "to_version": 2,
  "from_date": "2026-03-08T09:00:00Z",
  "to_date": "2026-03-08T10:00:00Z",
  "edited_by": { "id": "user-uuid", "username": "john" },
  "edit_reason": "Fixed typo",
  "title": {
    "diff": [
      { "type": "context", "content": "How to use" },
      { "type": "remove", "content": "REact" },
      { "type": "add", "content": "React" }
    ],
    "summary": { "added": 1, "removed": 1, "modified": true }
  },
  "description": {
    "diff": [
      { "type": "context", "content": "I have a question about..." },
      { "type": "remove", "content": "Plese help" },
      { "type": "add", "content": "Please help" }
    ],
    "summary": { "added": 1, "removed": 1, "modified": true }
  },
  "tags": {
    "from": ["javascript"],
    "to": ["javascript", "react"]
  }
}
```

#### 2.4 Rollback to Previous Version
- Only author can rollback
- Creates new version noting the rollback
- Updates question/answer with old content

```typescript
POST /api/v1/versions/rollback
{
  "type": "question",
  "entity_id": "{id}",
  "version_number": 1
}
```

### UI Components

#### EditHistory
Location: `src/components/EditHistory.tsx`

- **Version List**: Shows all edits with timestamps
  - Click to select version
  - "Latest" badge on most recent
  - Rollback button (for authors)
  
- **Diff Viewer**: Compare two versions
  - Display added/removed lines with colors
  - Show summary statistics
  - Display editor info and reason

### Database Models
```prisma
model QuestionVersion {
  id             String    @id @default(uuid())
  question_id    String
  version_number Int
  title          String    @db.VarChar(255)
  description    String
  tags           String[]  // JSON array of tag names
  edited_by_id   String
  edited_at      DateTime  @default(now())
  edit_reason    String?   @db.VarChar(500)
  
  question       Question  @relation(fields: [question_id], references: [id], onDelete: Cascade)
  edited_by      User      @relation("QuestionEdits", fields: [edited_by_id], references: [id], onDelete: Restrict)

  @@unique([question_id, version_number])
  @@index([question_id, edited_at])
  @@index([edited_by_id])
}

model AnswerVersion {
  id             String    @id @default(uuid())
  answer_id      String
  version_number Int
  body           String
  edited_by_id   String
  edited_at      DateTime  @default(now())
  edit_reason    String?   @db.VarChar(500)
  
  answer         Answer    @relation(fields: [answer_id], references: [id], onDelete: Cascade)
  edited_by      User      @relation("AnswerEdits", fields: [edited_by_id], references: [id], onDelete: Restrict)

  @@unique([answer_id, version_number])
  @@index([answer_id, edited_at])
  @@index([edited_by_id])
}
```

### Core Functions
Location: `src/lib/version-control.ts`

**Question Versions:**
- `createQuestionVersion(questionId, title, description, tags, userId, reason?)` - Create version
- `getQuestionVersions(questionId)` - Get all versions
- `getQuestionVersion(questionId, versionNumber)` - Get specific version
- `rollbackQuestion(questionId, versionNumber, userId)` - Rollback to version

**Answer Versions:**
- `createAnswerVersion(answerId, body, userId, reason?)` - Create version
- `getAnswerVersions(answerId)` - Get all versions
- `getAnswerVersion(answerId, versionNumber)` - Get specific version
- `rollbackAnswer(answerId, versionNumber, userId)` - Rollback to version

**Diff Utilities** (Location: `src/lib/diff-util.ts`)
- `calculateDiff(oldText, newText)` - LCS-based diff algorithm
- `getChangeSummary(oldText, newText)` - Count changes

### Integration Points

#### In Question Edit API
```typescript
// After updating question in PATCH /api/v1/questions/[id]
await createQuestionVersion(
  questionId,
  updatedTitle,
  updatedDescription,
  updatedTags,
  userId,
  editReason
);
```

#### In Answer Edit API
```typescript
// After updating answer in PATCH /api/v1/answers/[id]
await createAnswerVersion(
  answerId,
  updatedBody,
  userId,
  editReason
);
```

---

## Usage Examples

### Offering a Bounty
```typescript
// User wants to increase visibility on their question
// Offers 100 reputation for the best answer within 14 days

POST /api/v1/questions/q-123/bounties
{
  "reputation_amount": 100,
  "duration_days": 14
}
```

### Viewing Edit History
```typescript
// Click "Edit History" on a question to see all versions
// Select v1 and v2 to compare changes side-by-side
// If you're the author, click rollback to revert to an older version

GET /api/v1/questions/q-123/versions
GET /api/v1/versions/diff?type=question&entity_id=q-123&from_version=1&to_version=2
```

---

## Administration

### Cleanup Expired Bounties
Run regularly (daily cron job):
```typescript
import { cleanupExpiredBounties } from '@/lib/bounty';

// Auto-awards bounties that expired to best answers
const awardedCount = await cleanupExpiredBounties();
console.log(`Auto-awarded ${awardedCount} bounties`);
```

---

## Future Enhancements

### Bounty System
- [ ] Bounty notifications to followers
- [ ] Filter questions by active bounties
- [ ] Bounty statistics/dashboard
- [ ] Multiple bounties per question (from different users)
- [ ] Partial bounties for acceptable answers
- [ ] Bounty bidding/negotiations

### Edit History
- [ ] Email notifications for question edits
- [ ] Reputation-based edit restrictions
- [ ] Edit moderation queue for flagged changes
- [ ] Full-text search across all versions
- [ ] Version comparison UI improvements
- [ ] Edit conflict resolution for concurrent edits
