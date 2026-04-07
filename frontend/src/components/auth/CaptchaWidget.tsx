import { useEffect, useRef, useState } from 'react';

interface CaptchaWidgetProps {
  onTokenReceived: (token: string) => void;
  action?: string;
  onError?: (error: Error) => void;
}

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SCRIPT_ID = 'recaptcha-script';
const RECAPTCHA_V3_SITE_KEY = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
const IS_DEV_MODE = import.meta.env.DEV;

/**
 * CaptchaWidget Component
 * 
 * Integrates Google reCAPTCHA v3 for invisible bot detection.
 * Automatically loads the reCAPTCHA script and executes validation.
 * 
 * In development mode without valid keys, generates a mock token for testing.
 * 
 * @param onTokenReceived - Callback function that receives the CAPTCHA token
 * @param action - Action name for reCAPTCHA (e.g., 'register', 'login')
 * @param onError - Optional error handler
 */
export function CaptchaWidget({
  onTokenReceived,
  action = 'submit',
  onError,
}: CaptchaWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const executedRef = useRef(false);

  useEffect(() => {
    // Development mode bypass - generate mock token if keys not configured
    if (IS_DEV_MODE && (!RECAPTCHA_V3_SITE_KEY || RECAPTCHA_V3_SITE_KEY.includes('your-recaptcha'))) {
      console.warn('⚠️ reCAPTCHA keys not configured. Using development bypass mode.');
      console.warn('⚠️ Get real keys from: https://www.google.com/recaptcha/admin');
      
      // Generate a mock token for development
      const mockToken = `dev_mock_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      setTimeout(() => {
        setLoading(false);
        onTokenReceived(mockToken);
      }, 500); // Simulate network delay
      
      return;
    }

    // Validate site key
    if (!RECAPTCHA_V3_SITE_KEY) {
      const err = new Error('reCAPTCHA site key is not configured');
      setError(err.message);
      setLoading(false);
      onError?.(err);
      return;
    }

    // Load reCAPTCHA script if not already loaded
    const loadRecaptchaScript = () => {
      // Check if script already exists
      if (document.getElementById(RECAPTCHA_SCRIPT_ID)) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.id = RECAPTCHA_SCRIPT_ID;
        script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_V3_SITE_KEY}`;
        script.async = true;
        script.defer = true;

        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));

        document.head.appendChild(script);
      });
    };

    // Execute reCAPTCHA
    const executeRecaptcha = async () => {
      try {
        await loadRecaptchaScript();

        // Wait for grecaptcha to be ready
        if (!window.grecaptcha) {
          throw new Error('reCAPTCHA not loaded');
        }

        window.grecaptcha.ready(async () => {
          try {
            // Prevent multiple executions
            if (executedRef.current) {
              return;
            }
            executedRef.current = true;

            const token = await window.grecaptcha!.execute(RECAPTCHA_V3_SITE_KEY!, {
              action,
            });

            setLoading(false);
            onTokenReceived(token);
          } catch (err) {
            const error = err instanceof Error ? err : new Error('reCAPTCHA execution failed');
            setError(error.message);
            setLoading(false);
            onError?.(error);
          }
        });
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize reCAPTCHA');
        setError(error.message);
        setLoading(false);
        onError?.(error);
      }
    };

    executeRecaptcha();
  }, [action, onTokenReceived, onError]);

  // This component is invisible (reCAPTCHA v3)
  // Only show error state if needed
  if (error) {
    return (
      <div className="text-sm text-error-600 p-2 bg-error-50 rounded border border-error-200">
        <p className="font-medium">CAPTCHA Error</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  // Show loading indicator
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Verifying...</span>
      </div>
    );
  }

  // Successfully loaded and executed - invisible
  return null;
}
