# 📌 StackIt

> A minimal, high-performance Q&A forum platform for developers.

## 📖 Overview

StackIt is a sophisticated Question and Answer platform designed specifically for the developer community. It exists to provide a clean, noise-free environment where programmers can ask technical questions, share knowledge, and collaborate effectively. It is built for developers seeking a modern, fast, and reliable alternative for technical discussions.

## ✨ Features

- **Authentication & Security**: Secure credential-based login, JWT session management, password hashing, and Two-Factor Authentication (2FA) support.
- **Rich Q&A Ecosystem**: Ask detailed questions, provide answers, and engage with the community using a rich-text editor (Tiptap) with syntax highlighting.
- **Dynamic Community System**: Upvote/downvote content, accept best answers, and categorize discussions using a robust tagging system.
- **Comprehensive User Profiles**: Manage account settings, view contribution tallies, and showcase technical expertise in a public developer profile.

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide React
- **Backend**: Next.js Route Handlers (API), NextAuth.js v5
- **Database**: PostgreSQL (via Supabase), Prisma ORM
- **Tools & Libraries**: TanStack Query (React Query), Tiptap Editor, Zod (Validation), React Hook Form, bcryptjs

## 📂 Project Structure

```text
stack_it/
├── prisma/               # Database schema and migrations
├── public/               # Static assets (images, icons)
├── src/
│   ├── app/              # Next.js App Router (Pages & API Routes)
│   │   ├── api/          # Backend API handlers (v1)
│   │   ├── (auth)/       # Authentication pages (login, register)
│   │   ├── questions/    # Q&A browsing and detailed views
│   │   ├── settings/     # User account management
│   │   ├── tags/         # Tag discovery and filtering
│   │   └── users/        # Community directory and profiles
│   ├── components/       # Reusable React UI components
│   └── lib/              # Utility functions and Prisma client setup
├── .env                  # Environment variables
├── next.config.ts        # Next.js configuration
├── package.json          # Project dependencies and scripts
└── tailwind.config.ts    # Tailwind CSS styling configuration
```

Brief explanation of important directories:
- `src/app`: Contains the routing logic, page components, and the backend REST API structured under `api/v1`.
- `src/components`: Houses the modular UI components, including the rich text editor, navigation bar, and interactive cards.
- `prisma`: Stores the `schema.prisma` file defining the relational database models (User, Question, Answer, Tag, Vote).

## ⚙️ Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/stack_it.git
cd stack_it
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory and add the following:
```env
DATABASE_URL="postgresql://user:password@host:port/dbname?pgbouncer=true"
NEXTAUTH_SECRET="your_secure_random_string"
NEXTAUTH_URL="http://localhost:3000"

# Optional: AI Features (100% FREE with Google Gemini!)
GEMINI_API_KEY="AIza...your-key-here"
```

> **Note:** AI features (chatbot, tag suggestions, quality analysis, duplicate detection) are optional and use Google Gemini's free API. Get your key at [aistudio.google.com](https://aistudio.google.com/app/apikey)

4. Run database migrations
```bash
npx prisma generate
npx prisma db push
```

5. Run the project
```bash
npm run dev
```

## ▶️ Usage

- **Start Development Server**: Run `npm run dev` and navigate to `http://localhost:3000`.
- **Create an Account**: Visit `/register` to create a new developer profile.
- **Ask a Question**: Click "Ask a Question" on the homepage or navigation bar to start a new discussion.
- **Manage Settings**: Go to your profile dropdown and select "Settings" to update your username, email, or toggle 2FA.

## 📸 Screenshots (Optional)

TODO: Add details

## 🔌 API Endpoints (Optional)

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | Register a new user account |
| GET | `/api/v1/users` | Fetch a paginated list of community users |
| PATCH | `/api/v1/users/[id]` | Update user profile and security settings |
| GET | `/api/v1/questions` | Retrieve questions with optional tag filtering |
| POST | `/api/v1/questions` | Create a new technical question |
| DELETE | `/api/v1/questions/[id]` | Soft-delete a question (author only) |
| POST | `/api/v1/answers` | Submit an answer to a specific question |
| POST | `/api/v1/votes` | Cast an upvote or downvote on an answer |

## 🧪 Testing (Optional)

TODO: Add details

## 🚀 Deployment (Optional)

1. Deploy the PostgreSQL database to a provider like Supabase.
2. Ensure the `DATABASE_URL` is configured correctly for your hosting environment.
3. Deploy the Next.js application to your preferred hosting platform.
4. Add the `NEXTAUTH_SECRET` and `NEXTAUTH_URL` environment variables in your hosting platform's dashboard.

### Vercel Auth.js Notes

For Auth.js v5 deployments on Vercel, set these production environment variables:

- `DATABASE_URL` to a hosted Postgres connection string (for example Supabase/Neon). Do not use `localhost` or `127.0.0.1` in production.
- `AUTH_SECRET` (or `NEXTAUTH_SECRET`) to a strong random value
- `AUTH_URL` (or `NEXTAUTH_URL`) to your deployed site URL (for example `https://your-app.vercel.app`)
- `AUTH_TRUST_HOST=true` when behind reverse proxies/load balancers

If login fails with a configuration/host error in production, first verify these values in the Vercel dashboard.

## 🤝 Contributing

We welcome contributions to StackIt!

- Fork the repo
- Create a branch (`git checkout -b feature/amazing-feature`)
- Commit your changes (`git commit -m 'Add some amazing feature'`)
- Push to the branch (`git push origin feature/amazing-feature`)
- Submit a PR

## 📜 License

This project is licensed under the MIT License.

## 👤 Author

Developed by the StackIt Team.
