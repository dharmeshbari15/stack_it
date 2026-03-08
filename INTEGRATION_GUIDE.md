# Integration Guide: Bounty System & Edit History

## How to Integrate into Existing Pages

### 1. Question Detail Page

Add to `src/app/questions/[id]/page.tsx`:

```tsx
import { BountyCard } from '@/components/BountyCard';
import { EditHistory } from '@/components/EditHistory';

export default function QuestionDetailPage() {
  // ... existing code ...

  return (
    <div>
      {/* ... existing question content ... */}
      
      <div className="mt-8 space-y-6">
        {/* Add Bounty Card */}
        <BountyCard 
          questionId={question.id} 
          isAuthor={isQuestionAuthor}
        />
        
        {/* Add Edit History */}
        <EditHistory
          type="question"
          entityId={question.id}
          isAuthor={isQuestionAuthor}
        />
      </div>
      
      {/* ... rest of the page ... */}
    </div>
  );
}
```

### 2. Answer Component

Add to `src/components/AnswerItem.tsx`:

```tsx
import { EditHistory } from '@/components/EditHistory';

export function AnswerItem({ answer, ... }: AnswerItemProps) {
  // ... existing code ...

  return (
    <div>
      {/* ... existing answer content ... */}
      
      {/* Add Edit History for answer */}
      <EditHistory
        type="answer"
        entityId={answer.id}
        isAuthor={isAnswerAuthor}
      />
    </div>
  );
}
```

### 3. Question Edit API Integration

Update `src/app/api/v1/questions/[id]/route.ts` PATCH handler:

```typescript
import { createQuestionVersion } from '@/lib/version-control';

export const PATCH = apiHandler(async (req: NextRequest, { params }) => {
  // ... existing validation and update code ...

  // Store old data for version tracking
  const oldQuestion = await prisma.question.findUnique({ /* ... */ });

  // Update question
  const updated = await prisma.question.update(/* ... */);

  // Create version entry
  await createQuestionVersion(
    questionId,
    updated.title,
    updated.description,
    updated.tags.map(t => t.tag.name),
    userId,
    editReason || 'Edited'
  );

  return apiSuccess(updated);
});
```

### 4. Answer Edit API Integration

Update `src/app/api/v1/answers/[id]/route.ts` PATCH handler:

```typescript
import { createAnswerVersion } from '@/lib/version-control';

export const PATCH = apiHandler(async (req: NextRequest, { params }) => {
  // ... existing validation and update code ...

  // Update answer
  const updated = await prisma.answer.update(/* ... */);

  // Create version entry
  await createAnswerVersion(
    answerId,
    updated.body,
    userId,
    editReason || 'Edited'
  );

  return apiSuccess(updated);
});
```

---

## Database Setup

### Run Prisma Migration

```bash
# Generate prisma client
npx prisma generate

# Run migration
npx prisma migrate deploy

# Or if creating fresh:
npx prisma db push
```

---

## API Endpoints Summary

### Bounty Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/questions/{id}/bounties` | Offer a bounty |
| GET | `/api/v1/questions/{id}/bounties` | Get all bounties for question |
| POST | `/api/v1/bounties/{id}/award` | Award bounty to user |
| DELETE | `/api/v1/bounties/{id}` | Cancel bounty |

### Edit History Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/questions/{id}/versions` | Get all question versions |
| GET | `/api/v1/answers/{id}/versions` | Get all answer versions |
| GET | `/api/v1/versions/diff` | Get diff between versions |
| POST | `/api/v1/versions/rollback` | Rollback to previous version |

---

## Testing

### Test Bounty Feature
```javascript
// Offer a bounty
const bountyRes = await fetch('/api/v1/questions/q-123/bounties', {
  method: 'POST',
  body: JSON.stringify({
    reputation_amount: 50,
    duration_days: 7
  })
});

// Get bounties
const bounties = await fetch('/api/v1/questions/q-123/bounties');

// Award bounty
const awardRes = await fetch('/api/v1/bounties/b-123/award', {
  method: 'POST',
  body: JSON.stringify({
    awarded_to_user_id: 'user-456'
  })
});

// Cancel bounty
const cancelRes = await fetch('/api/v1/bounties/b-123', {
  method: 'DELETE'
});
```

### Test Edit History
```javascript
// Get versions
const versions = await fetch('/api/v1/questions/q-123/versions');

// Get diff
const diff = await fetch(
  '/api/v1/versions/diff?type=question&entity_id=q-123&from_version=1&to_version=2'
);

// Rollback
const rollbackRes = await fetch('/api/v1/versions/rollback', {
  method: 'POST',
  body: JSON.stringify({
    type: 'question',
    entity_id: 'q-123',
    version_number: 1
  })
});
```

---

## Permissions & Authorization

### Bounty System
- **Offer Bounty**: Any user on own questions
- **Award Bounty**: Only bounty offerer
- **Cancel Bounty**: Only bounty offerer
- **View Bounties**: Public/anyone

### Edit History
- **View Versions**: Public/anyone
- **View Diff**: Public/anyone
- **Rollback**: Only author of the post

---

## Performance Considerations

### Bounty System
- Indexed on: `question_id, status`, `expires_at`, `offered_by_id`
- Auto-cleanup: Run nightly to process expired bounties
- Typical query: <5ms

### Edit History
- Indexed on: `question_id/answer_id`, `edited_at`, `edited_by_id`
- Storage: ~1KB per version (text content)
- Large edits (markdown): 5-50KB
- Typical query: <10ms

### Optimization Tips
1. Lazy-load version history (show only latest 10, load more on scroll)
2. Cache diff calculations (30 second TTL)
3. Archive old versions (>1 year) to separate table
4. Run bounty cleanup in background job

---

## Notifications (Future)

When implementing notifications for these features:

```typescript
// New Bounty
await createNotification({
  type: 'BOUNTY_OFFERED',
  reference_id: bounty.id,
  user_id: question.author_id,
  actor_id: offerer_id
});

// Bounty Awarded
await createNotification({
  type: 'BOUNTY_AWARDED',
  reference_id: bounty.id,
  user_id: winner_id,
  actor_id: question.author_id
});

// Answer Edited
await createNotification({
  type: 'ANSWER_EDITED',
  reference_id: answer.id,
  user_id: question.author_id,
  actor_id: answer.author_id
});
```
