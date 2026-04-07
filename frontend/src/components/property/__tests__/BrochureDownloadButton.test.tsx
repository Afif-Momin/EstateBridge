import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrochureDownloadButton } from '../BrochureDownloadButton';
import apiClient from '../../../services/apiClient';

// Mock the API client
vi.mock('../../../services/apiClient', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('BrochureDownloadButton', () => {
  const mockPropertyId = 'property-123';
  const mockBrochureResponse = {
    data: {
      success: true,
      data: {
        downloadUrl: 'https://storage.example.com/brochure.pdf',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        fileName: 'brochure_123456.pdf',
      },
      timestamp: new Date().toISOString(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the download button with correct text', () => {
    render(<BrochureDownloadButton propertyId={mockPropertyId} />);
    
    const button = screen.getByRole('button', { name: /download property brochure/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Download Brochure');
  });

  it('displays download icon when not loading', () => {
    render(<BrochureDownloadButton propertyId={mockPropertyId} />);
    
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('shows loading state during brochure generation', async () => {
    vi.mocked(apiClient.post).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockBrochureResponse), 100))
    );

    render(<BrochureDownloadButton propertyId={mockPropertyId} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should show loading state
    await waitFor(() => {
      expect(button).toHaveTextContent('Generating...');
      expect(button).toBeDisabled();
    });
  });

  it('triggers download on successful generation', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(mockBrochureResponse);

    render(<BrochureDownloadButton propertyId={mockPropertyId} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(`/properties/${mockPropertyId}/brochure`);
    });
  });

  it('displays error message if generation fails', async () => {
    const errorMessage = 'Failed to generate brochure';
    vi.mocked(apiClient.post).mockRejectedValue({
      response: {
        data: {
          error: {
            message: errorMessage,
          },
        },
      },
    });

    render(<BrochureDownloadButton propertyId={mockPropertyId} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(errorMessage);
    });
  });

  it('displays generic error message if no specific error provided', async () => {
    vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

    render(<BrochureDownloadButton propertyId={mockPropertyId} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent('Failed to generate brochure. Please try again.');
    });
  });

  it('applies custom className', () => {
    const customClass = 'custom-class';
    const { container } = render(
      <BrochureDownloadButton propertyId={mockPropertyId} className={customClass} />
    );
    
    expect(container.firstChild).toHaveClass(customClass);
  });

  it('accepts custom variant prop', () => {
    render(<BrochureDownloadButton propertyId={mockPropertyId} variant="primary" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary-600');
  });

  it('accepts custom size prop', () => {
    render(<BrochureDownloadButton propertyId={mockPropertyId} size="lg" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('clears error when retrying after failure', async () => {
    // First call fails
    vi.mocked(apiClient.post).mockRejectedValueOnce({
      response: {
        data: {
          error: {
            message: 'First error',
          },
        },
      },
    });

    render(<BrochureDownloadButton propertyId={mockPropertyId} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Second call succeeds
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockBrochureResponse);
    fireEvent.click(button);

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('sets correct download link attributes', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(mockBrochureResponse);

    render(<BrochureDownloadButton propertyId={mockPropertyId} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(`/properties/${mockPropertyId}/brochure`);
    });
  });
});
