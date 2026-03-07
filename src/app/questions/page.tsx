// app/questions/page.tsx
import { QuestionList } from '@/components/QuestionList';
import { SearchFilters } from '@/components/SearchFilters';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const metadata = {
    title: 'Questions',
    description: 'Browse all developer questions on StackIt.'
};

export default function QuestionsPage() {
    return (
        <main className="mx-auto max-w-7xl px-4 py-12">
            <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
                        All Questions
                    </h1>
                    <p className="text-gray-500 font-medium">
                        Explore the latest community discussions and technical challenges.
                    </p>
                </div>

                <Link
                    href="/ask"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-blue-100 transition hover:bg-blue-700 active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    Ask Question
                </Link>
            </header>

            <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden p-6 space-y-6">
                <SearchFilters showSearch />
                <QuestionList />
            </div>
        </main>
    );
}
