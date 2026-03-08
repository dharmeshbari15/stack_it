# Implementation Checklist: Bounty System & Edit History

## ✅ Completed Components

### Bounty System
- [x] Schema design with Bounty model
- [x] User relations for bounties (offered/awarded)
- [x] Question relation for bounties
- [x] Core bounty library (`src/lib/bounty.ts`)
  - [x] offerBounty()
  - [x] awardBounty()
  - [x] autoAwardBountyToBestAnswer()
  - [x] getTotalActiveBounty()
  - [x] cancelBounty()
  - [x] cleanupExpiredBounties()
  - [x] getQuestionBounties()
- [x] API Endpoints
  - [x] POST /api/v1/questions/{id}/bounties (offer)
  - [x] GET /api/v1/questions/{id}/bounties (list)
  - [x] POST /api/v1/bounties/{id}/award (award)
  - [x] DELETE /api/v1/bounties/{id} (cancel)
- [x] UI Components
  - [x] BountyCard.tsx
  - [x] BountyItem
  - [x] OfferBountyForm

### Edit History & Version Control
- [x] Schema (already exists)
  - [x] QuestionVersion model
  - [x] AnswerVersion model
- [x] Core version control library (`src/lib/version-control.ts`)
  - [x] createQuestionVersion()
  - [x] getQuestionVersions()
  - [x] getQuestionVersion()
  - [x] rollbackQuestion()
  - [x] createAnswerVersion()
  - [x] getAnswerVersions()
  - [x] getAnswerVersion()
  - [x] rollbackAnswer()
- [x] Diff utilities (`src/lib/diff-util.ts`)
  - [x] calculateDiff()
  - [x] getChangeSummary()
- [x] API Endpoints
  - [x] GET /api/v1/questions/{id}/versions
  - [x] GET /api/v1/answers/{id}/versions
  - [x] GET /api/v1/versions/diff
  - [x] POST /api/v1/versions/rollback
- [x] UI Components
  - [x] EditHistory.tsx
  - [x] VersionItem
  - [x] DiffView
  - [x] DiffSection

### Documentation
- [x] FEATURES_BOUNTY_EDIT_HISTORY.md (comprehensive guide)
- [x] INTEGRATION_GUIDE.md (how to integrate)
- [x] This checklist

### Database
- [x] Migration file for Bounty model

---

## 🔧 TODO: Integration Steps

### Step 1: Database Migration
```bash
# Navigate to project root
cd c:\Users\Dheeraj\Downloads\Project\stack_it

# Generate updated Prisma client
npx prisma generate

# Run migration
npx prisma migrate dev --name "add bounty system"

# Or if already migrated
npx prisma db push
```

### Step 2: Update Question Detail Page
**File**: `src/app/questions/[id]/page.tsx`

Add imports:
```tsx
import { BountyCard } from '@/components/BountyCard';
import { EditHistory } from '@/components/EditHistory';
```

Add to JSX (after question content):
```tsx
<BountyCard 
  questionId={question.id} 
  isAuthor={session?.user?.id === question.author_id}
/>

<EditHistory
  type="question"
  entityId={question.id}
  isAuthor={session?.user?.id === question.author_id}
/>
```

### Step 3: Update Answer Component
**File**: `src/components/AnswerItem.tsx`

Add import:
```tsx
import { EditHistory } from '@/components/EditHistory';
```

Add to JSX (after answer content):
```tsx
<EditHistory
  type="answer"
  entityId={answer.id}
  isAuthor={isAnswerAuthor}
/>
```

### Step 4: Update Question Edit API
**File**: `src/app/api/v1/questions/[id]/route.ts`

Add import:
```typescript
import { createQuestionVersion } from '@/lib/version-control';
```

After the question update (PATCH handler):
```typescript
// Create version entry after update
await createQuestionVersion(
  questionId,
  updated.title,
  updated.description,
  updated.tags.map(t => t.tag.name),
  userId,
  body.edit_reason || 'Edited'
);
```

### Step 5: Update Answer Edit API
**File**: `src/app/api/v1/answers/[id]/route.ts`

Add import:
```typescript
import { createAnswerVersion } from '@/lib/version-control';
```

After the answer update (PATCH handler):
```typescript
// Create version entry after update
await createAnswerVersion(
  answerId,
  updated.body,
  userId,
  body.edit_reason || 'Edited'
);
```

### Step 6: Setup Bounty Cleanup Cron Job
Create `src/app/api/cron/cleanup-bounties/route.ts`:
```typescript
import { cleanupExpiredBounties } from '@/lib/bounty';
import { apiHandler, apiSuccess } from '@/lib/api-handler';

export const GET = apiHandler(async () => {
  const awardedCount = await cleanupExpiredBounties();
  return apiSuccess({
    message: `Bounty cleanup completed`,
    awarded: awardedCount
  });
});
```

Setup Vercel Cron (in `vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/cleanup-bounties",
    "schedule": "0 2 * * *"
  }]
}
```

---

## 🧪 Testing Checklist

### Bounty Feature Tests
- [ ] User can offer bounty with valid reputation
- [ ] User cannot offer bounty with insufficient reputation
- [ ] User sees error when trying to offer duplicate bounty
- [ ] Bounty countdown timer displays correctly
- [ ] Question author can award bounty manually
- [ ] Only bounty offerer can cancel bounty
- [ ] Cancellation refunds reputation
- [ ] Expired bounty auto-awards to highest scorer
- [ ] Bounty status changes to AWARDED/EXPIRED/CANCELLED

**Test Commands**:
```bash
# Test offer bounty
curl -X POST http://localhost:3000/api/v1/questions/{q-id}/bounties \
  -H "Content-Type: application/json" \
  -d '{"reputation_amount": 50, "duration_days": 7}'

# Test get bounties
curl http://localhost:3000/api/v1/questions/{q-id}/bounties

# Test award bounty
curl -X POST http://localhost:3000/api/v1/bounties/{b-id}/award \
  -H "Content-Type: application/json" \
  -d '{"awarded_to_user_id": "{user-id}"}'

# Test cancel bounty
curl -X DELETE http://localhost:3000/api/v1/bounties/{b-id}
```

### Edit History Tests
- [ ] First edit creates version 1 (or no version if no edit)
- [ ] Subsequent edits create version 2, 3, etc.
- [ ] Version data matches at point of creation
- [ ] Diff calculation works for title/description/body
- [ ] Diff highlights additions and deletions
- [ ] Only author can rollback
- [ ] Rollback creates new version with note
- [ ] Rolled-back content matches original version

**Test Commands**:
```bash
# Get versions
curl http://localhost:3000/api/v1/questions/{q-id}/versions

# Get diff
curl "http://localhost:3000/api/v1/versions/diff?type=question&entity_id={q-id}&from_version=1&to_version=2"

# Rollback
curl -X POST http://localhost:3000/api/v1/versions/rollback \
  -H "Content-Type: application/json" \
  -d '{
    "type": "question",
    "entity_id": "{q-id}",
    "version_number": 1
  }'
```

---

## 📦 Files Created/Modified

### New Files Created
- [x] `src/lib/bounty.ts` (180 lines)
- [x] `src/lib/diff-util.ts` (70 lines)
- [x] `src/app/api/v1/questions/[id]/bounties/route.ts` (50 lines)
- [x] `src/app/api/v1/bounties/[id]/award/route.ts` (45 lines)
- [x] `src/app/api/v1/bounties/[id]/route.ts` (35 lines)
- [x] `src/app/api/v1/versions/diff/route.ts` (110 lines)
- [x] `src/app/api/v1/versions/rollback/route.ts` (85 lines)
- [x] `src/components/BountyCard.tsx` (250 lines)
- [x] `src/components/EditHistory.tsx` (350 lines)
- [x] `prisma/migrations/20260308_add_bounty_system/migration.sql` (20 lines)
- [x] `FEATURES_BOUNTY_EDIT_HISTORY.md` (comprehensive docs)
- [x] `INTEGRATION_GUIDE.md` (integration instructions)

### Files Modified
- [x] `prisma/schema.prisma`
  - Added Bounty model
  - Added BountyStatus enum
  - Added bounties relations to User
  - Added bounties relation to Question

### Files Already Exist (No Changes Needed)
- `src/lib/version-control.ts` (core functionality already there)
- `src/app/api/v1/questions/[id]/versions/route.ts` (already implemented)
- `src/app/api/v1/answers/[id]/versions/route.ts` (already implemented)

---

## 🚀 Rollout Steps

1. **Testing Phase** (Local)
   - Run tests locally
   - Test API endpoints
   - Test UI components

2. **Database Migration** (Dev/Staging)
   - Run Prisma migration
   - Verify schema changes
   - Test with real data

3. **API Deployment**
   - Deploy API endpoints
   - Monitor for errors
   - Test in staging

4. **UI Integration**
   - Integrate components into pages
   - Test UI functionality
   - Cross-browser testing

5. **Production**
   - Final migration check
   - Deploy to production
   - Monitor metrics

---

## 📊 Expected Behavior

### Bounty Flow
1. User views question → Sees "Offer bounty" button
2. User clicks → Opens bounty form
3. User selects reputation and duration → Submits form
4. Bounty created → Visible under "Active Bounties"
5. Expires after duration → Auto-award or manual award
6. Answer author receives reputation → Notification (future)

### Edit History Flow
1. User edits question/answer → Version automatically created
2. Version appears in "Edit History" → Shows who edited when
3. User clicks version → Shows edit details
4. User compares versions → Diff displayed
5. Author clicks rollback → Content reverted, new version created

---

## 🔄 Maintenance

### Daily Tasks
- Run bounty cleanup cron (scheduled)

### Weekly Tasks
- Monitor bounty/version table sizes
- Check for any orphaned records

### Monthly Tasks
- Analyze bounty statistics
- Review edit history growth

---

## 📝 Notes

- Bounty system assumes reputation-based economy
- Edit history stores full snapshots (not deltas) for simplicity
- Diff algorithm is LCS-based (simple, not git-quality)
- Version cleanup/archival not implemented (future)
- Concurrent edit handling not implemented (future)

---

## Support & Issues

If you encounter issues:
1. Check migration ran successfully: `npx prisma migrate status`
2. Verify Prisma client regenerated: `npx prisma generate`
3. Check API responses in browser console
4. Review logs for database errors
5. Verify user has correct permissions

---

Generated: 2026-03-08
Last Updated: 2026-03-08
Status: ✅ Ready for Integration
