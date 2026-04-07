import { useState, useEffect, useCallback } from 'react';

interface RateLimitState {
  isLimited: boolean;
  resetAt: Date | null;
  remainingTime: number; // in seconds
  message: string;
}

interface RateLimitError {
  message: string;
  resetAt?: string;
}

/**
 * Hook to manage rate limiting state and provide user feedback
 * 
 * @example
 * const { rateLimitState, handleRateLimitError, clearRateLimit } = useRateLimiting();
 * 
 * // In your API call error handler:
 * if (error.response?.status === 429) {
 *   handleRateLimitError(error.response.data.error);
 * }
 * 
 * // Display feedback:
 * {rateLimitState.isLimited && (
 *   <div>
 *     {rateLimitState.message}
 *     {rateLimitState.remainingTime > 0 && (
 *       <span>Try again in {formatTime(rateLimitState.remainingTime)}</span>
 *     )}
 *   </div>
 * )}
 */
export const useRateLimiting = () => {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    isLimited: false,
    resetAt: null,
    remainingTime: 0,
    message: '',
  });

  // Update remaining time every second
  useEffect(() => {
    if (!rateLimitState.isLimited || !rateLimitState.resetAt) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const resetAt = rateLimitState.resetAt;
      
      if (!resetAt) {
        clearInterval(interval);
        return;
      }

      const remaining = Math.max(0, Math.floor((resetAt.getTime() - now.getTime()) / 1000));

      if (remaining <= 0) {
        setRateLimitState({
          isLimited: false,
          resetAt: null,
          remainingTime: 0,
          message: '',
        });
        clearInterval(interval);
      } else {
        setRateLimitState((prev) => ({
          ...prev,
          remainingTime: remaining,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitState.isLimited, rateLimitState.resetAt]);

  /**
   * Handle rate limit error from API response
   */
  const handleRateLimitError = useCallback((error: RateLimitError) => {
    const resetAt = error.resetAt ? new Date(error.resetAt) : null;
    const now = new Date();
    const remainingTime = resetAt 
      ? Math.max(0, Math.floor((resetAt.getTime() - now.getTime()) / 1000))
      : 0;

    setRateLimitState({
      isLimited: true,
      resetAt,
      remainingTime,
      message: error.message || 'Rate limit exceeded. Please try again later.',
    });
  }, []);

  /**
   * Manually clear rate limit state
   */
  const clearRateLimit = useCallback(() => {
    setRateLimitState({
      isLimited: false,
      resetAt: null,
      remainingTime: 0,
      message: '',
    });
  }, []);

  /**
   * Format remaining time as human-readable string
   */
  const formatRemainingTime = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      if (remainingSeconds === 0) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      }
      return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  }, []);

  return {
    rateLimitState,
    handleRateLimitError,
    clearRateLimit,
    formatRemainingTime,
  };
};

/**
 * Helper function to extract rate limit info from axios error
 */
export const extractRateLimitError = (error: any): RateLimitError | null => {
  if (error?.response?.status === 429) {
    return {
      message: error.response.data?.error?.message || 'Too many requests. Please try again later.',
      resetAt: error.response.data?.error?.resetAt,
    };
  }
  return null;
};
