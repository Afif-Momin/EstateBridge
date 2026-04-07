import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '', count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        aria-hidden="true"
        className={`animate-pulse bg-gray-200 rounded ${className}`}
      />
    ))}
  </>
);

export const PropertyCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" aria-hidden="true">
    <Skeleton className="h-48 w-full rounded-none" />
    <div className="p-4 space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  </div>
);

export default Skeleton;
