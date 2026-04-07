import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportPropertyModal from '../ReportPropertyModal';
import apiClient from '../../../services/apiClient';
import uiReducer from '../../../store/slices/uiSlice';

vi.mock('../../../services/apiClient');

const createTestStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer,
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const store = createTestStore();

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    </Provider>
  );
};

describe('ReportPropertyModal', () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    propertyId: 'property-123',
    propertyTitle: 'Beautiful House in Downtown',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with property title', () => {
    renderWithProviders(<ReportPropertyModal {...defaultProps} />);

    expect(screen.getByText('Report Property')).toBeInTheDocument();
    expect(screen.getByText(/You are reporting:/)).toBeInTheDocument();
    expect(screen.getByText('Beautiful House in Downtown')).toBeInTheDocument();
  });

  it('displays all report reason options', () => {
    renderWithProviders(<ReportPropertyModal {...defaultProps} />);

    const select = screen.getByLabelText(/Reason/);
    expect(select).toBeInTheDocument();

    // Check that all options are present
    expect(screen.getByRole('option', { name: 'Spam' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Inappropriate Content' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Fake Images' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Duplicate Listing' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument();
  });

  it('shows validation error when submitting without selecting a reason', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportPropertyModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /Submit Report/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please select a reason')).toBeInTheDocument();
    });
  });

  it('submits report successfully with required fields only', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        success: true,
        data: {
          id: 'report-123',
          propertyId: 'property-123',
          reporterId: 'user-123',
          reason: 'Spam',
          status: 'pending',
          createdAt: new Date(),
        },
      },
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    renderWithProviders(<ReportPropertyModal {...defaultProps} />);

    // Select a reason
    const reasonSelect = screen.getByLabelText(/Reason/);
    await user.selectOptions(reasonSelect, 'Spam');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Submit Report/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/properties/property-123/report', {
        reason: 'Spam',
        additionalDetails: undefined,
      });
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('submits report with additional details', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        success: true,
        data: {
          id: 'report-123',
          propertyId: 'property-123',
          reporterId: 'user-123',
          reason: 'Fake Images',
          additionalDetails: 'The images are clearly photoshopped',
          status: 'pending',
          createdAt: new Date(),
        },
      },
    };

    vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

    renderWithProviders(<ReportPropertyModal {...defaultProps} />);

    // Select a reason
    const reasonSelect = screen.getByLabelText(/Reason/);
    await user.selectOptions(reasonSelect, 'Fake Images');

    // Add additional details
    const detailsTextarea = screen.getByLabelText(/Additional Details/);
    await user.type(detailsTextarea, 'The images are clearly photoshopped');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Submit Report/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/properties/property-123/report', {
        reason: 'Fake Images',
        additionalDetails: 'The images are clearly photoshopped',
      });
    });
  });

  it('handles duplicate report error gracefully', async () => {
    const user = userEvent.setup();
    const mockError = {
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'DUPLICATE_REPORT',
            message: 'You have already reported this property',
          },
        },
      },
    };

    vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

    renderWithProviders(<ReportPropertyModal {...defaultProps} />);

    // Select a reason and submit
    const reasonSelect = screen.getByLabelText(/Reason/);
    await user.selectOptions(reasonSelect, 'Spam');

    const submitButton = screen.getByRole('button', { name: /Submit Report/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles generic error', async () => {
    const user = userEvent.setup();
    const mockError = {
      response: {
        status: 500,
        data: {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong',
          },
        },
      },
    };

    vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

    renderWithProviders(<ReportPropertyModal {...defaultProps} />);

    // Select a reason and submit
    const reasonSelect = screen.getByLabelText(/Reason/);
    await user.selectOptions(reasonSelect, 'Other');

    const submitButton = screen.getByRole('button', { name: /Submit Report/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalled();
    });

    // Modal should not close on error
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('disables form fields during submission', async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(apiClient.post).mockReturnValueOnce(pendingPromise as any);

    renderWithProviders(<ReportPropertyModal {...defaultProps} />);

    // Select a reason and submit
    const reasonSelect = screen.getByLabelText(/Reason/);
    await user.selectOptions(reasonSelect, 'Spam');

    const submitButton = screen.getByRole('button', { name: /Submit Report/ });
    await user.click(submitButton);

    // Check that fields are disabled during submission
    await waitFor(() => {
      expect(reasonSelect).toBeDisabled();
      expect(screen.getByLabelText(/Additional Details/)).toBeDisabled();
      expect(screen.getByRole('button', { name: /Cancel/ })).toBeDisabled();
    });

    // Resolve the promise
    resolvePromise!({
      data: {
        success: true,
        data: { id: 'report-123' },
      },
    });
  });

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportPropertyModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancel/ });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    renderWithProviders(<ReportPropertyModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Report Property')).not.toBeInTheDocument();
  });

  it('resets form when modal is closed', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const store = createTestStore();

    const { rerender } = render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ReportPropertyModal {...defaultProps} />
        </QueryClientProvider>
      </Provider>
    );

    // Fill in the form
    const reasonSelect = screen.getByLabelText(/Reason/);
    await user.selectOptions(reasonSelect, 'Spam');

    const detailsTextarea = screen.getByLabelText(/Additional Details/);
    await user.type(detailsTextarea, 'Test details');

    // Close modal
    const cancelButton = screen.getByRole('button', { name: /Cancel/ });
    await user.click(cancelButton);

    // Reopen modal with providers
    rerender(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ReportPropertyModal {...defaultProps} isOpen={true} />
        </QueryClientProvider>
      </Provider>
    );

    // Form should be reset
    expect(screen.getByLabelText(/Reason/)).toHaveValue('');
    expect(screen.getByLabelText(/Additional Details/)).toHaveValue('');
  });
});
