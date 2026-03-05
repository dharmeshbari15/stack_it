import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 max-w-4xl">
          Every Developer Has a Question. <br className="hidden sm:block" />
          <span className="text-blue-600">Find Your Answer on StackIt.</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          StackIt is a minimal, developer-focused Q&A platform designed for collaborative learning, fast answers, and structured knowledge sharing.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mx-auto">
          <Link
            href="/questions"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Explore Questions
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-gray-900 font-semibold ring-1 ring-inset ring-gray-300 shadow-sm hover:bg-gray-50 transition"
          >
            Join the Community
          </Link>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Ask Freely</h3>
              <p className="text-gray-600">Got stuck? Post your question using Markdown. Format your code snippets and get help fast.</p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Upvote & Accept</h3>
              <p className="text-gray-600">Upvote the best answers so they bubble to the top. Accept the correct answer to help others.</p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Tag & Filter</h3>
              <p className="text-gray-600">Browse questions by technology stack using organized tags. Find relevant problems instantly.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
