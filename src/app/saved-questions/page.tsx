// app/saved-questions/page.tsx
import { Metadata } from 'next';
import { SavedQuestionsPage } from '@/components/SavedQuestionsPage';

export const metadata: Metadata = {
    title: 'Saved Questions | Stack It',
    description: 'View and manage your saved questions with custom tags and organization.',
};

export default function SavedQuestionsRoute() {
    return (
        <main className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SavedQuestionsPage />
            </div>
        </main>
    );
}
