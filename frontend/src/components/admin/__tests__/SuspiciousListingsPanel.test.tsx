import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SuspiciousListingsPanel from '../SuspiciousListingsPanel';
import apiClient from '../../../services/apiClient';
import uiReducer from '../../../store/slices/uiSlice';
import type { Property, PaginatedResponse, ApiResponse } from '../../../types';

vi.mock('../../../services/apiClient');

const mockApiClient = apiClient as any;

const createMockStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer,
    },
  });

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const store = createMockStore();

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
};

const mockFlaggedProperty: Property = {
  id: 'prop-1',
  title: 'Suspicious Property',
  description: 'This property has been flagged for spam',
  price: 500000,
  region: 'New York',
  address: '123 Main St',
  propertyType: 'house',
  status: 'available',
  sellerId: 'seller-1',
  seller: {
    id: 'seller-1',
    email: 'seller@example.com',
    fullName: 'John Seller',
    role: 'seller',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  imageUrls: ['https://example.com/image1.jpg'],
  thumbnailUrls: ['https://example.com/thumb1.jpg'],
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  flagged: true,
  flaggedReason: 'Spam content detected',
  flaggedAt: new Date('2024-01-20'),
  reportCount: 3,
  currency: 'USD',
};

describe('SuspiciousListingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockApiClient.get.mockImplementation(() => new Promise(() => {}));

    render(<SuspiciousListingsPanel />, { wrapper: createWrapper() });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders flagged properties list with count badge', async () => {
    const mockResponse: ApiResponse<PaginatedResponse<Property>> = {
      success: true,
      data: {
        data: [mockFlaggedProperty],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
      timestamp: new Date().toISOString(),
    };

    mockApiClient.get.mockResolvedValue({ data: mockResponse });

    render(<SuspiciousListingsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Suspicious Listings')).toBeInTheDocument();
    });

    expect(screen.getByText('1')).toBeInTheDocument(); // Count badge
    expect(screen.getByText('Suspicious Property')).toBeInTheDocument();
    expect(screen.getByText('Spam content detected')).toBeInTheDocument();
    expect(screen.getByText(/John Seller/)).toBeInTheDocument();
  });

  it('displays flagged reason badge', async () => {
    const mockResponse: ApiResponse<PaginatedResponse<Property>> = {
      success: true,
      data: {
        data: [mockFlaggedProperty],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
      timestamp: new Date().toISOString(),
    };

    mockApiClient.get.mockResolvedValue({ data: mockResponse });

    render(<SuspiciousListingsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Spam content detected')).toBeInTheDocument();
    });
  });

  it('displays report count when available', async () => {
    const mockResponse: ApiResponse<PaginatedResponse<Property>> = {
      success: true,
      data: {
        data: [mockFlaggedProperty],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
      timestamp: new Date().toISOString(),
    };

    mockApiClient.get.mockResolvedValue({ data: mockResponse });

    render(<SuspiciousListingsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Reports:')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('renders empty state when no flagged properties', async () => {
    const mockResponse: ApiResponse<PaginatedResponse<Property>> = {
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
      timestamp: new Date().toISOString(),
    };

    mockApiClient.get.mockResolvedValue({ data: mockResponse });

    render(<SuspiciousListingsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No flagged properties')).toBeInTheDocument();
      expect(screen.getByText('All properties are clean.')).toBeInTheDocument();
    });
  });

  it('opens clear flag modal when button clicked', async () => {
    const user = userEvent.setup();
    const mockResponse: ApiResponse<PaginatedResponse<Property>> = {
      success: true,
      data: {
        data: [mockFlaggedProperty],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
      timestamp: new Date().toISOString(),
    };

    mockApiClient.get.mockResolvedValue({ data: mockResponse });

    render(<SuspiciousListingsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Suspicious Property')).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: /clear flag/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to clear the flag from this property?')).toBeInTheDocument();
    });
  });

  it('clears flag successfully', async () => {
    const user = userEvent.setup();
    const mockResponse: ApiResponse<PaginatedResponse<Property>> = {
      success: true,
      data: {
        data: [mockFlaggedProperty],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
      timestamp: new Date().toISOString(),
    };

    mockApiClient.get.mockResolvedValue({ data: mockResponse });
    mockApiClient.post.mockResolvedValue({
      data: {
        success: true,
        data: { ...mockFlaggedProperty, flagged: false },
        timestamp: new Date().toISOString(),
      },
    });

    render(<SuspiciousListingsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Suspicious Property')).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: /clear flag/i });
    await user.click(clearButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const confirmButton = within(screen.getByRole('dialog')).getByRole('button', {
      name: /clear flag/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockApiClient.post).toHaveBeenCalledWith('/admin/properties/prop-1/clear-flag');
    });
  });

  it('handles pagination correctly', async () => {
    const mockResponse: ApiResponse<PaginatedResponse<Property>> = {
      success: true,
      data: {
        data: [mockFlaggedProperty],
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
      },
      timestamp: new Date().toISOString(),
    };

    mockApiClient.get.mockResolvedValue({ data: mockResponse });

    render(<SuspiciousListingsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).not.toBeDisabled();

    const prevButton = screen.getByRole('button', { name: /previous/i });
    expect(prevButton).toBeDisabled();
  });

  it('renders error state when API fails', async () => {
    mockApiClient.get.mockRejectedValue(new Error('API Error'));

    render(<SuspiciousListingsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Failed to load flagged properties')).toBeInTheDocument();
    });
  });

  it('formats price correctly for USD', async () => {
    const mockResponse: ApiResponse<PaginatedResponse<Property>> = {
      success: true,
      data: {
        data: [mockFlaggedProperty],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
      timestamp: new Date().toISOString(),
    };

    mockApiClient.get.mockResolvedValue({ data: mockResponse });

    render(<SuspiciousListingsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('$500,000.00')).toBeInTheDocument();
    });
  });

  it('formats price correctly for INR', async () => {
    const inrProperty = { ...mockFlaggedProperty, currency: 'INR' as const };
    const mockResponse: ApiResponse<PaginatedResponse<Property>> = {
      success: true,
      data: {
        data: [inrProperty],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
      timestamp: new Date().toISOString(),
    };

    mockApiClient.get.mockResolvedValue({ data: mockResponse });

    render(<SuspiciousListingsPanel />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('₹5,00,000')).toBeInTheDocument();
    });
  });
});
