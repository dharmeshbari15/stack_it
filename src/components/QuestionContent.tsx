'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';

interface Author {
    id: string;
    username: string;
}

interface Question {
    id: string;
    title: string;
    description: string;
    author: Author;
    tags: string[];
    created_at: string;
    accepted_answer_id: string | null;
}

interface QuestionContentProps {
    question: Question;
}

export function QuestionContent({ question }: QuestionContentProps) {
    const sanitizedContent = DOMPurify.sanitize(question.description);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
                        {question.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                {question.author.username[0].toUpperCase()}
                            </div>
                            {question.author.username}
                        </div>
                        <span>•</span>
                        <time dateTime={question.created_at}>
                            Asked {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                        </time>
                    </div>
                </div>

                <div className="prose prose-blue max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    {question.tags.map((tag) => (
                        <Link
                            key={tag}
                            href={`/questions?tag=${tag}`}
                            className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 hover:bg-blue-100 transition-colors"
                        >
                            {tag}
                        </Link>
                    ))}
                </div>
            </div>

            <style jsx global>{`
        .prose pre {
          background: #1e1e1e;
          color: #d4d4d4;
          padding: 1.25rem;
          border-radius: 0.75rem;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          margin: 1.5rem 0;
          overflow-x: auto;
        }
        .prose blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1.5rem;
          color: #4b5563;
          font-style: italic;
          margin: 1.5rem 0;
        }
        .prose code:not(pre code) {
          background: #f3f4f6;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          color: #1f2937;
        }
      `}</style>
        </div>
    );
}
