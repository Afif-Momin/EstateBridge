import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegisterPage from '../RegisterPage';
import authReducer from '../../store/slices/authSlice';
import uiReducer from '../../store/slices/uiSlice';
import * as firebaseAuth from '../../services/firebaseAuth';
import apiClient from '../../services/apiClient';

// Mock modules
vi.mock('../../services/firebaseAuth');
vi.mock('../../services/apiClient');
vi.mock('../../components/auth/CaptchaWidget', () => ({
  CaptchaWidget: ({ onTokenReceived }: { onTokenReceived: (token: string) => void }) => {
    // Simulate CAPTCHA token received immediately
    setTimeout(() => onTokenReceived('mock-captcha-token'), 0);
    return <div data-testid="captcha-widget">CAPTCHA Widget</div>;
  },
}));

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      ui: uiReducer,
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const store = createMockStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>
  );
};

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form with all fields', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i am a/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders CAPTCHA widget', () => {
    renderWithProviders(<RegisterPage />);

    expect(screen.getByTestId('captcha-widget')).toBeInTheDocument();
  });

  it('disables submit button until CAPTCHA token is received', async () => {
    renderWithProviders(<RegisterPage />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    // Initially disabled (no CAPTCHA token yet)
    expect(submitButton).toBeDisabled();

    // Wait for CAPTCHA token to be received
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('includes captchaToken in registration request', async () => {
    const user = userEvent.setup();
    const mockFirebaseSignUp = vi.mocked(firebaseAuth.firebaseSignUp);
    const mockApiPost = vi.mocked(apiClient.post);

    mockFirebaseSignUp.mockResolvedValue({
      user: {
        getIdToken: vi.fn().mockResolvedValue('mock-firebase-token'),
      },
    } as any);

    mockApiPost.mockResolvedValue({
      data: {
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'buyer',
          },
        },
      },
    } as any);

    renderWithProviders(<RegisterPage />);

    // Wait for CAPTCHA token
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
    });

    // Fill form
    await user.type(screen.getByLabelText(/full name/i), 'Test User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await user.selectOptions(screen.getByLabelText(/i am a/i), 'buyer');

    // Submit form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Verify API call includes captchaToken
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        '/auth/register',
        expect.objectContaining({
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'buyer',
          captchaToken: 'mock-captcha-token',
        })
      );
    });
  });



  it('validates form fields before submission', async () => {
    const user = userEvent.setup();

    renderWithProviders(<RegisterPage />);

    // Wait for CAPTCHA token
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled();
    });

    // Submit without filling fields
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });
});
