import React from 'react';

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(' ');
}

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
    /** Use for circles/avatars/etc. */
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
};

export function Skeleton({ className, rounded = 'md', ...props }: SkeletonProps) {
    const roundedClass =
        rounded === 'none' ? 'rounded-none' :
            rounded === 'sm' ? 'rounded' :
                rounded === 'md' ? 'rounded-md' :
                    rounded === 'lg' ? 'rounded-lg' :
                        'rounded-full';

    return (
        <div
            className={cn('animate-pulse bg-gray-200', roundedClass, className)}
            aria-hidden="true"
            {...props}
        />
    );
}

