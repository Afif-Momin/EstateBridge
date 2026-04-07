# CAPTCHA Validation Middleware Usage

## Overview

The `captchaValidator` middleware provides CAPTCHA validation for API endpoints to prevent bot registrations and spam.

## Requirements

- **Requirements 19.3**: Validate CAPTCHA token on backend before processing registration
- **Requirements 19.4**: Reject registration if CAPTCHA validation fails with error message

## Implementation

The middleware is implemented as a factory function that accepts an action parameter, allowing it to be reused across different endpoints with different CAPTCHA actions.

## Usage

### Basic Usage

```typescript
import { validateCaptcha } from '../middleware/captchaValidator';

// Apply to registration endpoint
router.post('/register', validateCaptcha('register'), register);

// Apply to other endpoints
router.post('/login', validateCaptcha('login'), login);
router.post('/reset-password', validateCaptcha('reset-password'), resetPassword);
```

### How It Works

1. **Extracts CAPTCHA token** from `req.body.captchaToken`
2. **Validates token** by calling `verificationService.validateCaptcha(token, action)`
3. **Returns 400 error** with message "CAPTCHA validation failed" if validation fails
4. **Calls next()** if validation succeeds, allowing the request to proceed

### Request Format

Clients must include the CAPTCHA token in the request body:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "captchaToken": "03AGdBq24...",
  ...
}
```

### Error Responses

**Missing Token:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "CAPTCHA token is required"
  }
}
```

**Invalid Token:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "CAPTCHA validation failed"
  }
}
```

## Testing

The middleware includes comprehensive unit tests covering:
- Valid CAPTCHA tokens
- Missing CAPTCHA tokens
- Invalid CAPTCHA tokens
- Service errors
- Different action types
- Edge cases (empty string, null values)

Run tests:
```bash
npm test -- captchaValidator.test.ts
```

## Integration with Verification Service

The middleware delegates actual CAPTCHA validation to `verificationService.validateCaptcha()`, which:
- Calls Google reCAPTCHA API
- Checks score threshold (0.5 for v3)
- Validates action matches
- Checks token expiration (2 minutes)
- Supports both reCAPTCHA v2 and v3

## Next Steps

To complete CAPTCHA integration:
1. Apply middleware to registration endpoint (Task 3.4)
2. Update registration validator to require captchaToken field
3. Implement frontend CAPTCHA widget (Task 3.5)
4. Write property-based tests (Task 3.4)
