import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

/**
 * Fallback Error Component
 * Displays error UI when ErrorBoundary catches an error
 */
const FallbackError = ({ 
  error, 
  errorInfo, 
  onRetry, 
  onReset,
  title,
  message 
}) => {
  // Default title and message
  const errorTitle = title || 'Something went wrong';
  const errorMessage = message || 'An unexpected error occurred. Please try again.';
  
  // Extract error message if available
  const errorDetails = error?.message || error?.toString() || 'Unknown error';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Error Header */}
        <div className="bg-red-500 dark:bg-red-600 p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-white dark:text-white">
            {errorTitle}
          </h1>
        </div>

        {/* Error Body */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            {errorMessage}
          </p>

          {/* Error Details - Collapsible in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6">
              <details className="group">
                <summary className="flex items-center cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  <Bug className="w-4 h-4 mr-2" />
                  Error Details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto max-h-32">
                  <p className="font-semibold">Error:</p>
                  <p className="whitespace-pre-wrap break-words">{errorDetails}</p>
                  {errorInfo?.componentStack && (
                    <>
                      <p className="font-semibold mt-2">Stack Trace:</p>
                      <p className="whitespace-pre-wrap break-words">{errorInfo.componentStack}</p>
                    </>
                  )}
                </div>
              </details>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
            )}
            
            {onReset && (
              <button
                onClick={onReset}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-white font-medium rounded-lg transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FallbackError;

/**
 * Inline Error Fallback Component
 * Smaller error display for individual components
 */
export const InlineError = ({ 
  error, 
  onRetry,
  message = 'Error loading content' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <AlertTriangle className="w-10 h-10 text-red-500 mb-3" />
      <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
        {message}
      </p>
      {error && process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-4">
          {error.message}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-3 h-3 mr-2" />
          Retry
        </button>
      )}
    </div>
  );
};
