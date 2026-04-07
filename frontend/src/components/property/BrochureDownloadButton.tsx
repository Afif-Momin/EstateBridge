import { useState } from 'react';
import { Button } from '../common/Button';
import apiClient from '../../services/apiClient';
import type { ApiResponse } from '../../types';

interface BrochureDownloadButtonProps {
  propertyId: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

interface BrochureResponse {
  downloadUrl: string;
  expiresAt: string;
  fileName: string;
}

export function BrochureDownloadButton({
  propertyId,
  className = '',
  variant = 'outline',
  size = 'md',
}: BrochureDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the brochure generation endpoint
      const response = await apiClient.post<ApiResponse<BrochureResponse>>(
        `/properties/${propertyId}/brochure`
      );

      const { downloadUrl, fileName } = response.data.data;

      // Trigger download by creating a temporary link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Error generating brochure:', err);
      const errorMessage =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to generate brochure. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        loading={loading}
        disabled={loading}
        aria-label="Download property brochure"
      >
        {!loading && (
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
        {loading ? 'Generating...' : 'Download Brochure'}
      </Button>

      {error && (
        <div
          className="mt-2 text-sm text-error-600 bg-error-50 border border-error-200 rounded-md px-3 py-2"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}
