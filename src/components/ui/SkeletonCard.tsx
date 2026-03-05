// components/ui/SkeletonCard.tsx
// Pulse-animated placeholder cards matching the question card shape from UI/Image 1.png.
// Used while React Query is fetching data — prevents layout shift.

interface SkeletonCardProps {
    /** Number of skeleton cards to render */
    count?: number;
}

function SkeletonLine({ width = 'w-full' }: { width?: string }) {
    return (
        <div className={`h-3 animate-pulse rounded bg-gray-200 ${width}`} />
    );
}

function SingleSkeletonCard() {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            {/* Stats column + content row (matches question card layout) */}
            <div className="flex gap-4">
                {/* Vote / answer counts column */}
                <div className="flex w-14 shrink-0 flex-col items-center gap-3 pt-1">
                    <div className="h-8 w-10 animate-pulse rounded bg-gray-200" />
                    <div className="h-8 w-10 animate-pulse rounded bg-gray-200" />
                </div>

                {/* Question content */}
                <div className="flex flex-1 flex-col gap-3">
                    {/* Title */}
                    <SkeletonLine width="w-3/4" />
                    {/* Body excerpt */}
                    <SkeletonLine />
                    <SkeletonLine width="w-5/6" />

                    {/* Tags row */}
                    <div className="flex gap-2 pt-1">
                        <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
                        <div className="h-5 w-14 animate-pulse rounded-full bg-gray-200" />
                        <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200" />
                    </div>

                    {/* Author + timestamp */}
                    <div className="flex items-center gap-2 pt-1">
                        <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200" />
                        <SkeletonLine width="w-24" />
                        <SkeletonLine width="w-20" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SkeletonCard({ count = 3 }: SkeletonCardProps) {
    return (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading questions">
            {Array.from({ length: count }).map((_, i) => (
                <SingleSkeletonCard key={i} />
            ))}
        </div>
    );
}
