# API Documentation - Platform Enhancements

This document describes the new and updated API endpoints introduced by the platform enhancements feature.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

Most endpoints require authentication using Firebase Auth tokens. Include the token in the Authorization header:

```
Authorization: Bearer <firebase-auth-token>
```

## Rate Limiting

The API implements rate limiting on several endpoints:

- **Registration**: 5 requests per IP per hour
- **Property Creation**: 5 requests per user per 24 hours (admins exempt)
- **Appointment Requests**: 3 requests per buyer per property

When rate limited, the API returns:
- Status: `429 Too Many Requests`
- Response includes `resetAt` timestamp indicating when the limit resets

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid request data
- `AUTHENTICATION_ERROR`: Missing or invalid auth token
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND_ERROR`: Resource not found
- `CONFLICT_ERROR`: Resource conflict (e.g., duplicate)
- `RATE_LIMIT_ERROR`: Rate limit exceeded

---

## Authentication Endpoints

### Register User

Creates a new user account with location data and email verification.

**Endpoint**: `POST /auth/register`

**Rate Limit**: 5 requests per IP per hour

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "buyer",
  "buy_country": "US",
  "buy_city": "New York",
  "buy_state": "NY",
  "buy_address": "123 Main St",
  "buy_pincode": "10001",
  "captchaToken": "recaptcha-token-here"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "buyer",
      "emailVerified": false,
      "currency": "USD",
      "buy_country": "US",
      "buy_city": "New York"
    },
    "message": "Registration successful. Please check your email to verify your account."
  }
}
```

**Notes**:
- CAPTCHA token is required (reCAPTCHA v3 or v2)
- Currency is automatically determined based on country (US → USD, others → INR)
- Verification email is sent automatically
- User must verify email before creating properties

---

### Verify Email

Verifies user email using the token sent via email.

**Endpoint**: `GET /auth/verify-email?token=<verification-token>`

**Authentication**: Not required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully"
  }
}
```

**Error Responses**:
- `400`: Invalid or expired token
- `404`: Token not found

---

### Resend Verification Email

Resends the email verification link.

**Endpoint**: `POST /auth/resend-verification`

**Authentication**: Required

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Verification email sent"
  }
}
```

**Error Responses**:
- `400`: Email already verified
- `429`: Too many resend attempts (max 3 per hour)

---

### Get Verification Status

Checks if user's email is verified.

**Endpoint**: `GET /auth/verification-status`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "emailVerified": true
  }
}
```

---

## Property Endpoints

### Create Property

Creates a new property listing (requires email verification).

**Endpoint**: `POST /properties`

**Authentication**: Required (verified email)

**Rate Limit**: 5 properties per user per 24 hours (admins exempt)

**Request Body**:
```json
{
  "title": "Beautiful 3BR Apartment",
  "description": "Spacious apartment in downtown",
  "propertyType": "Apartment",
  "price": 500000,
  "location": "New York, NY",
  "bedrooms": 3,
  "bathrooms": 2,
  "area": 1500,
  "pro_status": "For Sale",
  "added_by_broker": false,
  "images": ["url1", "url2"]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "property": {
      "id": "property-id",
      "title": "Beautiful 3BR Apartment",
      "pro_status": "Waiting for Admin Approval",
      "currency": "USD",
      "flagged": false,
      "reportCount": 0,
      "createdAt": "2026-03-31T10:00:00Z"
    }
  }
}
```

**Notes**:
- Initial status is always "Waiting for Admin Approval"
- Currency is inherited from user profile
- Spam detection runs automatically (may flag property)
- Email verification is required

**Error Responses**:
- `401`: Email not verified
- `429`: Rate limit exceeded (includes `resetAt` timestamp)

---

### Update Property Status

Updates property status (seller or admin only).

**Endpoint**: `PATCH /properties/:id/status`

**Authentication**: Required (property owner or admin)

**Request Body**:
```json
{
  "pro_status": "For Sale"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "property": {
      "id": "property-id",
      "pro_status": "For Sale",
      "updatedAt": "2026-03-31T10:00:00Z"
    }
  }
}
```

**Valid Status Values**:
- `For Sale`
- `For Rent`
- `Under Construction`
- `Closed`
- `Finished`
- `Waiting for Admin Approval` (admin only)
- `Rejected` (admin only)

---

### Generate Property Brochure

Generates a PDF brochure for the property.

**Endpoint**: `POST /properties/:id/brochure`

**Authentication**: Required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://storage.googleapis.com/...",
    "fileName": "property-brochure-123.pdf",
    "expiresAt": "2026-03-31T11:00:00Z"
  }
}
```

**Notes**:
- Download URL expires after 1 hour
- Brochure includes property details, images, QR code, and seller contact
- Estate Bridge branding is included

---

### Report Property

Reports a property as suspicious or inappropriate.

**Endpoint**: `POST /properties/:id/report`

**Authentication**: Required

**Request Body**:
```json
{
  "reason": "spam",
  "additionalDetails": "This listing appears to be fake"
}
```

**Valid Reasons**:
- `spam`
- `inappropriate`
- `duplicate`
- `fraud`
- `incorrect_info`
- `other`

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "report": {
      "id": "report-id",
      "propertyId": "property-id",
      "reason": "spam",
      "status": "pending",
      "createdAt": "2026-03-31T10:00:00Z"
    }
  }
}
```

**Notes**:
- Users can only report each property once
- Property is auto-flagged after 3 reports
- Admins are notified of new reports

**Error Responses**:
- `409`: User already reported this property

---

## Admin Endpoints

### Get Pending Properties

Retrieves properties waiting for admin approval.

**Endpoint**: `GET /admin/properties/pending`

**Authentication**: Required (admin only)

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "property-id",
        "title": "Property Title",
        "pro_status": "Waiting for Admin Approval",
        "sellerId": "seller-id",
        "createdAt": "2026-03-31T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
}
```

---

### Approve Property

Approves a pending property listing.

**Endpoint**: `POST /admin/properties/:id/approve`

**Authentication**: Required (admin only)

**Request Body**:
```json
{
  "approvedStatus": "For Sale"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "property": {
      "id": "property-id",
      "pro_status": "For Sale",
      "approvedBy": "admin-id",
      "approvedAt": "2026-03-31T10:00:00Z"
    }
  }
}
```

---

### Reject Property

Rejects a pending property listing.

**Endpoint**: `POST /admin/properties/:id/reject`

**Authentication**: Required (admin only)

**Request Body**:
```json
{
  "reason": "Incomplete information or policy violation"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "property": {
      "id": "property-id",
      "pro_status": "Rejected",
      "rejectedBy": "admin-id",
      "rejectedAt": "2026-03-31T10:00:00Z",
      "rejectionReason": "Incomplete information or policy violation"
    }
  }
}
```

---

### Get Flagged Properties

Retrieves properties flagged by spam detection or user reports.

**Endpoint**: `GET /admin/properties/flagged`

**Authentication**: Required (admin only)

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "properties": [
      {
        "id": "property-id",
        "title": "Property Title",
        "flagged": true,
        "flaggedReason": "Duplicate content detected",
        "reportCount": 3,
        "flaggedAt": "2026-03-31T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12
    }
  }
}
```

---

### Clear Property Flag

Clears the spam/suspicious flag from a property.

**Endpoint**: `POST /admin/properties/:id/clear-flag`

**Authentication**: Required (admin only)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "property": {
      "id": "property-id",
      "flagged": false,
      "flaggedReason": null,
      "flaggedAt": null
    }
  }
}
```

---

### Get Reports

Retrieves all property reports.

**Endpoint**: `GET /admin/reports`

**Authentication**: Required (admin only)

**Query Parameters**:
- `status` (optional): Filter by status (`pending`, `reviewed`, `dismissed`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report-id",
        "propertyId": "property-id",
        "reporterId": "user-id",
        "reason": "spam",
        "status": "pending",
        "createdAt": "2026-03-31T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8
    }
  }
}
```

---

### Review Report

Reviews a property report and takes action.

**Endpoint**: `POST /admin/reports/:id/review`

**Authentication**: Required (admin only)

**Request Body**:
```json
{
  "action": "flag_property",
  "notes": "Confirmed as spam"
}
```

**Valid Actions**:
- `dismiss`: Dismiss the report (no action)
- `flag_property`: Flag the property as suspicious
- `remove_property`: Remove the property listing

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "report": {
      "id": "report-id",
      "status": "reviewed",
      "reviewedBy": "admin-id",
      "reviewedAt": "2026-03-31T10:00:00Z"
    }
  }
}
```

---

## Appointment Endpoints

### Create Appointment

Creates an appointment request with buyer qualification.

**Endpoint**: `POST /appointments`

**Authentication**: Required (verified email)

**Rate Limit**: 3 requests per buyer per property

**Request Body**:
```json
{
  "listingId": "property-id",
  "sellerId": "seller-id",
  "requestedDateTime": "2026-04-01T14:00:00Z",
  "reason_to_buy": "Self Use",
  "is_property_dealer": false,
  "buyer_name": "John Doe",
  "buyer_phone": "+1234567890",
  "purchase_timeline": "1-3 months",
  "home_loan_interest": true,
  "site_visit_interest": true,
  "terms_accepted": true,
  "privacy_policy_accepted": true
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "appointment": {
      "id": "appointment-id",
      "status": "pending",
      "contact_revealed": true,
      "contact_revealed_at": "2026-03-31T10:00:00Z",
      "seller_contact": {
        "name": "Jane Smith",
        "phone": "+0987654321",
        "email": "seller@example.com"
      }
    }
  }
}
```

**Notes**:
- Seller contact information is revealed immediately upon successful submission
- Rate limit prevents spam (3 requests per buyer per property)
- All qualification fields are required except optional ones

**Error Responses**:
- `401`: Email not verified
- `429`: Rate limit exceeded (max 3 per property)

---

## Image Upload Endpoints

### Upload Property Images

Uploads and compresses property images.

**Endpoint**: `POST /properties/:id/images`

**Authentication**: Required (property owner)

**Content-Type**: `multipart/form-data`

**Request**:
```
POST /properties/property-id/images
Content-Type: multipart/form-data

images: [file1.jpg, file2.jpg]
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "imageUrls": [
      "https://storage.googleapis.com/.../full.jpg"
    ],
    "thumbnailUrls": [
      "https://storage.googleapis.com/.../thumb.jpg"
    ]
  }
}
```

**Notes**:
- Images are automatically compressed to max 1920px width
- Thumbnails are generated at 400px width
- Max file size: 10MB per image
- Supported formats: JPEG, PNG, WebP
- Max 10 images per property

---

## Currency Formatting

All prices in API responses are formatted according to the user's currency:

**USD Format**:
- Symbol: `$`
- Decimal places: 2
- Example: `$500,000.00 USD`

**INR Format**:
- Symbol: `₹`
- Decimal places: 0
- Numbering: Indian system (lakhs, crores)
- Example: `₹50,00,000 INR`

---

## Webhooks (Future)

The following webhooks will be available when Cloud Functions are deployed:

### Property Created
Triggered when a new property is created and needs admin approval.

### Property Flagged
Triggered when a property is flagged by spam detection or reaches report threshold.

### Email Verification
Triggered when a user registers to send verification email.

---

## Testing

Use the following test credentials for development:

**Admin User**:
- Email: `admin@estatebridge.com`
- Password: `Admin123!`

**Test Buyer**:
- Email: `buyer@test.com`
- Password: `Test123!`

**Test Seller**:
- Email: `seller@test.com`
- Password: `Test123!`

---

## Support

For API support or to report issues:
- Email: support@estatebridge.com
- Documentation: https://docs.estatebridge.com
- GitHub Issues: https://github.com/estatebridge/api/issues
