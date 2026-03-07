// components/SavedQuestionsFilter.tsx
'use client';

interface SavedQuestionsFilterProps {
    tags: string[];
    totalBookmarks: number;
    selectedTag?: string | null;
    onTagSelect: (tag: string | null) => void;
}

export const SavedQuestionsFilter: React.FC<SavedQuestionsFilterProps> = ({
    tags,
    totalBookmarks,
    selectedTag,
    onTagSelect,
}) => {
    const handleSelectTag = (tag: string | null) => {
        onTagSelect(tag);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
                📌 Filter by Custom Tag
            </h3>

            <div className="flex flex-wrap gap-2">
                {/* "All" button */}
                <button
                    onClick={() => handleSelectTag(null)}
                    className={`px-3 py-1 text-sm rounded transition ${
                        !selectedTag
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    All Bookmarks ({totalBookmarks})
                </button>

                {/* Individual tags */}
                {tags.length > 0 ? (
                    tags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => handleSelectTag(tag)}
                            className={`px-3 py-1 text-sm rounded transition ${
                                selectedTag === tag
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-yellow-50 text-yellow-800 border border-yellow-200 hover:bg-yellow-100'
                            }`}
                        >
                            {tag}
                        </button>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 italic">
                        No custom tags yet. Add tags to your bookmarks to organize them!
                    </p>
                )}
            </div>
        </div>
    );
};
