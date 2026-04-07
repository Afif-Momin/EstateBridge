import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { addToast } from '../../store/slices/uiSlice';
import apiClient from '../../services/apiClient';
import { Button } from '../common/Button';
import type { ApiResponse } from '../../types';

export const EmailVerificationBanner: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Don't show banner if user is verified or banner is dismissed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      await apiClient.post<ApiResponse<void>>('/auth/resend-verification', {
        email: user.email,
      });
      dispatch(addToast({ 
        type: 'success', 
        message: 'Verification email sent! Please check your inbox.' 
      }));
    } catch (err: any) {
      const message = err?.response?.data?.error?.message ?? 'Failed to resend verification email';
      dispatch(addToast({ type: 'error', message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-warning-50 border-b border-warning-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-warning-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-warning-800">
                Please verify your email address
              </p>
              <p className="text-xs text-warning-700 mt-0.5">
                Check your inbox for a verification link. You'll need to verify your email before creating property listings.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendEmail}
              loading={loading}
              className="border-warning-300 text-warning-700 hover:bg-warning-100"
            >
              Resend Email
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="text-warning-600 hover:text-warning-800 p-1 rounded transition-colors"
              aria-label="Dismiss banner"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
