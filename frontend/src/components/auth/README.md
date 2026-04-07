# Authentication Components

## CaptchaWidget

The `CaptchaWidget` component integrates Google reCAPTCHA v3 for invisible bot detection during user registration and other sensitive operations.

### Features

- **Invisible reCAPTCHA v3**: Automatically executes in the background without user interaction
- **Dynamic Script Loading**: Loads the reCAPTCHA script only when needed
- **Error Handling**: Gracefully handles loading errors and validation failures
- **Configurable Actions**: Supports different action names for different use cases
- **Loading States**: Shows visual feedback during verification

### Usage

```tsx
import { CaptchaWidget } from './components/auth/CaptchaWidget';

function RegistrationForm() {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const handleTokenReceived = (token: string) => {
    setCaptchaToken(token);
    // Use the token in your registration API call
  };

  const handleError = (error: Error) => {
    console.error('CAPTCHA error:', error);
    // Show error message to user
  };

  return (
    <form>
      {/* Your form fields */}
      
      <CaptchaWidget
        onTokenReceived={handleTokenReceived}
        action="register"
        onError={handleError}
      />
      
      <button type="submit" disabled={!captchaToken}>
        Register
      </button>
    </form>
  );
}
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onTokenReceived` | `(token: string) => void` | Yes | - | Callback function that receives the CAPTCHA token when validation succeeds |
| `action` | `string` | No | `'submit'` | Action name for reCAPTCHA (e.g., 'register', 'login', 'contact') |
| `onError` | `(error: Error) => void` | No | - | Optional error handler for CAPTCHA failures |

### Environment Configuration

The component requires the reCAPTCHA v3 site key to be configured in your environment variables:

```env
VITE_RECAPTCHA_V3_SITE_KEY=your-recaptcha-v3-site-key
```

### Backend Validation

The token received from the CaptchaWidget must be validated on the backend before processing the request. The backend should:

1. Extract the `captchaToken` from the request body
2. Call the Google reCAPTCHA API to verify the token
3. Check the score (v3) or success status (v2)
4. Reject the request if validation fails

Example backend validation:

```typescript
// Backend validation (already implemented in backend/src/middleware/captchaValidator.ts)
const response = await axios.post(
  'https://www.google.com/recaptcha/api/siteverify',
  null,
  {
    params: {
      secret: process.env.RECAPTCHA_V3_SECRET_KEY,
      response: captchaToken,
    },
  }
);

if (!response.data.success || response.data.score < 0.5) {
  throw new Error('CAPTCHA validation failed');
}
```

### States

The component has three visual states:

1. **Loading**: Shows a spinner with "Verifying..." text while the CAPTCHA is being executed
2. **Success**: Becomes invisible after successful validation
3. **Error**: Shows an error message if validation fails

### Notes

- The component automatically prevents multiple executions using a ref
- The reCAPTCHA script is loaded only once per page, even if multiple components are rendered
- Tokens expire after 2 minutes according to Google's reCAPTCHA policy
- For development/testing, you can use Google's test keys that always pass validation

### Testing

The component includes comprehensive unit tests covering:

- Script loading and initialization
- Token generation and callback execution
- Error handling for various failure scenarios
- Default action behavior
- Script reuse when already loaded
- Prevention of multiple executions

Run tests with:

```bash
npm test -- CaptchaWidget.test.tsx
```

### Future Enhancements

- **v2 Fallback**: Implement reCAPTCHA v2 checkbox challenge for low v3 scores (currently handled by backend)
- **Retry Logic**: Add automatic retry on transient failures
- **Custom Styling**: Allow customization of loading and error states
- **Analytics**: Track CAPTCHA success/failure rates
