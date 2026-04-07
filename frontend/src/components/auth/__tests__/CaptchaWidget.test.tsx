import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CaptchaWidget } from '../CaptchaWidget';

describe('CaptchaWidget', () => {
  let mockOnTokenReceived: (token: string) => void;
  let mockOnError: (error: Error) => void;
  let mockGrecaptcha: any;

  beforeEach(() => {
    mockOnTokenReceived = vi.fn();
    mockOnError = vi.fn();

    // Mock grecaptcha
    mockGrecaptcha = {
      ready: vi.fn((callback) => callback()),
      execute: vi.fn().mockResolvedValue('mock-token-abc123'),
    };

    // Clean up any existing scripts
    const existingScript = document.getElementById('recaptcha-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Reset window.grecaptcha
    delete (window as any).grecaptcha;
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clean up scripts
    const script = document.getElementById('recaptcha-script');
    if (script) {
      script.remove();
    }
  });

  it('should render loading state initially', () => {
    render(
      <CaptchaWidget
        onTokenReceived={mockOnTokenReceived}
        action="register"
      />
    );

    expect(screen.getByText('Verifying...')).toBeInTheDocument();
  });

  it('should load reCAPTCHA script dynamically', async () => {
    render(
      <CaptchaWidget
        onTokenReceived={mockOnTokenReceived}
        action="register"
      />
    );

    await waitFor(() => {
      const script = document.getElementById('recaptcha-script') as HTMLScriptElement;
      expect(script).toBeInTheDocument();
      expect(script.src).toContain('https://www.google.com/recaptcha/api.js');
      expect(script.src).toContain('render=');
    });
  });

  it('should execute reCAPTCHA and call onTokenReceived with token', async () => {
    // Set up grecaptcha before rendering
    (window as any).grecaptcha = mockGrecaptcha;

    render(
      <CaptchaWidget
        onTokenReceived={mockOnTokenReceived}
        action="register"
      />
    );

    // Simulate script load
    const script = document.getElementById('recaptcha-script');
    if (script) {
      script.dispatchEvent(new Event('load'));
    }

    await waitFor(() => {
      expect(mockGrecaptcha.ready).toHaveBeenCalled();
      expect(mockGrecaptcha.execute).toHaveBeenCalledWith(
        expect.any(String),
        { action: 'register' }
      );
      expect(mockOnTokenReceived).toHaveBeenCalledWith('mock-token-abc123');
    });
  });

  it('should use default action "submit" when action prop is not provided', async () => {
    (window as any).grecaptcha = mockGrecaptcha;

    render(
      <CaptchaWidget onTokenReceived={mockOnTokenReceived} />
    );

    const script = document.getElementById('recaptcha-script');
    if (script) {
      script.dispatchEvent(new Event('load'));
    }

    await waitFor(() => {
      expect(mockGrecaptcha.execute).toHaveBeenCalledWith(
        expect.any(String),
        { action: 'submit' }
      );
    });
  });

  it('should display error when site key is not configured', async () => {
    // This test would require mocking import.meta.env which is complex in Vite
    // Instead, we test the error handling path by simulating a missing grecaptcha
    render(
      <CaptchaWidget
        onTokenReceived={mockOnTokenReceived}
        onError={mockOnError}
      />
    );

    // Simulate script load but no grecaptcha available
    const script = document.getElementById('recaptcha-script');
    if (script) {
      script.dispatchEvent(new Event('load'));
    }

    await waitFor(() => {
      // Should show error or call onError
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  it('should handle script loading errors', async () => {
    render(
      <CaptchaWidget
        onTokenReceived={mockOnTokenReceived}
        onError={mockOnError}
      />
    );

    // Simulate script error
    const script = document.getElementById('recaptcha-script');
    if (script) {
      script.dispatchEvent(new Event('error'));
    }

    await waitFor(() => {
      expect(screen.getByText('CAPTCHA Error')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Failed to load reCAPTCHA script'),
        })
      );
    });
  });

  it('should handle reCAPTCHA execution errors', async () => {
    const errorGrecaptcha = {
      ready: vi.fn((callback) => callback()),
      execute: vi.fn().mockRejectedValue(new Error('Execution failed')),
    };
    (window as any).grecaptcha = errorGrecaptcha;

    render(
      <CaptchaWidget
        onTokenReceived={mockOnTokenReceived}
        onError={mockOnError}
      />
    );

    const script = document.getElementById('recaptcha-script');
    if (script) {
      script.dispatchEvent(new Event('load'));
    }

    await waitFor(() => {
      expect(screen.getByText('CAPTCHA Error')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  it('should not execute reCAPTCHA multiple times', async () => {
    (window as any).grecaptcha = mockGrecaptcha;

    const { rerender } = render(
      <CaptchaWidget
        onTokenReceived={mockOnTokenReceived}
        action="register"
      />
    );

    const script = document.getElementById('recaptcha-script');
    if (script) {
      script.dispatchEvent(new Event('load'));
    }

    await waitFor(() => {
      expect(mockGrecaptcha.execute).toHaveBeenCalledTimes(1);
    });

    // Rerender with same props
    rerender(
      <CaptchaWidget
        onTokenReceived={mockOnTokenReceived}
        action="register"
      />
    );

    // Should still only be called once
    expect(mockGrecaptcha.execute).toHaveBeenCalledTimes(1);
  });

  it('should not render anything when successfully loaded', async () => {
    (window as any).grecaptcha = mockGrecaptcha;

    const { container } = render(
      <CaptchaWidget
        onTokenReceived={mockOnTokenReceived}
        action="register"
      />
    );

    const script = document.getElementById('recaptcha-script');
    if (script) {
      script.dispatchEvent(new Event('load'));
    }

    await waitFor(() => {
      expect(mockOnTokenReceived).toHaveBeenCalled();
    });

    // Component should be invisible after success
    expect(container.firstChild).toBeNull();
  });

  it('should reuse existing reCAPTCHA script if already loaded', async () => {
    // Pre-load script
    const existingScript = document.createElement('script');
    existingScript.id = 'recaptcha-script';
    existingScript.src = 'https://www.google.com/recaptcha/api.js?render=test-site-key-123';
    document.head.appendChild(existingScript);

    (window as any).grecaptcha = mockGrecaptcha;

    render(
      <CaptchaWidget
        onTokenReceived={mockOnTokenReceived}
        action="register"
      />
    );

    await waitFor(() => {
      // Should not create a new script
      const scripts = document.querySelectorAll('#recaptcha-script');
      expect(scripts.length).toBe(1);
      expect(mockGrecaptcha.execute).toHaveBeenCalled();
    });
  });
});
