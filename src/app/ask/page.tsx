import { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AskQuestionForm } from '@/components/AskQuestionForm';

export const metadata: Metadata = {
    title: 'Ask a Question - StackIt',
    description: 'Ask the community for help with your technical problems.',
};

export default async function AskPage() {
    const session = await auth();

    if (!session) {
        redirect('/login?callbackUrl=/ask');
    }

    return (
        <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Ask a Public Question</h1>
                    <p className="mt-2 text-gray-600">
                        Join thousands of developers and get answers to your most challenging coding problems.
                    </p>
                </div>

                <div className="space-y-8">
                    {/* Question Guidelines */}
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                        <h2 className="text-blue-900 font-bold mb-3 flex items-center gap-2">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Writing a good question
                        </h2>
                        <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside ml-2">
                            <li>Summarize your problem in a one-line title.</li>
                            <li>Describe what you've tried and what you're expecting.</li>
                            <li>Add relevant tags to help other developers find your question.</li>
                            <li>Review your question before posting.</li>
                        </ul>
                    </div>

                    <AskQuestionForm />
                </div>
            </div>
        </div>
    );
}
