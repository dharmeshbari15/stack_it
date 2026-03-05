# Technical Design Document: StackIt MVP

## 1. System Overview
StackIt is a minimal question-and-answer platform utilizing a modular monolith architecture. It consists of a single-page application (SPA) client, a monolithic backend API, and a relational database. The system boundary encompasses user registration, content management (questions/answers), voting mechanics, and internal notification distribution. All external communications are limited to transactional email services and cloud media storage. The design strictly prioritizes rapid content rendering and seamless user interaction without introducing unwarranted distributed complexity for MVP.

## 2. Architecture Description
The system relies on a classic three-tier web architecture. The Client interacts with Backend Services exclusively via RESTful JSON APIs. Backend Services validate incoming business logic, sanitize user inputs, and process asynchronous events like notifications via an in-memory or lightweight external event queue. Data flows from the Backend Services to the central Database for persistent storage. External services are utilized for static asset delivery (CDN), transactional emails, and secure media uploads, keeping the core system footprint minimal.

## 3. Architecture Style
- Modular Monolith

Justification: The PRD defines a strictly scoped MVP with 5-7 core features and up to 10,000 concurrent user sessions. A modular monolith provides the simplest development, deployment, and operational overhead while maintaining logical boundaries between domains (users, Q&A, notifications). It avoids the latency, orchestration, and infrastructure complexity of microservices, aligning perfectly with MVP performance and maintainability goals.

## 4. Technology Stack
Frontend:
- Framework: React (Next.js with static site generation for specific pages)
- State Management: React Context API combined with React Query
- UI Libraries: Tailwind CSS for styling, TipTap (or similar) for rich text editing

Backend:
- Language: TypeScript / Node.js
- Framework: Express.js or NestJS

Database:
- Type: PostgreSQL (Relational)
- Justification: Best suited for structured data, complex relational queries (users, posts, votes), and reliable ACID transactions.

Infrastructure:
- Hosting Environment: Vercel for Frontend, Render or AWS ECS for Backend
- CI/CD Pipeline: GitHub Actions
- Containerization: Docker (for backend deterministic deployments)

Brief justification: This stack emphasizes developer productivity, strict type safety (TypeScript end-to-end), and excellent frontend caching capabilities critical for the fast guest load time requirement.

## 5. Data Model Design

User
- Primary key: `id` (UUID)
- Fields: `username` (VARCHAR), `email` (VARCHAR), `password_hash` (VARCHAR), `role` (ENUM: guest, user, admin), `created_at` (TIMESTAMP)
- Foreign keys: None
- Relationships: 1:N with Question, Answer, Vote, Notification
- Constraints: Email and username unique. Password required for non-guests.
- Index strategy: B-Tree index on `username` and `email`.

Question
- Primary key: `id` (UUID)
- Fields: `title` (VARCHAR), `description` (TEXT), `accepted_answer_id` (UUID, nullable), `created_at` (TIMESTAMP), `deleted_at` (TIMESTAMP, nullable)
- Foreign keys: `author_id` -> User(`id`)
- Relationships: 1:N with Answer, 1:N with QuestionTag
- Constraints: Title not null. Valid author required.
- Index strategy: Index on `created_at` for sorting feed.

Answer
- Primary key: `id` (UUID)
- Fields: `body` (TEXT), `score` (INTEGER, default 0), `created_at` (TIMESTAMP), `deleted_at` (TIMESTAMP, nullable)
- Foreign keys: `question_id` -> Question(`id`), `author_id` -> User(`id`)
- Relationships: N:1 with Question, 1:N with Vote
- Constraints: Body not null.
- Index strategy: Index on `question_id` and `score`.

Tag
- Primary key: `id` (UUID)
- Fields: `name` (VARCHAR)
- Foreign keys: None
- Relationships: 1:N with QuestionTag
- Constraints: Name unique.
- Index strategy: Unique index on `name`.

QuestionTag
- Primary key: Composite (`question_id`, `tag_id`)
- Fields: None
- Foreign keys: `question_id` -> Question(`id`), `tag_id` -> Tag(`id`)
- Relationships: Junction table
- Constraints: Unique pair.
- Index strategy: Index on `tag_id`.

Vote
- Primary key: Composite (`user_id`, `answer_id`)
- Fields: `value` (SMALLINT, 1 or -1)
- Foreign keys: `user_id` -> User(`id`), `answer_id` -> Answer(`id`)
- Relationships: Junction table
- Constraints: One vote per user per answer.
- Index strategy: PK acts as index.

Notification
- Primary key: `id` (UUID)
- Fields: `type` (ENUM), `reference_id` (UUID), `is_read` (BOOLEAN), `created_at` (TIMESTAMP)
- Foreign keys: `user_id` -> User(`id`), `actor_id` -> User(`id`)
- Relationships: N:1 with User
- Constraints: Cannot notify self.
- Index strategy: Index on `user_id` and `is_read`.

## 6. API Design

Endpoint: `/api/v1/auth/register`
HTTP Method: POST
Purpose: Create user account
Authentication requirement: None
Request schema: `{ username, email, password }`
Response schema: `{ id, username, email, token }`
Error codes: 400, 409

Endpoint: `/api/v1/auth/login`
HTTP Method: POST
Purpose: Authenticate user
Authentication requirement: None
Request schema: `{ email, password }`
Response schema: `{ id, username, token }`
Error codes: 401

Endpoint: `/api/v1/questions`
HTTP Method: GET
Purpose: Retrieve active questions
Authentication requirement: None
Request schema: `?page=&limit=&tag=`
Response schema: `{ questions: [...], total_pages }`
Error codes: 400

Endpoint: `/api/v1/questions`
HTTP Method: POST
Purpose: Submit new question
Authentication requirement: Required
Request schema: `{ title, description, tags: [] }`
Response schema: `{ id, title, created_at }`
Error codes: 400, 401

Endpoint: `/api/v1/questions/:id`
HTTP Method: GET
Purpose: Fetch question and nested answers
Authentication requirement: None
Request schema: `id` param
Response schema: `{ id, title, description, tags, answers: [...] }`
Error codes: 404

Endpoint: `/api/v1/questions/:id/answers`
HTTP Method: POST
Purpose: Append answer to question
Authentication requirement: Required
Request schema: `{ body }`
Response schema: `{ id, body, created_at }`
Error codes: 400, 401, 404

Endpoint: `/api/v1/answers/:id/vote`
HTTP Method: POST
Purpose: Vote on answer
Authentication requirement: Required
Request schema: `{ value }`
Response schema: `{ updated_score }`
Error codes: 401, 404

Endpoint: `/api/v1/questions/:id/accept-answer`
HTTP Method: PATCH
Purpose: Accept answer
Authentication requirement: Required (Question Author)
Request schema: `{ answer_id }`
Response schema: `{ success }`
Error codes: 401, 403, 404

Endpoint: `/api/v1/notifications`
HTTP Method: GET
Purpose: Retrieve notifications
Authentication requirement: Required
Request schema: `?limit=`
Response schema: `{ unread_count, notifications: [...] }`
Error codes: 401

Versioning strictly maps to path-based structures (`/v1/`) ensuring clear demarcations for future mobile iterations.

## 7. UI Interaction Mapping
Home/Feed Screen → `GET /api/v1/questions` → Question, Tag, User
Question Detail Screen → `GET /api/v1/questions/:id` → Question, Answer, User, Vote
Ask Question Screen → `POST /api/v1/questions` → Question, Tag, QuestionTag
Login Modal/Screen → `POST /api/v1/auth/login` → User
Notification Dropdown → `GET /api/v1/notifications` → Notification, User

## 8. Application Flow
Authentication Workflow:
1. Guest enters credentials.
2. Frontend sends `POST /api/v1/auth/login`.
3. Backend validates password hash and issues JWT context cookie.
4. UI transitions to authenticated mode, revealing the notification bell.

Primary Feature Workflow (Asking a Question):
1. User opens "Ask Question" UI.
2. Inputs title, formats body, assigns tags.
3. Submits forms invoking `POST /api/v1/questions`.
4. Backend purifies HTML payload, performs DB inserts, and returns success state.
5. Client performs a frontend router push directly to the newly crafted question sequence.

Edge Case Workflow: Submitting an Answer Lacking Authentication:
1. Guest attempts local text draft submission on an Answer block.
2. Form validator captures state and intercepts network transmission.
3. Client natively renders a modal demanding authentication execution.
4. Draft data is preserved until successful auth redirects back seamlessly resuming context.

## 9. State Management Strategy
Client state uses React Query for asynchronous synchronization linking UI elements to backend payloads efficiently. Local UI forms invoke standard React `useState`. Caching predominantly targets Home and Question view arrays utilizing browser RAM efficiently across navigations, invalidating locally solely during deliberate mutation success scenarios. Polling or background cache refreshes trigger actively resolving synchronous synchronization updates dynamically. Offline handling is excluded matching initial non-goal limitations.

## 10. Security Design
Authentication relies on stateless HttpOnly flagged JWT cookies preventing Cross-Site Scripting (XSS) payload interception. Authorization middleware performs distinct role bounding against Admin and User tiers evaluating specific ownership metrics per DB validation. Data protection ensures all user passwords utilize bcrypt algorithm execution alongside distinct hashing rounds parameterization. Rate limiting deploys Redis sliding window thresholds blocking excessive unauthenticated `/v1/auth` activity.

## 11. Performance Design
Scaling configurations aim for 10,000 uniquely active session metrics resolving core read transactions under ~500ms bounds. Throughput is expanded utilizing horizontal replicated Node.js backend cluster pools alongside distinct read-replica PostgreSQL instantiations ensuring analytical separation. The frontend employs expansive Global CDN caching methodologies strictly limiting latency bounds successfully beneath universally mandated 1.2s criteria limits unconditionally.

## 12. Failure Handling
Network disconnects explicitly prompt fallback toast messages notifying clients contextually. Backend container termination events invoke orchestrated Docker restart directives restoring node balance automatically avoiding global downtime metrics. Partial data updates stemming from unexpected interruptions fail via strict database transaction rollbacks. Third-party messaging (email/image delivery) utilizes an immediate external circuit breaker sequence enforcing asynchronous asynchronous retries locally circumventing primary operational execution delays.

## 13. Logging & Monitoring
Key event tracing categorizes and stores unhandled runtime exceptions concurrently with excessive failed authentication occurrences ensuring audit integrity. Operational metrics leverage Prometheus exposing HTTP cycle resolutions validating latency alignment. Automated alerting sequences utilize WebHook configurations targeting core platform administrative chat applications reporting systemic 5xx deviations promptly during operational traffic peaks exceeding 1% thresholds instantly.

## 14. Deployment Strategy
Environments establish discrete staging and production domains isolated absolutely limiting interaction cross-contamination. CI/CD deployments rely firmly upon GitHub Actions orchestrating exhaustive test coverage boundaries asserting release qualification thresholds successfully upon feature merges. Versioning follows strict semver paradigms corresponding natively to container tags. Rollback methodologies ensure instant deterministic previous container image deployment mitigating cascading failure propagation organically over minimal temporal bounds.

## 15. Trade-offs & Alternatives
Trade-off 1: Choosing a Monolith over Microservices
A monolith limits independent functional scaling per service. However, it minimizes orchestrational and network dependency complexity fundamentally maximizing immediate delivery velocity targeting MVP boundaries optimally.

Trade-off 2: Polling vs. WebSockets for Notifications
While WebSockets establish continuous persistent synchronization layers efficiently, they demand massive constant infrastructure persistence states natively. Polling simplifies routing significantly at slight asynchronous resolution costs logically mapping perfectly alongside original PRD limitations intentionally.

Trade-off 3: JWTs vs Stateful Sessions
JWTs cannot be instantly invalidated individually across the system natively. However, they drastically decrease continuous database validation queries inherently removing central chokepoints logically satisfying core latency demands specifically.

## 16. Architecture Risks
Risk: Unbounded text payloads crashing database capabilities.
Impact: Severe latency increases cascading into denial of service circumstances.
Mitigation: Enforce hard character limit constraints at the schema level alongside aggressive frontend validation.

Risk: Unindexed tag database queries slowing feed sorting operations.
Impact: Systemic read latency dramatically breaching target 500ms bounds.
Mitigation: Implement explicit composite indexing across the QuestionTag junction architecture.

Risk: External email API provider outage hindering account verification.
Impact: Inability to bootstrap new platform users.
Mitigation: Deploy an abstract interface adapter enabling instantaneous switching to a backup transactional vendor.

## 17. PRD Traceability
FR-1 (Fast guest read access) → Core Monolith API → `GET /api/v1/questions` → Question Entity
FR-2 (Secure user registration) → Auth Module → `POST /api/v1/auth/register` → User Entity
FR-3 (Tag validation) → Request Validator (Zod) → `POST /api/v1/questions` → Question, Tag
FR-4 (Rich text sanitization) → DOMPurify Middleware → Data Model → Question & Answer
FR-5 (Voting mechanism) → Voting Service → `POST /api/v1/answers/:id/vote` → Vote Entity
FR-6 (Accepting answers) → Ownership Validator → `PATCH /api/v1/questions/:id/accept-answer` → Question
FR-7 (Guest post restriction) → JWT Middleware → Route Protection → N/A
FR-8 (Mentions parsing) → Event Bus → Notification Entity
FR-9 (Notification dropdown) → Notification Service → `GET /api/v1/notifications` → Notification
FR-10 (Admin soft deletion) → Role Validator → `DELETE /api/v1/system/posts/:id` → Question, Answer
FR-11 (User profile aggregation) → Profile Service → `GET /api/v1/users/:id/posts` → Question, Answer
FR-12 (Editing authored posts) → Ownership Validator → `PATCH /api/v1/posts/:id` → Question, Answer

## 18. Open Technical Questions
- While caching public endpoints is defined, what exact mechanism will invalidate CDN caching layers specifically upon new question generation?
- Given the requirement for aggressive XSS prevention, what specific established NodeJS library guarantees sufficient complex HTML sanitization without irreparably mangling structural formatting output?
- Does the "Admin" role definitively necessitate a completely segregated internal visual interface dashboard, or are administrative powers simply injected seamlessly augmenting the standard public UI?
- Considering password resets depend upon the external email provider, what specific time-to-live stringency strictly governs secure password reset algorithms natively?
