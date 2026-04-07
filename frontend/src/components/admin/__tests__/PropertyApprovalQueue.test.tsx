import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import PropertyApprovalQueue from '../PropertyApprovalQueue';
import apiClient from '../../../services/apiClient';
import authReducer from '../../../store/slices/authSlice';
import uiReducer from '../../../store/slices/uiSlice';

vi.mock('../../../services/apiClient');

const mockStore = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
  preloadedState: {
    auth: {
      user: {
        id: 'admin1',
        email: 'admin@test.com',
        fullName: 'Admin',
        role: 'buyer' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      token: 'test-token',
      role: 'buyer' as const,
      loading: false,
      error: null,
      isAuthenticated: true,
    },
    ui: {
      toasts: [],
      globalLoading: false,
    },
  },
});

const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderComponent = () => {
  return render(
    <Provider store={mockStore}>
      <QueryClientProvider client={mockQueryClient}>
        <PropertyApprovalQueue />
      </QueryClientProvider>
    </Provider>
  );
};

describe('PropertyApprovalQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient.clear();
  });

  it('renders loading state initially', () => {
    vi.mocked(apiClient.get).mockImplementation(() => new Promise(() => {}));
    renderComponent();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays pending properties with details', async () => {
    const mockProperties = {
      data: {
        success: true,
        data: {
          data: [
            {
              id: 'prop1',
              title: 'Test Property',
              description: 'A nice property',
              price: 500000,
              currency: 'USD',
              propertyType: 'house',
              region: 'California',
              createdAt: new Date('2024-01-15'),
              imageUrls: ['https://example.com/image.jpg'],
              seller: {
                fullName: 'John Doe',
                email: 'john@example.com',
              },
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      },
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockProperties);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeInTheDocument();
    });

    expect(screen.getByText('A nice property')).toBeInTheDocument();
    expect(screen.getByText(/\$500,000\.00/)).toBeInTheDocument();
    expect(screen.getByText('house')).toBeInTheDocument();
    expect(screen.getByText('California')).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });

  it('displays pending count badge', async () => {
    const mockProperties = {
      data: {
        success: true,
        data: {
          data: [
            {
              id: 'prop1',
              title: 'Test Property',
              description: 'A nice property',
              price: 500000,
              currency: 'USD',
              propertyType: 'house',
              region: 'California',
              createdAt: new Date('2024-01-15'),
              imageUrls: ['https://example.com/image.jpg'],
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 5,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      },
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockProperties);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('shows empty state when no pending properties', async () => {
    const mockProperties = {
      data: {
        success: true,
        data: {
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      },
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockProperties);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No pending properties')).toBeInTheDocument();
    });

    expect(screen.getByText('All properties have been reviewed.')).toBeInTheDocument();
  });

  it('opens approve modal when approve button clicked', async () => {
    const user = userEvent.setup();
    const mockProperties = {
      data: {
        success: true,
        data: {
          data: [
            {
              id: 'prop1',
              title: 'Test Property',
              description: 'A nice property',
              price: 500000,
              currency: 'USD',
              propertyType: 'house',
              region: 'California',
              createdAt: new Date('2024-01-15'),
              imageUrls: ['https://example.com/image.jpg'],
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      },
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockProperties);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeInTheDocument();
    });

    const approveButton = screen.getAllByRole('button', { name: /approve/i })[0];
    await user.click(approveButton);

    await waitFor(() => {
      expect(screen.getByText('Select the approved status for this property:')).toBeInTheDocument();
    });
  });

  it('opens reject modal when reject button clicked', async () => {
    const user = userEvent.setup();
    const mockProperties = {
      data: {
        success: true,
        data: {
          data: [
            {
              id: 'prop1',
              title: 'Test Property',
              description: 'A nice property',
              price: 500000,
              currency: 'USD',
              propertyType: 'house',
              region: 'California',
              createdAt: new Date('2024-01-15'),
              imageUrls: ['https://example.com/image.jpg'],
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      },
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockProperties);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Test Property')).toBeInTheDocument();
    });

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    await user.click(rejectButton);

    await waitFor(() => {
      expect(screen.getByText('Please provide a reason for rejecting this property:')).toBeInTheDocument();
    });
  });

  it('formats INR prices correctly', async () => {
    const mockProperties = {
      data: {
        success: true,
        data: {
          data: [
            {
              id: 'prop1',
              title: 'Test Property',
              description: 'A nice property',
              price: 5000000,
              currency: 'INR',
              propertyType: 'house',
              region: 'Mumbai',
              createdAt: new Date('2024-01-15'),
              imageUrls: ['https://example.com/image.jpg'],
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          },
        },
      },
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockProperties);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/₹50,00,000/)).toBeInTheDocument();
    });
  });
});
