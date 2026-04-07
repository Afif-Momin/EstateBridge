import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BuyerQualificationForm from '../BuyerQualificationForm';
import apiClient from '../../../services/apiClient';
import uiReducer from '../../../store/slices/uiSlice';
import authReducer from '../../../store/slices/authSlice';

// Mock API client
vi.mock('../../../services/apiClient');

const createTestStore = () =>
  configureStore({
    reducer: {
      ui: uiReducer,
      auth: authReducer,
    },
  });

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const store = createTestStore();

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
};

describe('BuyerQualificationForm', () => {
  const mockProps = {
    listingId: 'listing-123',
    sellerId: 'seller-456',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all required fields', () => {
      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      // Required fields
      expect(screen.getByText(/Reason to Buy/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Investment/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Self Use/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/I am a property dealer/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Your Phone Number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Preferred Date & Time/i)).toBeInTheDocument();
    });

    it('should render optional fields', () => {
      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/Purchase Timeline/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/I am interested in home loan assistance/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/I am interested in a site visit/i)).toBeInTheDocument();
    });

    it('should render terms and privacy policy checkboxes with links', () => {
      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      const termsLink = screen.getByRole('link', { name: /terms and conditions/i });
      expect(termsLink).toBeInTheDocument();
      expect(termsLink).toHaveAttribute('href', '/terms');
      expect(termsLink).toHaveAttribute('target', '_blank');

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i });
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink).toHaveAttribute('href', '/privacy');
      expect(privacyLink).toHaveAttribute('target', '_blank');
    });

    it('should render submit button', () => {
      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /Submit Appointment Request/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error when reason_to_buy is not selected', async () => {
      const user = userEvent.setup();
      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      const submitButton = screen.getByRole('button', { name: /Submit Appointment Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid option: expected one of "Investment"\|"Self Use"/i)).toBeInTheDocument();
      });
    });

    it('should show validation error when buyer_name is too short', async () => {
      const user = userEvent.setup();
      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText(/Your Name/i);
      await user.type(nameInput, 'A');

      const submitButton = screen.getByRole('button', { name: /Submit Appointment Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should show validation error when buyer_phone is too short', async () => {
      const user = userEvent.setup();
      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      const phoneInput = screen.getByLabelText(/Your Phone Number/i);
      await user.type(phoneInput, '123');

      const submitButton = screen.getByRole('button', { name: /Submit Appointment Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Phone number must be at least 10 digits/i)).toBeInTheDocument();
      });
    });

    it('should show validation error when terms are not accepted', async () => {
      const user = userEvent.setup();
      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      // Fill required fields
      await user.click(screen.getByLabelText(/Investment/i));
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Your Phone Number/i), '1234567890');

      const submitButton = screen.getByRole('button', { name: /Submit Appointment Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/You must accept the terms and conditions/i)).toBeInTheDocument();
      });
    });

    it('should show validation error when privacy policy is not accepted', async () => {
      const user = userEvent.setup();
      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      // Fill required fields and accept terms
      await user.click(screen.getByLabelText(/Investment/i));
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Your Phone Number/i), '1234567890');
      await user.click(screen.getByLabelText(/I accept the terms and conditions/i));

      const submitButton = screen.getByRole('button', { name: /Submit Appointment Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/You must accept the privacy policy/i)).toBeInTheDocument();
      });
    });

    it('should show validation error when appointment date is in the past', async () => {
      const user = userEvent.setup();
      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      const dateInput = screen.getByLabelText(/Preferred Date & Time/i);
      const pastDate = new Date(Date.now() - 86400000).toISOString().slice(0, 16);
      await user.type(dateInput, pastDate);

      const submitButton = screen.getByRole('button', { name: /Submit Appointment Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Appointment must be in the future/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with all required fields', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        data: {
          data: {
            appointment: {
              id: 'appt-123',
              listingId: 'listing-123',
              buyerId: 'buyer-789',
              sellerId: 'seller-456',
              reason_to_buy: 'Investment',
              is_property_dealer: false,
              buyer_name: 'John Doe',
              buyer_phone: '1234567890',
              terms_accepted: true,
              privacy_policy_accepted: true,
              requestedDateTime: new Date().toISOString(),
              status: 'pending',
              contact_revealed: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            sellerContact: {
              name: 'Jane Seller',
              email: 'jane@example.com',
              phone: '0987654321',
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      // Fill required fields
      await user.click(screen.getByLabelText(/Investment/i));
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Your Phone Number/i), '1234567890');

      const futureDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
      await user.type(screen.getByLabelText(/Preferred Date & Time/i), futureDate);

      await user.click(screen.getByLabelText(/I accept the terms and conditions/i));
      await user.click(screen.getByLabelText(/I accept the privacy policy/i));

      const submitButton = screen.getByRole('button', { name: /Submit Appointment Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/appointments', expect.objectContaining({
          listingId: 'listing-123',
          sellerId: 'seller-456',
          reason_to_buy: 'Investment',
          is_property_dealer: false,
          buyer_name: 'John Doe',
          buyer_phone: '1234567890',
          terms_accepted: true,
          privacy_policy_accepted: true,
        }));
      });
    });

    it('should submit form with optional fields', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        data: {
          data: {
            appointment: {
              id: 'appt-123',
              listingId: 'listing-123',
              buyerId: 'buyer-789',
              sellerId: 'seller-456',
              reason_to_buy: 'Self Use',
              is_property_dealer: true,
              buyer_name: 'John Doe',
              buyer_phone: '1234567890',
              purchase_timeline: '3 months',
              home_loan_interest: true,
              site_visit_interest: true,
              terms_accepted: true,
              privacy_policy_accepted: true,
              requestedDateTime: new Date().toISOString(),
              status: 'pending',
              contact_revealed: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            sellerContact: {
              name: 'Jane Seller',
              email: 'jane@example.com',
              phone: '0987654321',
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      // Fill all fields including optional
      await user.click(screen.getByLabelText(/Self Use/i));
      await user.click(screen.getByLabelText(/I am a property dealer/i));
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Your Phone Number/i), '1234567890');

      const futureDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
      await user.type(screen.getByLabelText(/Preferred Date & Time/i), futureDate);

      await user.selectOptions(screen.getByLabelText(/Purchase Timeline/i), '3 months');
      await user.click(screen.getByLabelText(/I am interested in home loan assistance/i));
      await user.click(screen.getByLabelText(/I am interested in a site visit/i));

      await user.click(screen.getByLabelText(/I accept the terms and conditions/i));
      await user.click(screen.getByLabelText(/I accept the privacy policy/i));

      const submitButton = screen.getByRole('button', { name: /Submit Appointment Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/appointments', expect.objectContaining({
          reason_to_buy: 'Self Use',
          is_property_dealer: true,
          purchase_timeline: '3 months',
          home_loan_interest: true,
          site_visit_interest: true,
        }));
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.post).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      // Fill required fields
      await user.click(screen.getByLabelText(/Investment/i));
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Your Phone Number/i), '1234567890');

      const futureDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
      await user.type(screen.getByLabelText(/Preferred Date & Time/i), futureDate);

      await user.click(screen.getByLabelText(/I accept the terms and conditions/i));
      await user.click(screen.getByLabelText(/I accept the privacy policy/i));

      const submitButton = screen.getByRole('button', { name: /Submit Appointment Request/i });
      await user.click(submitButton);

      // Button should be disabled during loading
      expect(submitButton).toBeDisabled();
    });

    it('should handle submission error', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to create appointment';
      vi.mocked(apiClient.post).mockRejectedValueOnce({
        response: {
          data: {
            error: {
              message: errorMessage,
            },
          },
        },
      });

      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      // Fill required fields
      await user.click(screen.getByLabelText(/Investment/i));
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Your Phone Number/i), '1234567890');

      const futureDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
      await user.type(screen.getByLabelText(/Preferred Date & Time/i), futureDate);

      await user.click(screen.getByLabelText(/I accept the terms and conditions/i));
      await user.click(screen.getByLabelText(/I accept the privacy policy/i));

      const submitButton = screen.getByRole('button', { name: /Submit Appointment Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalled();
      });
    });
  });

  describe('Seller Contact Display', () => {
    it('should display seller contact information after successful submission', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        data: {
          data: {
            appointment: {
              id: 'appt-123',
              listingId: 'listing-123',
              buyerId: 'buyer-789',
              sellerId: 'seller-456',
              reason_to_buy: 'Investment',
              is_property_dealer: false,
              buyer_name: 'John Doe',
              buyer_phone: '1234567890',
              terms_accepted: true,
              privacy_policy_accepted: true,
              requestedDateTime: new Date().toISOString(),
              status: 'pending',
              contact_revealed: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            sellerContact: {
              name: 'Jane Seller',
              email: 'jane@example.com',
              phone: '0987654321',
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      // Fill and submit form
      await user.click(screen.getByLabelText(/Investment/i));
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Your Phone Number/i), '1234567890');

      const futureDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
      await user.type(screen.getByLabelText(/Preferred Date & Time/i), futureDate);

      await user.click(screen.getByLabelText(/I accept the terms and conditions/i));
      await user.click(screen.getByLabelText(/I accept the privacy policy/i));

      const submitButton = screen.getByRole('button', { name: /Submit Appointment Request/i });
      await user.click(submitButton);

      // Wait for seller contact to be displayed
      await waitFor(() => {
        expect(screen.getByText(/Appointment Request Submitted!/i)).toBeInTheDocument();
        expect(screen.getByText('Jane Seller')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        expect(screen.getByText('0987654321')).toBeInTheDocument();
      });
    });

    it('should display clickable email and phone links', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        data: {
          data: {
            appointment: {
              id: 'appt-123',
              listingId: 'listing-123',
              buyerId: 'buyer-789',
              sellerId: 'seller-456',
              reason_to_buy: 'Investment',
              is_property_dealer: false,
              buyer_name: 'John Doe',
              buyer_phone: '1234567890',
              terms_accepted: true,
              privacy_policy_accepted: true,
              requestedDateTime: new Date().toISOString(),
              status: 'pending',
              contact_revealed: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            sellerContact: {
              name: 'Jane Seller',
              email: 'jane@example.com',
              phone: '0987654321',
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      // Fill and submit form
      await user.click(screen.getByLabelText(/Investment/i));
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Your Phone Number/i), '1234567890');

      const futureDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
      await user.type(screen.getByLabelText(/Preferred Date & Time/i), futureDate);

      await user.click(screen.getByLabelText(/I accept the terms and conditions/i));
      await user.click(screen.getByLabelText(/I accept the privacy policy/i));

      const submitButton = screen.getByRole('button', { name: /Submit Appointment Request/i });
      await user.click(submitButton);

      // Wait for seller contact to be displayed
      await waitFor(() => {
        const emailLink = screen.getByRole('link', { name: 'jane@example.com' });
        expect(emailLink).toHaveAttribute('href', 'mailto:jane@example.com');

        const phoneLink = screen.getByRole('link', { name: '0987654321' });
        expect(phoneLink).toHaveAttribute('href', 'tel:0987654321');
      });
    });

    it('should hide form after seller contact is displayed', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        data: {
          data: {
            appointment: {
              id: 'appt-123',
              listingId: 'listing-123',
              buyerId: 'buyer-789',
              sellerId: 'seller-456',
              reason_to_buy: 'Investment',
              is_property_dealer: false,
              buyer_name: 'John Doe',
              buyer_phone: '1234567890',
              terms_accepted: true,
              privacy_policy_accepted: true,
              requestedDateTime: new Date().toISOString(),
              status: 'pending',
              contact_revealed: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            sellerContact: {
              name: 'Jane Seller',
              email: 'jane@example.com',
              phone: '0987654321',
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      render(<BuyerQualificationForm {...mockProps} />, { wrapper: createWrapper() });

      // Fill and submit form
      await user.click(screen.getByLabelText(/Investment/i));
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Your Phone Number/i), '1234567890');

      const futureDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
      await user.type(screen.getByLabelText(/Preferred Date & Time/i), futureDate);

      await user.click(screen.getByLabelText(/I accept the terms and conditions/i));
      await user.click(screen.getByLabelText(/I accept the privacy policy/i));

      const submitButton = screen.getByRole('button', { name: /Submit Appointment Request/i });
      await user.click(submitButton);

      // Wait for seller contact to be displayed
      await waitFor(() => {
        expect(screen.getByText(/Appointment Request Submitted!/i)).toBeInTheDocument();
      });

      // Form should no longer be visible
      expect(screen.queryByLabelText(/Your Name/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Submit Appointment Request/i })).not.toBeInTheDocument();
    });
  });

  describe('Callback Handling', () => {
    it('should call onSuccess callback after successful submission', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      const mockResponse = {
        data: {
          data: {
            appointment: {
              id: 'appt-123',
              listingId: 'listing-123',
              buyerId: 'buyer-789',
              sellerId: 'seller-456',
              reason_to_buy: 'Investment',
              is_property_dealer: false,
              buyer_name: 'John Doe',
              buyer_phone: '1234567890',
              terms_accepted: true,
              privacy_policy_accepted: true,
              requestedDateTime: new Date().toISOString(),
              status: 'pending',
              contact_revealed: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            sellerContact: {
              name: 'Jane Seller',
              email: 'jane@example.com',
              phone: '0987654321',
            },
          },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce(mockResponse);

      render(<BuyerQualificationForm {...mockProps} onSuccess={onSuccess} />, { wrapper: createWrapper() });

      // Fill and submit form
      await user.click(screen.getByLabelText(/Investment/i));
      await user.type(screen.getByLabelText(/Your Name/i), 'John Doe');
      await user.type(screen.getByLabelText(/Your Phone Number/i), '1234567890');

      const futureDate = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
      await user.type(screen.getByLabelText(/Preferred Date & Time/i), futureDate);

      await user.click(screen.getByLabelText(/I accept the terms and conditions/i));
      await user.click(screen.getByLabelText(/I accept the privacy policy/i));

      const submitButton = screen.getByRole('button', { name: /Submit Appointment Request/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1);
      });
    });
  });
});
