// app/layout.tsx
// Root layout for the StackIt Next.js App Router application.
// Wraps every page with shared metadata, fonts, global styles, and the Navbar.

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import QueryProvider from '@/components/QueryProvider';

// Inter is the closest match to the clean sans-serif used in the UI designs.
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <QueryProvider>
          {/* Global navigation bar — present on every page */}
          <Navbar />
          {/* Main page content */}
          <main>{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}
