# Project TODO: StackIt MVP

## 1. Project Setup
- [x] Initialize GitHub repository (public/private).
- [x] Initialize Next.js App Router project (`npx create-next-app@latest`).
- [x] Configure Tailwind CSS during Next.js setup.
- [x] Setup ESLint and Prettier for code formatting.
- [x] Initialize Supabase project via the Supabase Dashboard.
- [x] Configure local environment variables (`.env.local`) with Supabase database connection strings.
- [x] Initialize Prisma in the project (`npx prisma init`).
- [x] Connect Vercel to the GitHub repository for automatic deployments.
- [x] Add Vercel Environment Variables matching local `.env`.

---

## 2. Core Architecture

### Database (Prisma & Supabase)
- [x] Define `User` schema model in `schema.prisma`.
- [x] Define `Question`, `Answer`, and `Tag` schema models.
- [x] Define `QuestionTag` junction model for M:N relationships.
- [x] Define `Vote` and `Notification` schema models.
- [x] Generate initial database migration (`npx prisma migrate dev --name init`).
- [x] Add database indexes on `Tag(name)`, `Question(created_at)`, `Vote(composite pk)`, and `Notification(user_id)`.

### Backend Infrastructure (Next.js API Routes)
- [x] Setup global Prisma Client singleton for API route database access.
- [x] Create standardized API error handler wrapper/utility function.
- [x] Configure Zod schema validation utility for incoming REST requests.

### Frontend Infrastructure
- [x] Setup standard layout component (`app/layout.tsx`) including global navigation bar.
- [x] Setup React Query Provider at the application root for client-side data fetching.
- [x] Create basic global loading state and error boundary components.

---

## 3. Feature: User Authentication

### Backend
- [x] Configure `NextAuth.js` (`auth.ts` / `app/api/auth/[...nextauth]/route.ts`).
- [x] Implement Credentials Provider (Email/Password) within NextAuth.
- [x] Write bcrypt password hashing logic for user registration endpoint (`POST /api/v1/auth/register`).
- [x] Implement JWT configuration for stateless session management in NextAuth.

### Frontend
- [x] Build Login UI screen/modal (`/login`).
- [x] Build Registration UI screen/modal (`/register`).
- [x] Implement client-side session context using NextAuth `useSession()`.
- [x] Create protected route wrapper component for authenticated-only pages (e.g., `/ask`).

---

## 4. Feature: Questions Lifecycle

### Backend
- [x] Create endpoint: `POST /api/v1/questions` (Validate tags array, sanitize HTML, insert into DB).
- [x] Create endpoint: `GET /api/v1/questions` (Implement pagination and tag filtering).
- [x] Create endpoint: `GET /api/v1/questions/[id]` (Fetch question with relations: Author, Tags, Answers).
- [x] Create endpoint: `DELETE /api/v1/system/posts/[id]` (Admin soft delete logic via `deleted_at`).

### Frontend
- [x] Build Home/Feed page (`/`) displaying paginated list of active questions.
- [x] Build "Ask Question" page (`/ask`).
- [x] Integrate TipTap Rich Text Editor into the Ask Question form.
- [x] Add tag selection input component (enforcing required tags).
- [x] Build Question Detail page (`/question/[id]`) displaying question description and metadata.

---

## 5. Feature: Answers & Interactions

### Backend
- [x] Create endpoint: `POST /api/v1/questions/[id]/answers` (Sanitize HTML, insert answer).
- [x] Create endpoint: `PATCH /api/v1/questions/[id]/accept-answer` (Verify question owner, update DB flag).
- [x] Create endpoint: `POST /api/v1/answers/[id]/vote` (Handle upvote/downvote logic, prevent duplicate votes, update score).

### Frontend
- [x] Build "Post Answer" form component with TipTap editor beneath the Question Detail view.
- [x] Build Answer List component to iterate over and display responses.
- [x] Implement UI for Upvote/Downvote buttons (triggering React Query mutation and optimistic UI update).
- [x] Implement "Accept Answer" button UI (visible only to question author).
- [x] Build visual treatment (e.g., green checkmark/border) for rendering an accepted answer.

---

## 6. Feature: Internal Notifications

### Backend
- [x] Implement internal event bus/utility function to spawn generic notifications.
- [x] Hook notification utility into Answer submission logic (notify question owner).
- [ ] Hook notification utility into `@username` parsing regex during question/answer backend sanitization.
- [x] Create endpoint: `GET /api/v1/notifications` (Fetch unread notifications for active user).
- [x] Create endpoint: `PATCH /api/v1/notifications/read` (Mark notifications as read).

### Frontend
- [x] Build Notification Bell icon component in global Navigation Bar.
- [x] Implement React Query polling (e.g., every 30s) or periodic fetch for unread notification count.
- [x] Build Notification Dropdown UI displaying the latest alerts and linking to specific threads.

---

## 7. Feature: User Profile

### Backend
- [x] Create endpoint: `GET /api/v1/users/[id]/posts` (Aggregate user's asked questions and submitted answers).

### Frontend
- [x] Build User Profile page (`/user/[id]`).
- [x] Implement tabbed UI separating "Questions" and "Answers" lists for that user.

---

## 8. Optimization & Hardening
- [ ] Implement universal server-side DOMPurify sanitization before any HTML is saved to PostgreSQL.
- [ ] Configure `next.config.js` to whitelist specific external image domains for `next/image` optimization.
- [ ] Implement Redis-based (via KV) or native middleware Rate Limiting on `/api/v1/auth/register` and `/api/v1/questions` POST routes.
- [ ] Ensure all API routes correctly type responses generating strict TypeScript interfaces.
- [ ] Perform manual edge-case testing: Attempt submitting answer as a guest (ensure correct redirect to login).

---

## 9. Final Review & Deployment
- [ ] Conduct final code cleanup (remove `console.log` statements and unused imports).
- [ ] Run production build locally (`npm run build`) to ensure no static generation compile errors.
- [ ] Verify Vercel deployment pipeline succeeds against `main` branch.
- [ ] Perform full manual E2E test on the production URL (Register -> Ask -> Answer -> Vote -> Accept).
- [ ] Update repository `README.md` with setup instructions and environment variable requirements for local development.
