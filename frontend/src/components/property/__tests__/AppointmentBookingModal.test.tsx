import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import AppointmentBookingModal from '../AppointmentBookingModal';
import uiReducer from '../../../store/slices/uiSlice';

// Mock the BuyerQualificationForm component
vi.mock('../BuyerQualificationForm', () => ({
  default: ({ listingId, sellerId, onSuccess }: any) => (
    <div data-testid="buyer-qualification-form">
      <div>Listing ID: {listingId}</div>
      <div>Seller ID: {sellerId}</div>
      <button onClick={onSuccess}>Submit</button>
    </div>
  ),
}));

// Mock the Modal component
vi.mock('../../common/Modal', () => ({
  default: ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        <h2>{title}</h2>
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    );
  },
}));

describe('AppointmentBookingModal', () => {
  const mockOnClose = vi.fn();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const store = configureStore({
    reducer: {
      ui: uiReducer,
    },
  });

  const renderModal = (props = {}) => {
    const defaultProps = {
      listingId: 'listing-123',
      sellerId: 'seller-456',
      onClose: mockOnClose,
    };

    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AppointmentBookingModal {...defaultProps} {...props} />
        </QueryClientProvider>
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal with correct title', () => {
    renderModal();
    expect(screen.getByText('Book Appointment')).toBeInTheDocument();
  });

  it('renders the BuyerQualificationForm component', () => {
    renderModal();
    expect(screen.getByTestId('buyer-qualification-form')).toBeInTheDocument();
  });

  it('passes listingId and sellerId to BuyerQualificationForm', () => {
    renderModal({ listingId: 'test-listing', sellerId: 'test-seller' });
    expect(screen.getByText('Listing ID: test-listing')).toBeInTheDocument();
    expect(screen.getByText('Seller ID: test-seller')).toBeInTheDocument();
  });

  it('calls onClose when modal close button is clicked', () => {
    renderModal();
    const closeButton = screen.getByText('Close');
    closeButton.click();
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('invalidates appointments query on form success', () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    renderModal();
    
    const submitButton = screen.getByText('Submit');
    submitButton.click();
    
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['appointments', 'buyer'] });
  });
});
