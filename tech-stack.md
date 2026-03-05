# Technology Stack: StackIt MVP

## 1. Selection Principles
The technology stack for StackIt is chosen specifically for a solo developer operating with zero budget. Priority is given to absolute simplicity, zero financial risk (no credit cards required), rapid deployment, and minimal operational overhead. We favor deeply integrated meta-frameworks and managed serverless solutions over complex containerization or manual infrastructure provisioning. This ensures the developer can focus exclusively on shipping the 5-7 core MVP features rather than managing DevOps.

## 2. Architecture-to-Technology Mapping
Frontend SPA → Next.js (React) → Offers excellent developer experience, built-in API routes, and seamless zero-config Vercel deployment.
Backend API → Next.js API Routes → Eliminates the need for a separate Node.js/Express server repository, halving deployment complexity.
Database → PostgreSQL (Supabase) → Provides a robust relational DB with generous permanently free limits and no credit card requirement.
Rich Text Editor → TipTap → Highly customizable, headless, open-source React wrapper around ProseMirror; completely free.
Styling → Tailwind CSS → Utility-first CSS framework enabling rapid UI development directly within React components.

## 3. Frontend Stack
Technology: Next.js (using App Router)
Purpose: Core React framework handling routing, static generation, and React Server Components.
Why chosen: Industry standard, heavily documented, and natively integrates with our chosen hosting platform.
Free confirmation: Open-source (MIT license).

Technology: React Query (TanStack Query)
Purpose: Client-side data fetching, caching, and state management.
Why chosen: Simplifies asynchronous state drastically compared to Redux or raw Context API.
Free confirmation: Open-source (MIT license).

Technology: Tailwind CSS
Purpose: UI styling.
Why chosen: Eliminates context switching between CSS files and React components, accelerating solo development.
Free confirmation: Open-source (MIT license).

Technology: npm
Purpose: Package management.
Why chosen: Default Node package manager, zero configuration required.
Free confirmation: Free to use.

## 4. Backend Stack
Technology: Next.js API Routes (Node.js/TypeScript)
Purpose: Handling REST API requests and backend business logic.
Why chosen: Consolidates the code into a single repository (monorepo style) without needing separate Express servers.
Free confirmation: Open-source.

Technology: Prisma ORM
Purpose: Database communication, schema modeling, and migrations.
Why chosen: Provides absolute end-to-end type safety with TypeScript, drastically reducing runtime bugs for a solo dev.
Free confirmation: Open-source ORM (Apache 2.0).

Technology: NextAuth.js (Auth.js)
Purpose: Authentication and session management.
Why chosen: Native Next.js integration, secure by default, and seamlessly connects with Prisma.
Free confirmation: Open-source (ISC license).

## 5. Database
Type: Relational SQL
Engine: PostgreSQL
Hosting method: Supabase (Free Tier)
Backup strategy: Manual exports via Supabase dashboard (automated backups require paid tier).
Migration limitations: Handled exclusively through Prisma CLI; direct SQL modifications must be avoided to prevent schema drift.
Scaling limitations: Supabase Free tier is limited to 500MB database space and pauses after 1 week of inactivity (easily mitigated by routine solo dev interaction).

## 6. Hosting & Deployment
Frontend hosting: Vercel
Backend hosting: Vercel (Serverless Functions via Next.js API Routes)
Database hosting: Supabase

Free confirmation:
Vercel Hobby Tier: Permanently free, no credit card required, covers both frontend and serverless backend functions.
Supabase Free Tier: Permanently free, no credit card required for standard Postgres database provisioning.

Workflow: Git push to `main` branch on GitHub automatically triggers a Vercel build and deployment sequence. Prisma migrations are executed during the build step.

## 7. Development Environment
IDE: Visual Studio Code (VS Code)
Version control: Git & GitHub (Free Tier)
Local runtime: Node.js (v20 LTS)
Dependency management: npm
Testing tools: Vitest (for utility functions) / Playwright (for essential E2E flows)
All of the above are 100% free and open-source.

## 8. Authentication Strategy
Strategy: JWT (JSON Web Tokens)
Implementation: NextAuth.js configured with the Credentials provider (email/password).
Security: NextAuth automatically handles secure HttpOnly cookie generation, CSRF protection, and JWT encryption. Passwords will be hashed using `bcryptjs` before Prisma inserts them into Postgres.
Cost: Completely free, open-source library running within our Vercel functions, avoiding paid SaaS limits (like Auth0 or Clerk).

## 9. Monitoring & Logging
Logging method: Default Vercel Runtime Logs (console.log / console.error).
Error tracking: Vercel Dashboard (basic error inspection).
Debugging workflow: Replicating errors locally using `npm run dev` connected to a separate Supabase local/development database.
Cost: Vercel retains up to 1 hour (or 500 logs) on the free tier recursively.

## 10. Scalability Expectations
Expected scale limit: Up to ~10,000 monthly active users (dependent on Vercel Serverless Function execution limits and Supabase 500MB DB cap).
Performance constraints: Cold starts on Vercel Serverless Functions may occasionally push initial API response times slightly over the 500ms target during low traffic periods.
Bottlenecks: Database storage limits (500MB limit reached via aggressive text posting).
Migration triggers: Surpassing 500MB database boundary or exceeding Vercel's 100GB bandwidth limit requires migrating to a $25/mo Supabase tier or $20/mo Vercel Pro tier.

## 11. Migration Paths
When user scale or data size forces evolution:
1. Hosting: Vercel Hobby → Dockerized Next.js app deployed on Render or generic VPS (Hetzner/DigitalOcean) to escape serverless limits.
2. Database: Supabase Free → Supabase Pro (or direct managed AWS RDS if budget scales).
3. Backend: Next.js API Routes → Decoupled NestJS or Express server if background processing (e.g., cron jobs, heavy image processing) surpasses serverless execution time limits (10 seconds on Vercel Hobby).

## 12. Trade-offs
Trade-off 1: Reliance on Serverless Cold Starts
Deploying APIs on Vercel serverless functions means occasional latency spikes (cold starts) when functions wake up. This is acceptable for MVP as it trades minor latency for zero hosting costs and zero server maintenance.

Trade-off 2: Lack of Automated Database Backups
Supabase free tier does not provide automated Point-in-Time Recovery (PITR). This is acceptable for MVP; the solo developer must manually execute `pg_dump` or UI exports periodically.

Trade-off 3: Database Pausing
Supabase pauses free databases after 7 days of inactivity. This is acceptable as the developer will be actively building or checking the project weekly, and it takes only seconds to unpause via the dashboard if it occurs.
