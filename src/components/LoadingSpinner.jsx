import React from 'react';

/**
 * Loading Spinner Component
 * Displays a loading indicator with optional message
 */
const LoadingSpinner = ({ 
  size = 'medium', 
  message, 
  fullScreen = false,
  className = '' 
}) => {
  // Size classes
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const spinner = (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Outer ring */}
      <div className={`absolute inset-0 border-2 border-gray-300 dark:border-gray-600 rounded-full`}></div>
      {/* Spinning ring */}
      <div className={`absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin`}></div>
    </div>
  );

  const content = (
    <div className="flex flex-col items-center justify-center">
      {spinner}
      {message && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50 ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      {content}
    </div>
  );
};

/**
 * Page Loading Component
 * Full-page loading state for route transitions
 */
export const PageLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <LoadingSpinner size="xlarge" />
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 font-medium animate-pulse">
        {message}
      </p>
    </div>
  );
};

/**
 * Inline Loading Component
 * Smaller loading indicator for inline content
 */
export const InlineLoader = ({ message }) => {
  return (
    <div className="flex items-center justify-center p-4 space-x-3">
      <LoadingSpinner size="small" />
      {message && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {message}
        </span>
      )}
    </div>
  );
};

/**
 * Skeleton Loader Component
 * Placeholder loading for content
 */
export const SkeletonLoader = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index}
          className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${
            index === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  );
};

/**
 * Card Skeleton Loader
 * Placeholder for loading cards
 */
export const CardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Table Row Skeleton Loader
 * Placeholder for loading table rows
 */
export const TableRowSkeleton = ({ columns = 4, rows = 5, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex items-center space-x-4 p-3 bg-white dark:bg-gray-800 rounded-lg"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${
                colIndex === 0 ? 'w-1/4' : 
                colIndex === columns - 1 ? 'w-16' : 'w-1/3'
              }`}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Form Skeleton Loader
 * Placeholder for loading form fields
 */
export const FormSkeleton = ({ fields = 3, includeButton = true, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      ))}
      {includeButton && (
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mt-6"></div>
      )}
    </div>
  );
};

/**
 * Image Skeleton Loader
 * Placeholder for loading images and media
 */
export const ImageSkeleton = ({ aspectRatio = '16/9', className = '' }) => {
  const aspectClasses = {
    '1/1': 'aspect-square',
    '4/3': 'aspect-4/3',
    '16/9': 'aspect-video',
    '9/16': 'aspect-[9/16]',
    '3/4': 'aspect-3/4'
  };

  return (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse ${aspectClasses[aspectRatio] || 'aspect-video'} ${className}`}>
      <div className="w-full h-full flex items-center justify-center">
        <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>
  );
};

/**
 * Dashboard Card Skeleton
 * Placeholder for dashboard statistics cards
 */
export const DashboardCardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
      </div>
      <div className="mt-4 h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full w-2/3 bg-gray-200 dark:bg-gray-600 animate-pulse rounded-full"></div>
      </div>
    </div>
  );
};

/**
 * Alert Card Skeleton
 * Placeholder for alert list items
 */
export const AlertCardSkeleton = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-[2rem] p-6 border border-gray-100 ${className}`}>
      <div className="flex items-center gap-6">
        {/* Left: Icon placeholder */}
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        
        {/* Middle: Content */}
        <div className="flex-1 space-y-3">
          <div className="h-5 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        {/* Right: Video placeholder */}
        <div className="w-40 h-24 bg-gray-200 dark:bg-gray-700 rounded-[1.5rem] animate-pulse"></div>
      </div>
    </div>
  );
};

/**
 * Camera Grid Skeleton
 * Placeholder for camera grid layout
 */
export const CameraGridSkeleton = ({ count = 4, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index} 
          className="bg-gray-200 dark:bg-gray-700 rounded-2xl aspect-video animate-pulse relative overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;
