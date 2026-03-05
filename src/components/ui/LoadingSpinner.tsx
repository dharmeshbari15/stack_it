// components/ui/LoadingSpinner.tsx
// Reusable loading indicator in three size variants.
// Use as a full-page blocker or inline within cards/buttons.

interface LoadingSpinnerProps {
    /** Visual size of the spinner */
    size?: 'sm' | 'md' | 'lg';
    /** Accessible label describing what is loading */
    label?: string;
    /** When true, centers the spinner inside a full-height container */
    fullPage?: boolean;
}

const sizeMap = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
};

export default function LoadingSpinner({
    size = 'md',
    label = 'Loading…',
    fullPage = false,
}: LoadingSpinnerProps) {
    const spinner = (
        <div
            role="status"
            aria-label={label}
            className="flex flex-col items-center gap-3"
        >
            <div
                className={`
          animate-spin rounded-full border-gray-200 border-t-blue-600
          ${sizeMap[size]}
        `}
            />
            {size !== 'sm' && (
                <span className="text-sm text-gray-500">{label}</span>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                {spinner}
            </div>
        );
    }

    return spinner;
}
