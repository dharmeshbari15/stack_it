// app/layout.tsx
// Root layout for the StackIt Next.js App Router application.

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/Toaster';
import QueryProvider from '@/components/QueryProvider';
import SessionProvider from '@/components/SessionProvider';
import { AIChatbot } from '@/components/AIChatbot';
import { auth } from '@/auth';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'StackIt — Q&A for Developers',
    template: '%s | StackIt',
  },
  description:
    'StackIt is a minimal question-and-answer platform for collaborative learning and structured knowledge sharing among developers.',
  keywords: ['Q&A', 'developer forum', 'programming questions', 'StackIt'],
  openGraph: {
    title: 'StackIt — Q&A for Developers',
    description:
      'Ask questions, share answers, and grow together as a developer community.',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch the session server-side and pass it to SessionProvider so client
  // components get the session instantly without a loading state on first render.
  const session = await auth();

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Toaster />
        <SessionProvider session={session}>
          <QueryProvider>
            <Navbar />
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
            <AIChatbot />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
