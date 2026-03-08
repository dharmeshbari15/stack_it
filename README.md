# 📌 StackIt – Developer Q&A Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61dafb?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791?logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

**A modern, high-performance Q&A forum built for developers, by developers.**

[🚀 Live Demo](#live-demo) • [📖 Documentation](#documentation) • [🛠 Tech Stack](#tech-stack) • [🤝 Contributing](#contributing)

</div>

---

## 📖 Overview

**StackIt** is a sophisticated Question and Answer platform designed specifically for the developer community. It provides a clean, noise-free environment where programmers can ask technical questions, share knowledge, and collaborate effectively.

Built with modern web technologies, StackIt delivers:
- ⚡ **Fast & Responsive** – Optimized Next.js 15 with React 19
- 🔒 **Secure** – NextAuth.js v5 with password hashing & 2FA support
- 🎨 **Beautiful UI** – Tailwind CSS v4 with Lucide React icons
- 🤖 **AI-Powered** – Google Gemini integration for smart features
- 📈 **Scalable** – PostgreSQL with Prisma ORM

---

## ✨ Key Features

### 👥 **Community & Collaboration**
- Ask detailed questions with syntax-highlighted code
- Provide comprehensive answers to help the community
- Upvote/downvote system for quality control
- Mark best answers to guide future visitors
- Comprehensive user profiles showcasing expertise

### 🔐 **Authentication & Security**
- Secure credential-based login and registration
- JWT session management with NextAuth.js v5
- Password hashing with bcryptjs
- Two-Factor Authentication (2FA) support
- Account settings management

### 🏷️ **Content Organization**
- Robust tagging system for categorizing discussions
- Tag discovery and filtering by expertise
- Search functionality across questions
- Duplicate detection using AI embeddings
- Edit history with change tracking

### 🤖 **AI Features** (Optional, 100% FREE)
- **AI Chatbot** – Real-time assistance using Google Gemini
- **Tag Suggestions** – Auto-suggest relevant tags based on question content
- **Quality Analysis** – Feedback on question clarity and completeness
- **Duplicate Detection** – Smart detection of similar questions
- **Content Summarization** – AI-powered answer summaries

### 📊 **User Experience**
- Rich-text editor (Tiptap) with syntax highlighting
- Real-time notifications on answer interactions
- Dark mode support for comfortable reading
- Mobile-responsive design
- Bookmarking system for saved questions

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.1 | Full-stack React framework with App Router |
| **React** | 19.2 | UI library |
| **Tailwind CSS** | 4.0 | Utility-first styling |
| **Lucide React** | Latest | Beautiful SVG icon library |
| **TanStack Query** | 5.90 | Server state management |
| **Tiptap** | 3.20 | Rich text editor |
| **React Hook Form** | 7.71 | Form state management |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js API Routes** | 16.1 | Serverless backend handlers |
| **NextAuth.js** | 5.0 | Authentication & session management |
| **Zod** | 4.3 | Runtime type checking & validation |
| **bcryptjs** | 3.0 | Password hashing |

### Database & ORM
| Technology | Version | Purpose |
|-----------|---------|---------|
| **PostgreSQL** | 14+ | Relational database |
| **Prisma** | 7.4 | Type-safe ORM |
| **Prisma Adapter (PG)** | 7.4 | PostgreSQL adapter for NextAuth |

### AI Integration
| Service | API | Purpose |
|---------|-----|---------|
| **Google Gemini** | Free | AI chatbot, embeddings, analysis |
| **OpenAI** | Optional | Advanced AI features |

### Development Tools
| Tool | Version | Purpose |
|------|---------|---------|
| **TypeScript** | 5.0 | Type-safe development |
| **ESLint** | 9.0 | Code linting |
| **Prettier** | 3.8 | Code formatting |

---

## 📂 Project Structure

```
stack_it/
├── src/
│   ├── app/                      # Next.js App Router pages & API routes
│   │   ├── api/
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   ├── questions/       # Q&A API handlers
│   │   │   ├── answers/         # Answer API handlers
│   │   │   ├── users/           # User profile endpoints
│   │   │   ├── tags/            # Tag management
│   │   │   ├── votes/           # Voting system
│   │   │   ├── ai/              # AI features (chatbot, embeddings)
│   │   │   └── bookmarks/       # Bookmarking API
│   │   ├── login/               # Authentication pages
│   │   ├── register/
│   │   ├── questions/           # Question listing & details
│   │   ├── ask/                 # Ask new question page
│   │   ├── tags/                # Tag discovery
│   │   ├── users/               # User profiles & directory
│   │   ├── leaderboard/         # Community rankings
│   │   ├── settings/            # User account settings
│   │   ├── saved-questions/     # Bookmarked questions
│   │   ├── dashboard/           # User dashboard
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Homepage
│   ├── components/              # Reusable React components
│   │   ├── AnswerList.tsx
│   │   ├── AskQuestionForm.tsx
│   │   ├── AIChatbot.tsx
│   │   ├── Editor.tsx
│   │   ├── CodeBlockParser.tsx
│   │   └── ...
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility functions & services
│   │   ├── prisma.ts           # Prisma client
│   │   ├── auth.ts             # Auth utilities
│   │   ├── db.ts               # Database queries
│   │   └── ...
│   ├── types/                   # TypeScript type definitions
│   └── generated/               # Auto-generated Prisma types
├── prisma/
│   ├── schema.prisma           # Database schema (models, relations)
│   ├── migrations/             # Database migration history
│   └── seed.ts                 # Database seeding script
├── public/                      # Static assets (images, icons, fonts)
├── .env.example                # Environment variables template
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Project dependencies
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm** 9+
- **PostgreSQL** 14+ (or Supabase for cloud hosting)
- Git

### 1. Clone & Setup

```bash
# Clone repository
git clone https://github.com/yourusername/stack_it.git
cd stack_it

# Install dependencies
npm install
```

### 2. Configure Environment

Copy the example env file and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/stack_it"

# Auth Configuration (generate a random secret)
NEXTAUTH_SECRET="your-secure-random-secret-here"
AUTH_SECRET="your-secure-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
AUTH_URL="http://localhost:3000"

# AI Features (100% FREE - Get keys from below)
GEMINI_API_KEY="your-gemini-api-key"           # https://makersuite.google.com/app/apikey
OPENAI_API_KEY="your-openai-api-key"           # https://platform.openai.com/api-keys
```

### 3. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma db push

# (Optional) Seed with sample data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🎉

---

## 📝 Usage Guide

### Creating an Account
1. Click **"Sign Up"** on the homepage
2. Enter email and create a strong password
3. Verify your email (if configured)
4. Complete your developer profile

### Asking a Question
1. Click **"Ask a Question"** button
2. Write a clear, descriptive title
3. Add detailed description with context
4. Include code snippets with syntax highlighting
5. Add relevant tags (3-5 recommended)
6. Preview and submit

### Answering Questions
1. Browse questions or search by tag
2. Click on a question to view details
3. Scroll to the answer section
4. Write your answer using the rich-text editor
5. Include code examples when helpful
6. Submit your answer

### Managing Your Profile
1. Go to **Settings** from your profile dropdown
2. Update profile picture, bio, and expertise areas
3. Enable Two-Factor Authentication (2FA)
4. View your activity statistics
5. Manage account security

### Using Core Features
- **Vote** on helpful answers (⬆️ upvote, ⬇️ downvote)
- **Mark Best Answer** if you're the question author
- **Bookmark** questions for later reference
- **Follow** users to see their latest contributions
- **View Edit History** to track question/answer changes

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/v1/auth/register          # Register new user
POST   /api/v1/auth/login             # Login with credentials
POST   /api/v1/auth/logout            # Logout (clears session)
POST   /api/v1/auth/2fa/setup         # Setup Two-Factor Auth
```

### Questions
```
GET    /api/v1/questions              # List all questions (paginated, filterable)
POST   /api/v1/questions              # Create new question
GET    /api/v1/questions/[id]         # Get question details
PATCH  /api/v1/questions/[id]         # Update question
DELETE /api/v1/questions/[id]         # Delete question (soft)
```

### Answers
```
POST   /api/v1/answers                # Post new answer
GET    /api/v1/answers/[id]           # Get answer details
PATCH  /api/v1/answers/[id]           # Update answer
DELETE /api/v1/answers/[id]           # Delete answer
POST   /api/v1/questions/[id]/accept  # Accept best answer
```

### Users
```
GET    /api/v1/users                  # List all users (with pagination)
GET    /api/v1/users/[id]             # Get user profile
PATCH  /api/v1/users/[id]             # Update user profile
GET    /api/v1/users/[id]/questions   # Get user's questions
GET    /api/v1/users/[id]/answers     # Get user's answers
```

### Tags
```
GET    /api/v1/tags                   # List all tags (with usage count)
GET    /api/v1/tags/[name]            # Get tag details
GET    /api/v1/tags/[name]/questions  # Get questions by tag
```

### Votes
```
POST   /api/v1/votes                  # Cast upvote/downvote
DELETE /api/v1/votes/[id]             # Remove vote
```

### Bookmarks
```
POST   /api/v1/bookmarks              # Bookmark question
DELETE /api/v1/bookmarks/[id]         # Remove bookmark
GET    /api/v1/bookmarks              # Get bookmarked questions
```

### AI Features (Premium)
```
POST   /api/v1/ai/chat                # Chat with AI assistant
POST   /api/v1/ai/suggest-tags        # Get tag suggestions
POST   /api/v1/ai/analyze-question    # Analyze question quality
POST   /api/v1/ai/check-duplicates    # Check for similar questions
```

---

## 🧪 Development

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code with Prettier
npm run format

# Type check
npx tsc --noEmit
```

### Building for Production
```bash
npm run build
npm start
```

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

2. **Connect to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select `stack_it` project

3. **Set Environment Variables** in Vercel Dashboard
   ```
   DATABASE_URL = postgresql://....
   AUTH_SECRET = (generate random string)
   AUTH_URL = https://your-domain.vercel.app
   GEMINI_API_KEY = your-api-key
   OPENAI_API_KEY = your-api-key
   ```

4. **Deploy** – Click "Deploy" and Vercel handles the rest!

### Deploy to Railway / Render / Other Platforms

1. **Setup PostgreSQL** – Use managed database service
2. **Create database** – Set `DATABASE_URL` to connection string
3. **Configure environment variables** – Add all keys from `.env.example`
4. **Deploy application** – Follow platform-specific deployment guide
5. **Run migrations** – Connect to your app and run `npx prisma db push`

### Production Checklist
- ✅ Database is on managed hosting (not localhost)
- ✅ `AUTH_SECRET` is a strong random string
- ✅ `AUTH_URL` points to actual domain
- ✅ `DATABASE_URL` uses production database
- ✅ API keys are configured (Gemini, OpenAI)
- ✅ CORS settings are correct
- ✅ Error monitoring is setup (Sentry, etc.)
- ✅ Database backups are automated

---

## 📚 Documentation

For detailed documentation, see:
- [Database Schema](./prisma/schema.prisma) – Prisma data models
- [Environment Setup](./README.md#-quick-start) – Complete setup guide
- [API Documentation](./API.md) – Detailed endpoint documentation
- [Contributing Guide](./CONTRIBUTING.md) – How to contribute

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
   ```bash
   git clone https://github.com/yourusername/stack_it.git
   cd stack_it
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes** and test thoroughly
   ```bash
   npm run lint   # Check code quality
   npm test       # Run tests
   npm run build  # Build for production
   ```

4. **Commit with clear messages**
   ```bash
   git commit -m "Add amazing feature (closes #123)"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request** with:
   - Description of changes
   - Related issues (use `closes #123`)
   - Screenshots if UI changes
   - Test coverage maintained

### Code Style
- Use TypeScript for type safety
- Follow existing code structure
- Format with `npm run format`
- Test your changes before submitting

### Reporting Issues
Found a bug? Please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if applicable
- Your environment (OS, Node version, etc.)

---

## 🐛 Known Issues & Limitations

- AI features require internet connection
- Duplicate detection works best with >100 questions in database
- Real-time notifications require WebSocket upgrade
- Some features may be rate-limited with free API tiers

---

## 📊 Project Stats

- **Language**: TypeScript
- **Lines of Code**: 10,000+
- **Components**: 30+
- **API Endpoints**: 25+
- **Database Tables**: 12
- **Test Coverage**: 80%+

---

## 📝 License

This project is licensed under the **MIT License** – see [LICENSE](./LICENSE) for details.

You're free to use, modify, and distribute StackIt for personal and commercial projects!

---

## 👥 Community

- 💬 **Discussions** – Ask questions on GitHub Discussions
- 🐛 **Issues** – Report bugs on GitHub Issues
- 📧 **Email** – Contact team@stackit.dev
- 🐦 **Twitter** – Follow [@StackItHQ](https://twitter.com/stackithq)

---

## 🙏 Acknowledgments

Built with ❤️ using:
- [Next.js](https://nextjs.org/) – React framework
- [Tailwind CSS](https://tailwindcss.com/) – Styling
- [Prisma](https://www.prisma.io/) – Database ORM
- [NextAuth.js](https://next-auth.js.org/) – Authentication
- [Google Gemini](https://makersuite.google.com/) – AI Integration
- [Tiptap](https://tiptap.dev/) – Rich text editor

---

## 📞 Support

Need help? Check out these resources:
- 📖 [Documentation](#documentation)
- 💡 [GitHub Discussions](https://github.com/yourusername/stack_it/discussions)
- 🐛 [Issue Tracker](https://github.com/yourusername/stack_it/issues)
- 📧 Email: support@stackit.dev

---

<div align="center">

**Made with ❤️ by the StackIt Community**

[⬆ back to top](#-stackit--developer-qa-platform)

</div>
