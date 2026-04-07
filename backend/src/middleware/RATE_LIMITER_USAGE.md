# Rate Limiter Middleware Usage Guide

This document describes how to use the rate limiting middleware in the Estate Bridge application.

## Overview

The rate limiter middleware provides three middleware functions to prevent abuse and spam:

1. **registrationRateLimiter** - Limits registration attempts per IP address
2. **propertyCreationRateLimiter** - Limits property creation per user
3. **appointmentRequestRateLimiter** - Limits appointment requests per user per property

## Middleware Functions

### registrationRateLimiter

Checks IP-based rate limit before allowing registration.

**Requirements:** 3.4, 3.5

**Limits:**
- 5 registration attempts per IP address per hour
- Returns 429 error with resetAt timestamp when limit exceeded

**Usage:**
```typescript
import { registrationRateLimiter } from '../middleware/rateLimiter';

router.post('/register', 
  validateCaptcha('register'),
  registrationRateLimiter,
  registerController
);
```

**IP Address Extraction:**
- First checks `x-forwarded-for` header (for proxied requests)
- Falls back to `req.ip`
- Handles unknown IP addresses gracefully

**Response on Limit Exceeded:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Registration rate limit exceeded. Please try again after 2024-01-01T12:00:00Z",
    "details": {
      "resetAt": "2024-01-01T12:00:00Z",
      "remaining": 0
    }
  },
  "timestamp": "2024-01-01T11:30:00Z"
}
```

### propertyCreationRateLimiter

Checks user-based rate limit before allowing property creation.

**Requirements:** 5.1, 5.2

**Limits:**
- 5 properties per user per 24 hours
- Returns 429 error with resetAt timestamp when limit exceeded

**Prerequisites:**
- User must be authenticated (requires `authenticate` middleware)

**Usage:**
```typescript
import { authenticate } from '../middleware/auth';
import { requireEmailVerified } from '../middleware/emailVerificationCheck';
import { propertyCreationRateLimiter } from '../middleware/rateLimiter';

router.post('/properties',
  authenticate,
  requireEmailVerified,
  propertyCreationRateLimiter,
  createPropertyController
);
```

**Response on Limit Exceeded:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Property creation rate limit exceeded. You can create 0 more properties. Limit resets at 2024-01-02T12:00:00Z",
    "details": {
      "resetAt": "2024-01-02T12:00:00Z",
      "remaining": 0
    }
  },
  "timestamp": "2024-01-01T11:30:00Z"
}
```

### appointmentRequestRateLimiter

Checks user+property rate limit before allowing appointment creation.

**Requirements:** 10.1, 10.2

**Limits:**
- 3 appointment requests per user per property (permanent limit)
- Returns 429 error when limit exceeded

**Prerequisites:**
- User must be authenticated (requires `authenticate` middleware)
- Property ID must be provided in `req.params.propertyId`, `req.body.listingId`, or `req.body.propertyId`

**Usage:**
```typescript
import { authenticate } from '../middleware/auth';
import { appointmentRequestRateLimiter } from '../middleware/rateLimiter';

router.post('/appointments',
  authenticate,
  appointmentRequestRateLimiter,
  createAppointmentController
);
```

**Response on Limit Exceeded:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Appointment request rate limit exceeded. You have reached the maximum number of appointment requests for this property.",
    "details": {
      "remaining": 0
    }
  },
  "timestamp": "2024-01-01T11:30:00Z"
}
```

## Error Handling

All middleware functions:
- Throw `RateLimitError` (429 status) when limit is exceeded
- Throw `AuthenticationError` (401 status) when authentication is required but missing
- Throw `ValidationError` (400 status) when required parameters are missing
- Continue on service errors to avoid blocking legitimate users

## Testing

Unit tests are available in `backend/src/__tests__/middleware/rateLimiter.test.ts`.

Run tests:
```bash
npm test -- rateLimiter.test.ts
```

## Implementation Details

The middleware uses the `rateLimitingService` which in turn uses the `rateLimitRepository` to track rate limit entries in Firestore.

**Rate Limit Storage:**
- Registration: Stored by IP address
- Property Creation: Stored by user ID
- Appointment Requests: Stored by user ID + property ID

**Window Management:**
- Registration: 1 hour rolling window
- Property Creation: 24 hour rolling window
- Appointment Requests: Permanent (no expiration)
