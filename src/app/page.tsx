import Link from 'next/link';
import { QuestionList } from '@/components/QuestionList';
import { auth } from '@/auth';

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="px-4 py-16 sm:py-24 text-center border-b border-gray-100 bg-white">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 max-w-4xl mx-auto">
          Every Developer Has a Question. <br className="hidden sm:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Find Your Answer on StackIt.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          StackIt is a minimal, developer-focused Q&A platform designed for collaborative learning, fast answers, and structured knowledge sharing.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto">
          <Link
            href="/ask"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-600 text-white font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Ask a Question
          </Link>
          <Link
            href={isLoggedIn ? "/users" : "/register"}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-gray-900 font-semibold ring-1 ring-inset ring-gray-200 shadow-sm hover:bg-gray-50 transition-all active:scale-95"
          >
            {isLoggedIn ? "Go to Community" : "Join Community"}
          </Link>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Latest Questions</h2>
            <div className="flex gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <span className="text-sm font-medium text-blue-600">Newest</span>
            </div>
          </div>

          <QuestionList />
        </div>
      </div>

      {/* Feature Highlights - Compact Footer Style */}
      <section className="bg-white py-12 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Markdown Support</h3>
              <p className="text-sm text-gray-500">Ask with rich formatting and code snippets.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Community Voting</h3>
              <p className="text-sm text-gray-500">Find the best answers through community upvotes.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Tag Filtering</h3>
              <p className="text-sm text-gray-500">Filter questions by specialized technology tags.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
