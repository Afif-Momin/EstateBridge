# Design Document: Platform Enhancements

## Overview

This design document specifies the technical implementation for platform enhancements to the Estate Bridge real estate platform. The enhancements address critical areas including user verification, spam prevention, multi-currency support, property lifecycle management, and infrastructure optimization.

### Goals

1. Enhance user registration with detailed location data collection for better property matching
2. Implement multi-currency support (USD/INR) based on user location
3. Prevent bot registrations and spam through CAPTCHA and email verification
4. Add comprehensive property status management with admin approval workflow
5. Enable professional PDF brochure generation for property listings
6. Qualify buyer interest through detailed forms to improve lead quality
7. Implement rate limiting and suspicious pattern detection for spam prevention
8. Optimize Firebase infrastructure with proper indexes and security rules
9. Add image compression and optimization to reduce storage costs
10. Implement admin notification system for property approvals

### Non-Goals

1. Currency conversion between USD and INR (prices are stored in seller's currency)
2. Real-time currency exchange rate updates
3. Payment processing or transaction handling
4. Advanced fraud detection using machine learning
5. Multi-language support for brochures
6. Video content support for property listings
7. Integration with external property valuation services

### Architecture Overview

The platform enhancements follow a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Registration │  │   Property   │  │   Brochure   │      │
│  │   Forms      │  │  Management  │  │   Download   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend API (Express + TypeScript)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Verification │  │ Rate Limiting│  │   Currency   │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Property   │  │   Brochure   │  │    Image     │      │
│  │   Service    │  │   Generator  │  │  Compression │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Firebase Services                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Firestore   │  │   Storage    │  │Cloud Functions│     │
│  │   Database   │  │   (Images)   │  │ (Notifications)│    │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  reCAPTCHA   │  │  Email SMTP  │  │  PDF Library │      │
│  │   (Google)   │  │   Service    │  │  (PDFKit)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, Zustand (state management)
- **Backend**: Node.js, Express, TypeScript
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions
- **Authentication**: Firebase Authentication
- **CAPTCHA**: Google reCAPTCHA v3 + v2 fallback
- **PDF Generation**: PDFKit
- **Image Processing**: Sharp
- **Email**: Nodemailer with SMTP
- **Validation**: Zod

## Architecture

### Component Architecture

#### Frontend Components

```
src/
├── components/
│   ├── auth/
│   │   ├── RegistrationForm.tsx          # Enhanced with location fields
│   │   ├── EmailVerificationBanner.tsx   # Verification reminder
│   │   └── CaptchaWidget.tsx             # reCAPTCHA integration
│   ├── property/
│   │   ├── PropertyStatusBadge.tsx       # Status display
│   │   ├── PropertyForm.tsx              # Enhanced with new statuses
│   │   ├── BrochureDownloadButton.tsx    # PDF download trigger
│   │   ├── ReportPropertyModal.tsx       # User reporting
│   │   └── BuyerQualificationForm.tsx    # Enhanced interest form
│   └── admin/
│       ├── PropertyApprovalQueue.tsx     # Admin review interface
│       └── SuspiciousListingsPanel.tsx   # Flagged properties
├── services/
│   ├── captchaService.ts                 # reCAPTCHA integration
│   ├── currencyService.ts                # Currency formatting
│   ├── brochureService.ts                # PDF generation API calls
│   └── verificationService.ts            # Email verification
└── hooks/
    ├── useRateLimiting.ts                # Client-side rate limit tracking
    └── useCurrency.ts                    # Currency display logic
```

#### Backend Services

```
src/
├── services/
│   ├── verificationService.ts            # Email verification & CAPTCHA
│   ├── rateLimitingService.ts            # Rate limiting logic
│   ├── currencyService.ts                # Currency determination
│   ├── propertyStatusService.ts          # Status management
│   ├── brochureGeneratorService.ts       # PDF generation
│   ├── imageCompressionService.ts        # Image optimization
│   ├── spamDetectionService.ts           # Suspicious pattern detection
│   └── adminNotificationService.ts       # Admin alerts
├── middleware/
│   ├── captchaValidator.ts               # CAPTCHA validation
│   ├── emailVerificationCheck.ts         # Email verified check
│   ├── rateLimiter.ts                    # Rate limiting middleware
│   └── adminOnly.ts                      # Admin authorization
├── repositories/
│   ├── verificationTokenRepository.ts    # Token CRUD
│   ├── reportRepository.ts               # User reports
│   └── rateLimitRepository.ts            # Rate limit tracking
└── validators/
    ├── locationValidator.ts              # Location data validation
    └── qualificationValidator.ts         # Buyer form validation
```

#### Firebase Cloud Functions

```
functions/
├── src/
│   ├── triggers/
│   │   ├── onPropertyCreate.ts           # Admin notification trigger
│   │   └── onImageUpload.ts              # Image compression trigger
│   └── scheduled/
│       └── cleanupExpiredTokens.ts       # Token cleanup (daily)
```

### Data Flow

#### User Registration Flow

```
User → Registration Form → CAPTCHA Validation → Backend API
                                                      ↓
                                            Validate Location Data
                                                      ↓
                                            Determine Currency (USD/INR)
                                                      ↓
                                            Create User in Firestore
                                                      ↓
                                            Generate Verification Token
                                                      ↓
                                            Send Verification Email
                                                      ↓
                                            Return Success (unverified)
```

#### Property Creation Flow

```
Seller → Property Form → Check Email Verified → Check Rate Limit
                                                      ↓
                                            Create Property (status: Waiting)
                                                      ↓
                                            Compress & Upload Images
                                                      ↓
                                            Run Spam Detection
                                                      ↓
                                            Trigger Admin Notification
                                                      ↓
                                            Return Success
```

#### Brochure Generation Flow

```
Buyer → Click Download → Backend API → Fetch Property Data
                                              ↓
                                        Generate PDF with PDFKit
                                              ↓
                                        Upload to Storage
                                              ↓
                                        Return Signed URL (1 hour expiry)
```

## Components and Interfaces

### Data Models

#### Enhanced User Profile

```typescript
interface UserProfile {
  // Existing fields
  id: string;
  email: string;
  fullName: string;
  role: 'buyer' | 'seller' | 'admin';
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // New fields for platform enhancements
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: Date;
  
  // Location data
  buy_country: string;          // ISO country code (e.g., "US", "IN")
  buy_city: string;
  buy_state: string;
  buy_address: string;
  buy_pincode: string;
  
  // Currency preference
  currency: 'USD' | 'INR';
  
  // Rate limiting tracking
  propertiesCreatedToday: number;
  lastPropertyCreationDate: Date;
}
```

#### Enhanced Property Model

```typescript
interface Property {
  // Existing fields
  id: string;
  title: string;
  description: string;
  price: number;
  region: string;
  address: string;
  propertyType: PropertyType;
  sellerId: string;
  imageUrls: string[];
  thumbnailUrls: string[];      // New: compressed thumbnails
  createdAt: Date;
  updatedAt: Date;
  
  // New status management fields
  pro_status: PropertyStatus;   // New enum values
  added_by_broker: boolean;
  
  // Currency field
  currency: 'USD' | 'INR';
  
  // Spam detection fields
  flagged: boolean;
  flaggedReason?: string;
  flaggedAt?: Date;
  reportCount: number;
  
  // Admin approval fields
  approvedBy?: string;          // Admin user ID
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
}

type PropertyStatus = 
  | 'For Sale'
  | 'For Rent'
  | 'Under Construction'
  | 'Closed'
  | 'Finished'
  | 'Waiting for Admin Approval'
  | 'Rejected';
```

#### Enhanced Appointment (Buyer Interest) Model

```typescript
interface BuyerInterest {
  // Existing fields
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  requestedDateTime: Date;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // New qualification fields
  reason_to_buy: 'Investment' | 'Self Use';
  is_property_dealer: boolean;
  buyer_name: string;
  buyer_phone: string;
  
  // Optional qualification fields
  purchase_timeline?: '3 months' | '6 months' | 'More than 6 months';
  home_loan_interest?: boolean;
  site_visit_interest?: boolean;
  
  // Terms acceptance
  terms_accepted: boolean;
  privacy_policy_accepted: boolean;
  
  // Contact revealed tracking
  contact_revealed: boolean;
  contact_revealed_at?: Date;
}
```

#### Verification Token Model

```typescript
interface VerificationToken {
  id: string;
  userId: string;
  token: string;
  type: 'email_verification' | 'password_reset';
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  createdAt: Date;
}
```

#### Property Report Model

```typescript
interface PropertyReport {
  id: string;
  propertyId: string;
  reporterId: string;
  reason: ReportReason;
  additionalDetails?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

type ReportReason = 
  | 'Spam'
  | 'Inappropriate Content'
  | 'Fake Images'
  | 'Duplicate Listing'
  | 'Other';
```

#### Rate Limit Tracking Model

```typescript
interface RateLimitEntry {
  id: string;
  userId: string;
  resourceType: 'property_creation' | 'appointment_request';
  resourceId?: string;          // For appointment: propertyId
  count: number;
  windowStart: Date;
  windowEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Brochure Model

```typescript
interface Brochure {
  id: string;
  propertyId: string;
  generatedBy: string;          // User ID
  fileUrl: string;
  fileName: string;
  fileSize: number;
  expiresAt: Date;
  createdAt: Date;
}
```

### API Endpoints

#### Authentication & Verification

```typescript
// Enhanced registration
POST /api/auth/register
Request: {
  email: string;
  password: string;
  fullName: string;
  role: 'buyer' | 'seller';
  buy_country: string;
  buy_city: string;
  buy_state: string;
  buy_address: string;
  buy_pincode: string;
  captchaToken: string;
}
Response: {
  success: true;
  data: {
    user: UserProfile;
    token: string;
    message: "Registration successful. Please verify your email."
  }
}

// Email verification
GET /api/auth/verify-email?token={token}
Response: {
  success: true;
  message: "Email verified successfully"
}

// Resend verification email
POST /api/auth/resend-verification
Request: {
  email: string;
}
Response: {
  success: true;
  message: "Verification email sent"
}

// Check email verification status
GET /api/auth/verification-status
Headers: { Authorization: "Bearer {token}" }
Response: {
  success: true;
  data: {
    emailVerified: boolean;
  }
}
```

#### Property Management

```typescript
// Create property (enhanced with verification check)
POST /api/properties
Headers: { Authorization: "Bearer {token}" }
Request: {
  title: string;
  description: string;
  price: number;
  currency: 'USD' | 'INR';
  region: string;
  address: string;
  propertyType: PropertyType;
  pro_status: 'For Sale' | 'For Rent' | 'Under Construction';
  added_by_broker: boolean;
  imageUrls: string[];
}
Response: {
  success: true;
  data: {
    property: Property;
    message: "Property submitted for admin approval"
  }
}

// Update property status
PATCH /api/properties/:id/status
Headers: { Authorization: "Bearer {token}" }
Request: {
  pro_status: PropertyStatus;
}
Response: {
  success: true;
  data: { property: Property }
}

// Admin approve property
POST /api/admin/properties/:id/approve
Headers: { Authorization: "Bearer {token}" }
Request: {
  approvedStatus: 'For Sale' | 'For Rent' | 'Under Construction';
}
Response: {
  success: true;
  data: { property: Property }
}

// Admin reject property
POST /api/admin/properties/:id/reject
Headers: { Authorization: "Bearer {token}" }
Request: {
  reason: string;
}
Response: {
  success: true;
  data: { property: Property }
}

// Get pending approvals (admin only)
GET /api/admin/properties/pending
Headers: { Authorization: "Bearer {token}" }
Query: { page?: number; limit?: number }
Response: {
  success: true;
  data: PaginatedResponse<Property>
}

// Report property
POST /api/properties/:id/report
Headers: { Authorization: "Bearer {token}" }
Request: {
  reason: ReportReason;
  additionalDetails?: string;
}
Response: {
  success: true;
  message: "Report submitted successfully"
}
```

#### Brochure Generation

```typescript
// Generate and download brochure
POST /api/properties/:id/brochure
Headers: { Authorization: "Bearer {token}" }
Response: {
  success: true;
  data: {
    downloadUrl: string;
    expiresAt: Date;
    fileName: string;
  }
}
```

#### Buyer Interest (Enhanced Appointments)

```typescript
// Submit qualified buyer interest
POST /api/appointments
Headers: { Authorization: "Bearer {token}" }
Request: {
  listingId: string;
  requestedDateTime: Date;
  reason_to_buy: 'Investment' | 'Self Use';
  is_property_dealer: boolean;
  buyer_name: string;
  buyer_phone: string;
  purchase_timeline?: '3 months' | '6 months' | 'More than 6 months';
  home_loan_interest?: boolean;
  site_visit_interest?: boolean;
  terms_accepted: boolean;
  privacy_policy_accepted: boolean;
}
Response: {
  success: true;
  data: {
    appointment: BuyerInterest;
    sellerContact: {
      name: string;
      email: string;
      phone: string;
    }
  }
}
```

#### Admin Endpoints

```typescript
// Get flagged properties
GET /api/admin/properties/flagged
Headers: { Authorization: "Bearer {token}" }
Query: { page?: number; limit?: number }
Response: {
  success: true;
  data: PaginatedResponse<Property>
}

// Clear property flag
POST /api/admin/properties/:id/clear-flag
Headers: { Authorization: "Bearer {token}" }
Response: {
  success: true;
  data: { property: Property }
}

// Get property reports
GET /api/admin/reports
Headers: { Authorization: "Bearer {token}" }
Query: { 
  propertyId?: string;
  status?: 'pending' | 'reviewed' | 'dismissed';
  page?: number;
  limit?: number;
}
Response: {
  success: true;
  data: PaginatedResponse<PropertyReport>
}

// Review report
POST /api/admin/reports/:id/review
Headers: { Authorization: "Bearer {token}" }
Request: {
  action: 'dismiss' | 'flag_property' | 'remove_property';
}
Response: {
  success: true;
  data: { report: PropertyReport }
}
```

### Service Interfaces

#### Verification Service

```typescript
interface IVerificationService {
  // CAPTCHA validation
  validateCaptcha(token: string, action: string): Promise<boolean>;
  
  // Email verification
  generateVerificationToken(userId: string): Promise<string>;
  sendVerificationEmail(email: string, token: string): Promise<void>;
  verifyEmailToken(token: string): Promise<{ userId: string; valid: boolean }>;
  resendVerificationEmail(email: string): Promise<void>;
  
  // Check verification status
  isEmailVerified(userId: string): Promise<boolean>;
}
```

#### Rate Limiting Service

```typescript
interface IRateLimitingService {
  // Property creation rate limiting
  checkPropertyCreationLimit(userId: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }>;
  incrementPropertyCreationCount(userId: string): Promise<void>;
  
  // Appointment request rate limiting
  checkAppointmentRequestLimit(
    userId: string,
    propertyId: string
  ): Promise<{
    allowed: boolean;
    remaining: number;
  }>;
  incrementAppointmentRequestCount(
    userId: string,
    propertyId: string
  ): Promise<void>;
  
  // IP-based rate limiting for registration
  checkRegistrationRateLimit(ipAddress: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }>;
  incrementRegistrationAttempt(ipAddress: string): Promise<void>;
}
```

#### Currency Service

```typescript
interface ICurrencyService {
  // Determine currency from country
  determineCurrency(countryCode: string): 'USD' | 'INR';
  
  // Format price for display
  formatPrice(amount: number, currency: 'USD' | 'INR'): string;
  
  // Validate country code
  isValidCountryCode(code: string): boolean;
  
  // Validate pincode format
  validatePincode(pincode: string, countryCode: string): boolean;
}
```

#### Brochure Generator Service

```typescript
interface IBrochureGeneratorService {
  // Generate PDF brochure
  generateBrochure(propertyId: string, userId: string): Promise<{
    downloadUrl: string;
    expiresAt: Date;
    fileName: string;
  }>;
  
  // Clean up expired brochures
  cleanupExpiredBrochures(): Promise<number>;
}
```

#### Image Compression Service

```typescript
interface IImageCompressionService {
  // Compress and upload image
  compressAndUpload(
    file: Buffer,
    propertyId: string,
    imageId: string
  ): Promise<{
    fullUrl: string;
    thumbnailUrl: string;
  }>;
  
  // Validate image
  validateImage(file: Buffer): Promise<{
    valid: boolean;
    error?: string;
  }>;
}
```

#### Spam Detection Service

```typescript
interface ISpamDetectionService {
  // Check for duplicate content
  checkDuplicateContent(description: string): Promise<{
    isDuplicate: boolean;
    similarPropertyId?: string;
    similarity: number;
  }>;
  
  // Check for duplicate images
  checkDuplicateImages(imageUrls: string[]): Promise<{
    hasDuplicates: boolean;
    matchingPropertyIds: string[];
  }>;
  
  // Flag property as suspicious
  flagProperty(
    propertyId: string,
    reason: string
  ): Promise<void>;
  
  // Check report threshold
  checkReportThreshold(propertyId: string): Promise<{
    shouldFlag: boolean;
    reportCount: number;
  }>;
}
```

#### Admin Notification Service

```typescript
interface IAdminNotificationService {
  // Send property approval notification
  notifyPropertyPendingApproval(property: Property): Promise<void>;
  
  // Send flagged property notification
  notifyPropertyFlagged(
    property: Property,
    reason: string
  ): Promise<void>;
  
  // Batch notifications
  batchNotifications(
    notifications: Array<{ type: string; data: any }>
  ): Promise<void>;
}
```


### Firebase Cloud Functions

#### Property Approval Notification Function

```typescript
// functions/src/triggers/onPropertyCreate.ts
export const onPropertyCreate = functions.firestore
  .document('properties/{propertyId}')
  .onCreate(async (snapshot, context) => {
    const property = snapshot.data();
    
    if (property.pro_status === 'Waiting for Admin Approval') {
      await adminNotificationService.notifyPropertyPendingApproval({
        id: context.params.propertyId,
        ...property
      });
    }
  });
```

#### Image Compression Function

```typescript
// functions/src/triggers/onImageUpload.ts
export const onImageUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    
    if (filePath?.startsWith('properties/') && !filePath.includes('_thumb')) {
      await imageCompressionService.generateThumbnail(filePath);
    }
  });
```

#### Token Cleanup Function

```typescript
// functions/src/scheduled/cleanupExpiredTokens.ts
export const cleanupExpiredTokens = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const expiredTokens = await db
      .collection('verification_tokens')
      .where('expiresAt', '<', new Date())
      .where('used', '==', false)
      .get();
    
    const batch = db.batch();
    expiredTokens.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    return { deleted: expiredTokens.size };
  });
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

1. **Currency assignment properties (2.1, 2.2, 2.3)** can be combined into a single property about currency determination based on country
2. **Rate limiting properties (5.1, 5.2, 5.3)** can be consolidated into one comprehensive property about the 5-property limit
3. **Appointment rate limiting properties (10.1, 10.2, 10.3)** can be combined similarly
4. **Property creation initial status (6.2, 7.1)** are duplicate - both test that new properties start with "Waiting for Admin Approval"
5. **CAPTCHA validation properties (3.2, 3.3, 19.3, 19.4)** overlap and can be consolidated
6. **Email verification requirement (4.3, 4.4, 15.3)** all test the same constraint from different angles
7. **Image compression properties (13.1, 13.2, 13.3, 13.5)** can be combined into fewer comprehensive properties
8. **Brochure content properties (8.1, 17.1, 17.2, 17.4)** overlap significantly

The following properties represent the unique, non-redundant validation requirements.

### Property 1: Location Data Completeness

*For any* user registration request, if it is accepted, then the stored user document must contain all required location fields: buy_country, buy_city, buy_state, buy_address, and buy_pincode.

**Validates: Requirements 1.1, 1.2**

### Property 2: Country Code Validation

*For any* registration request with an invalid ISO country code, the Registration_System must reject the request with a validation error.

**Validates: Requirements 1.3**

### Property 3: Pincode Format Validation

*For any* registration request, the pincode must match the expected format for the specified country, otherwise the request must be rejected.

**Validates: Requirements 1.4**

### Property 4: Validation Error Specificity

*For any* registration request with missing location fields, the error response must specify which fields are missing.

**Validates: Requirements 1.5**

### Property 5: Currency Assignment Based on Country

*For any* user registration, if the country is "US" then currency must be set to "USD", otherwise currency must be set to "INR".

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 6: USD Price Formatting

*For any* price amount in USD, the formatted string must match the pattern $X,XXX.XX with 2 decimal places and comma thousand separators.

**Validates: Requirements 2.4, 18.1, 18.3, 18.4**

### Property 7: INR Price Formatting

*For any* price amount in INR, the formatted string must match the Indian numbering pattern ₹X,XX,XXX with 0 decimal places and include the currency code.

**Validates: Requirements 2.4, 18.2, 18.3, 18.4**

### Property 8: CAPTCHA Validation Requirement

*For any* registration attempt with an invalid or missing CAPTCHA token, the system must reject the registration before creating any user account.

**Validates: Requirements 3.2, 3.3, 19.3, 19.4**

### Property 9: Registration Rate Limiting by IP

*For any* IP address, after 5 registration attempts within 1 hour, the 6th attempt must be rejected with a rate limit error, and further attempts must remain blocked for 1 hour from the first attempt.

**Validates: Requirements 3.4, 3.5**

### Property 10: Email Verification Token Generation

*For any* successful user registration, a verification token must be generated and a verification email must be sent containing that token.

**Validates: Requirements 4.1, 20.1, 20.2**

### Property 11: Initial Email Verification Status

*For any* newly created user account, the emailVerified field must be set to false.

**Validates: Requirements 4.2**

### Property 12: Email Verification Requirement for Property Creation

*For any* property creation attempt by a user with emailVerified=false, the request must be rejected with a verification required error.

**Validates: Requirements 4.3, 4.4, 15.3**

### Property 13: Verification Token Expiration

*For any* verification token older than 24 hours, verification attempts using that token must be rejected as expired.

**Validates: Requirements 4.5**

### Property 14: Property Creation Rate Limiting

*For any* non-admin user, after creating 5 properties within 24 hours, the 6th property creation attempt must be rejected with a rate limit error.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 15: Rate Limit Reset After 24 Hours

*For any* user who has reached the property creation limit, after 24 hours from their first property creation in the window, they must be able to create new properties again.

**Validates: Requirements 5.4**

### Property 16: Admin Exemption from Rate Limiting

*For any* user with admin role, property creation attempts must not be subject to rate limiting regardless of count.

**Validates: Requirements 5.5**

### Property 17: Property Status Values

*For any* property creation or update request, the pro_status field must be one of: "For Sale", "For Rent", "Under Construction", "Closed", "Finished", "Waiting for Admin Approval", or "Rejected", otherwise the request must be rejected.

**Validates: Requirements 6.1**

### Property 18: Initial Property Status

*For any* newly created property, the pro_status must be set to "Waiting for Admin Approval".

**Validates: Requirements 6.2, 7.1**

### Property 19: Broker Field Presence

*For any* property document, the added_by_broker boolean field must be present.

**Validates: Requirements 6.3**

### Property 20: Seller Authorization for Status Updates

*For any* property status update request, if the requesting user is not the property owner and not an admin, the request must be rejected.

**Validates: Requirements 6.5, 15.4**

### Property 21: Pending Properties Hidden from Public Search

*For any* public property search query, the results must not include properties with pro_status="Waiting for Admin Approval" unless the requester is the property owner.

**Validates: Requirements 7.2, 15.2**

### Property 22: Admin Approval Status Transition

*For any* admin approval action on a property, the pro_status must change from "Waiting for Admin Approval" to the seller's intended status, and approvedBy and approvedAt fields must be set.

**Validates: Requirements 7.3**

### Property 23: Admin Rejection Status Transition

*For any* admin rejection action on a property, the pro_status must change to "Rejected", and rejectedBy, rejectedAt, and rejectionReason fields must be set.

**Validates: Requirements 7.4**

### Property 24: Pending Approval Count Accuracy

*For any* query for pending approval count, the returned count must equal the number of properties with pro_status="Waiting for Admin Approval".

**Validates: Requirements 7.5**

### Property 25: Brochure Content Completeness

*For any* generated property brochure PDF, the document must contain property images, title, description, price, location (country, state, city, address), and seller contact information.

**Validates: Requirements 8.1, 17.1, 17.2, 17.4**

### Property 26: Brochure Branding

*For any* generated brochure PDF, the document must include "Estate Bridge" branding text in the header or footer.

**Validates: Requirements 8.2**

### Property 27: Brochure Download URL Expiration

*For any* generated brochure, the download URL must expire and become inaccessible after 1 hour.

**Validates: Requirements 8.4**

### Property 28: Brochure Storage Path Format

*For any* generated brochure file, the storage path must match the pattern brochures/{property_id}/{timestamp}.pdf.

**Validates: Requirements 8.5**

### Property 29: Buyer Interest Required Fields

*For any* buyer interest submission, the appointment record must contain reason_to_buy, is_property_dealer, buyer_name, and buyer_phone fields.

**Validates: Requirements 9.1**

### Property 30: Buyer Interest Optional Fields

*For any* buyer interest submission, the appointment record may optionally contain purchase_timeline, home_loan_interest, and site_visit_interest fields, and submission must succeed with or without them.

**Validates: Requirements 9.2**

### Property 31: Terms Acceptance Requirement

*For any* buyer interest submission without terms_accepted=true and privacy_policy_accepted=true, the request must be rejected.

**Validates: Requirements 9.3**

### Property 32: Seller Contact Revelation

*For any* successful buyer interest submission, the API response must include seller contact information (name, email, phone).

**Validates: Requirements 9.5**

### Property 33: Appointment Request Rate Limiting

*For any* buyer and property combination, after creating 3 appointment requests, the 4th request must be rejected with a rate limit error.

**Validates: Requirements 10.1, 10.2, 10.3**

### Property 34: Cancelled Appointments Exclusion from Limit

*For any* buyer and property combination, appointment requests with status "cancelled" or "declined" must not count toward the rate limit.

**Validates: Requirements 10.4**

### Property 35: Appointment Limit Reset on Property Closure

*For any* property that changes status to "Closed" or "Finished", the appointment request count for all buyers must reset, allowing new requests.

**Validates: Requirements 10.5**

### Property 36: Duplicate Content Detection

*For any* property creation, if the description has 90% or greater similarity to an existing property description, the property must be flagged as suspicious.

**Validates: Requirements 11.1, 11.2**

### Property 37: Duplicate Image Detection

*For any* property creation, if any uploaded images match images from other properties (by hash comparison), the property must be flagged as suspicious.

**Validates: Requirements 11.3**

### Property 38: Suspicious Property Flagging

*For any* property flagged as suspicious, the flagged field must be set to true, flaggedReason must be populated, and an admin notification must be triggered.

**Validates: Requirements 11.4**

### Property 39: Admin Flag Clearing

*For any* admin action to clear a property flag, the flagged field must be set to false and flaggedReason must be cleared.

**Validates: Requirements 11.5**

### Property 40: Report Reason Values

*For any* property report submission, the reason must be one of: "Spam", "Inappropriate Content", "Fake Images", "Duplicate Listing", or "Other".

**Validates: Requirements 12.2**

### Property 41: Report Record Structure

*For any* created property report, the document must contain reporter_id, property_id, reason, and timestamp fields.

**Validates: Requirements 12.3**

### Property 42: Report Threshold Auto-Flagging

*For any* property that receives its 3rd report, the property must be automatically flagged for admin review.

**Validates: Requirements 12.4**

### Property 43: Duplicate Report Prevention

*For any* user attempting to report the same property twice, the second report must be rejected.

**Validates: Requirements 12.5**

### Property 44: Image Compression Width Limit

*For any* uploaded property image, the compressed full-size version must have a maximum width of 1920px while maintaining the original aspect ratio.

**Validates: Requirements 13.1**

### Property 45: Thumbnail Generation

*For any* uploaded property image, a thumbnail version must be generated at 400px width.

**Validates: Requirements 13.3**

### Property 46: Image Size Validation

*For any* image upload attempt with file size exceeding 10MB, the upload must be rejected before compression.

**Validates: Requirements 13.4**

### Property 47: Image Storage Naming Convention

*For any* uploaded and compressed image, the storage paths must follow the pattern {property_id}/{image_id}_full.jpg for full-size and {property_id}/{image_id}_thumb.jpg for thumbnail.

**Validates: Requirements 13.5**

### Property 48: User Profile Read Authorization

*For any* user attempting to read a user profile document, access must be granted only if the document belongs to the requesting user.

**Validates: Requirements 15.1**

### Property 49: Admin-Only Status Approval

*For any* non-admin user attempting to set pro_status to "Approved", the request must be rejected.

**Validates: Requirements 15.5**

### Property 50: Property Creation Notification Trigger

*For any* property created with status "Waiting for Admin Approval", a Cloud Function must be triggered to send admin notifications.

**Validates: Requirements 16.1**

### Property 51: Admin Notification Content

*For any* admin notification email for property approval, the email must include property_id, seller_name, property_type, and submission_timestamp.

**Validates: Requirements 16.2, 16.3**

### Property 52: Notification Batching

*For any* set of properties submitted within 5 minutes, admin notifications must be batched into a single email rather than sending individual emails.

**Validates: Requirements 16.4**

### Property 53: Notification Retry Logic

*For any* failed admin notification delivery, the system must retry up to 3 times with exponential backoff before giving up.

**Validates: Requirements 16.5**

### Property 54: Brochure QR Code Inclusion

*For any* generated brochure PDF, the document must include a QR code that encodes the URL to the property detail page.

**Validates: Requirements 17.5**

### Property 55: reCAPTCHA v2 Fallback

*For any* registration attempt where reCAPTCHA v3 returns a score below 0.5, the system must present a reCAPTCHA v2 checkbox challenge.

**Validates: Requirements 19.2**

### Property 56: CAPTCHA Token Expiration

*For any* CAPTCHA token older than 2 minutes, validation attempts must reject the token as expired.

**Validates: Requirements 19.5**

### Property 57: Verification Email Subject

*For any* email verification email sent, the subject line must be "Verify Your Estate Bridge Account".

**Validates: Requirements 20.1**

### Property 58: Verification Link Format

*For any* email verification email sent, the email body must contain a link matching the format {platform_url}/verify-email?token={token}.

**Validates: Requirements 20.2**

### Property 59: Email Verification Success

*For any* valid, non-expired verification token, when verified, the user's emailVerified field must be set to true.

**Validates: Requirements 20.3**

### Property 60: Expired Token Error Handling

*For any* verification attempt with an expired or invalid token, the system must return an error and offer to resend the verification email.

**Validates: Requirements 20.4**


## Error Handling

### Error Categories

#### Validation Errors (400 Bad Request)

```typescript
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    fields: {
      buy_country: ['Invalid ISO country code'],
      buy_pincode: ['Pincode format invalid for selected country']
    }
  },
  timestamp: '2024-01-15T10:30:00Z'
}
```

**Scenarios:**
- Invalid location data format
- Missing required fields
- Invalid property status values
- Invalid report reasons
- Invalid currency values

#### Authentication Errors (401 Unauthorized)

```typescript
{
  success: false,
  error: {
    code: 'EMAIL_NOT_VERIFIED',
    message: 'Email verification required to create properties'
  },
  timestamp: '2024-01-15T10:30:00Z'
}
```

**Scenarios:**
- Email not verified
- Invalid or expired verification token
- Invalid or expired CAPTCHA token
- Missing authentication token

#### Authorization Errors (403 Forbidden)

```typescript
{
  success: false,
  error: {
    code: 'INSUFFICIENT_PERMISSIONS',
    message: 'Only administrators can approve properties'
  },
  timestamp: '2024-01-15T10:30:00Z'
}
```

**Scenarios:**
- Non-admin attempting to approve/reject properties
- User attempting to update another user's property
- User attempting to clear property flags

#### Rate Limiting Errors (429 Too Many Requests)

```typescript
{
  success: false,
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Property creation limit exceeded',
    details: {
      limit: 5,
      window: '24 hours',
      resetAt: '2024-01-16T10:30:00Z'
    }
  },
  timestamp: '2024-01-15T10:30:00Z'
}
```

**Scenarios:**
- Property creation limit exceeded (5 per day)
- Appointment request limit exceeded (3 per property)
- Registration attempt limit exceeded (5 per IP per hour)

#### Resource Not Found Errors (404 Not Found)

```typescript
{
  success: false,
  error: {
    code: 'PROPERTY_NOT_FOUND',
    message: 'Property not found or not accessible'
  },
  timestamp: '2024-01-15T10:30:00Z'
}
```

**Scenarios:**
- Property ID does not exist
- Property is pending approval and user is not owner
- Verification token not found

#### Conflict Errors (409 Conflict)

```typescript
{
  success: false,
  error: {
    code: 'DUPLICATE_REPORT',
    message: 'You have already reported this property'
  },
  timestamp: '2024-01-15T10:30:00Z'
}
```

**Scenarios:**
- Duplicate property report from same user
- Duplicate content detected (90%+ similarity)
- Duplicate images detected

#### Service Errors (500 Internal Server Error)

```typescript
{
  success: false,
  error: {
    code: 'PDF_GENERATION_FAILED',
    message: 'Failed to generate property brochure'
  },
  timestamp: '2024-01-15T10:30:00Z'
}
```

**Scenarios:**
- PDF generation failure
- Image compression failure
- Email sending failure
- Database operation failure
- Storage operation failure

### Error Recovery Strategies

#### Retry with Exponential Backoff

Used for transient failures in external services:
- Email sending (3 retries)
- Admin notifications (3 retries)
- Image compression (2 retries)

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
  throw new Error('Max retries exceeded');
}
```

#### Graceful Degradation

- If brochure generation fails, return error but don't block property viewing
- If thumbnail generation fails, use full-size image as fallback
- If spam detection fails, allow property creation but log error for review

#### Circuit Breaker

For external service calls (CAPTCHA, email):
- Open circuit after 5 consecutive failures
- Half-open after 60 seconds
- Close circuit after 2 successful calls

#### Compensation Actions

- If property creation fails after image upload, delete uploaded images
- If email verification fails to send, store token for manual resend
- If admin notification fails, add to retry queue


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property-based tests**: Verify universal properties across randomized inputs

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property-based tests verify general correctness across a wide input space.

### Property-Based Testing

#### Framework Selection

**Backend (Node.js/TypeScript)**: fast-check
- Mature property-based testing library for JavaScript/TypeScript
- Excellent TypeScript support with type inference
- Rich set of built-in arbitraries (generators)
- Shrinking support for minimal failing examples

```bash
npm install --save-dev fast-check
```

**Frontend (React/TypeScript)**: fast-check
- Same library for consistency across frontend and backend
- Can test utility functions and business logic

#### Configuration

Each property-based test must:
- Run minimum 100 iterations (due to randomization)
- Include a comment tag referencing the design property
- Use descriptive test names matching the property

```typescript
// Tag format example:
// Feature: platform-enhancements, Property 5: Currency Assignment Based on Country
it('should assign USD for US and INR for all other countries', () => {
  fc.assert(
    fc.property(
      fc.record({
        country: fc.oneof(fc.constant('US'), fc.string()),
        // ... other fields
      }),
      (registrationData) => {
        const currency = determineCurrency(registrationData.country);
        if (registrationData.country === 'US') {
          expect(currency).toBe('USD');
        } else {
          expect(currency).toBe('INR');
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

#### Property Test Examples

**Property 5: Currency Assignment**
```typescript
// Feature: platform-enhancements, Property 5: Currency Assignment Based on Country
describe('Currency Service - Property 5', () => {
  it('assigns USD for US and INR for all other countries', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 2 }), // Country code
        (countryCode) => {
          const currency = currencyService.determineCurrency(countryCode);
          if (countryCode === 'US') {
            expect(currency).toBe('USD');
          } else {
            expect(currency).toBe('INR');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 6: USD Price Formatting**
```typescript
// Feature: platform-enhancements, Property 6: USD Price Formatting
describe('Currency Service - Property 6', () => {
  it('formats USD prices with $ symbol, commas, and 2 decimals', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10000000, noNaN: true }), // Price
        (price) => {
          const formatted = currencyService.formatPrice(price, 'USD');
          
          // Must start with $
          expect(formatted).toMatch(/^\$/);
          
          // Must have 2 decimal places
          expect(formatted).toMatch(/\.\d{2}$/);
          
          // Must include USD code
          expect(formatted).toContain('USD');
          
          // Must have comma separators for thousands
          if (price >= 1000) {
            expect(formatted).toContain(',');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 14: Property Creation Rate Limiting**
```typescript
// Feature: platform-enhancements, Property 14: Property Creation Rate Limiting
describe('Rate Limiting Service - Property 14', () => {
  it('rejects 6th property creation within 24 hours for non-admin users', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.uuid(), // userId
        fc.array(fc.record({ title: fc.string(), description: fc.string() }), { 
          minLength: 6, 
          maxLength: 6 
        }), // 6 properties
        async (userId, properties) => {
          // Create user as non-admin
          await createTestUser(userId, { role: 'seller', isAdmin: false });
          
          // First 5 should succeed
          for (let i = 0; i < 5; i++) {
            const result = await propertyService.create(userId, properties[i]);
            expect(result.success).toBe(true);
          }
          
          // 6th should fail with rate limit error
          await expect(
            propertyService.create(userId, properties[5])
          ).rejects.toMatchObject({
            code: 'RATE_LIMIT_EXCEEDED'
          });
          
          // Cleanup
          await cleanupTestUser(userId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 36: Duplicate Content Detection**
```typescript
// Feature: platform-enhancements, Property 36: Duplicate Content Detection
describe('Spam Detection Service - Property 36', () => {
  it('flags properties with 90%+ description similarity', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 100, maxLength: 500 }), // Base description
        fc.integer({ min: 0, max: 10 }), // Characters to change
        async (baseDescription, charsToChange) => {
          // Create original property
          const original = await createTestProperty({ description: baseDescription });
          
          // Create similar description (90%+ similar)
          const similarDescription = mutateString(baseDescription, charsToChange);
          const similarity = calculateSimilarity(baseDescription, similarDescription);
          
          // Create new property with similar description
          const result = await spamDetectionService.checkDuplicateContent(similarDescription);
          
          if (similarity >= 0.9) {
            expect(result.isDuplicate).toBe(true);
            expect(result.similarPropertyId).toBe(original.id);
          }
          
          // Cleanup
          await cleanupTestProperty(original.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

#### Test Organization

```
backend/src/__tests__/
├── services/
│   ├── verificationService.test.ts
│   ├── rateLimitingService.test.ts
│   ├── currencyService.test.ts
│   ├── propertyStatusService.test.ts
│   ├── brochureGeneratorService.test.ts
│   ├── imageCompressionService.test.ts
│   ├── spamDetectionService.test.ts
│   └── adminNotificationService.test.ts
├── middleware/
│   ├── captchaValidator.test.ts
│   ├── emailVerificationCheck.test.ts
│   └── rateLimiter.test.ts
├── repositories/
│   ├── verificationTokenRepository.test.ts
│   ├── reportRepository.test.ts
│   └── rateLimitRepository.test.ts
└── integration/
    ├── registration.integration.test.ts
    ├── propertyCreation.integration.test.ts
    ├── adminApproval.integration.test.ts
    └── brochureGeneration.integration.test.ts
```

#### Unit Test Examples

**Verification Service - Email Sending**
```typescript
describe('VerificationService', () => {
  describe('sendVerificationEmail', () => {
    it('should send email with correct subject and token link', async () => {
      const email = 'test@example.com';
      const token = 'test-token-123';
      
      await verificationService.sendVerificationEmail(email, token);
      
      expect(mockEmailService.send).toHaveBeenCalledWith({
        to: email,
        subject: 'Verify Your Estate Bridge Account',
        html: expect.stringContaining(`/verify-email?token=${token}`)
      });
    });
    
    it('should retry up to 3 times on failure', async () => {
      mockEmailService.send
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true });
      
      await verificationService.sendVerificationEmail('test@example.com', 'token');
      
      expect(mockEmailService.send).toHaveBeenCalledTimes(3);
    });
  });
});
```

**Rate Limiting Service - Property Creation**
```typescript
describe('RateLimitingService', () => {
  describe('checkPropertyCreationLimit', () => {
    it('should allow first 5 properties', async () => {
      const userId = 'user-123';
      
      for (let i = 0; i < 5; i++) {
        const result = await rateLimitingService.checkPropertyCreationLimit(userId);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
        await rateLimitingService.incrementPropertyCreationCount(userId);
      }
    });
    
    it('should reject 6th property', async () => {
      const userId = 'user-456';
      
      // Create 5 properties
      for (let i = 0; i < 5; i++) {
        await rateLimitingService.incrementPropertyCreationCount(userId);
      }
      
      const result = await rateLimitingService.checkPropertyCreationLimit(userId);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
    
    it('should reset after 24 hours', async () => {
      const userId = 'user-789';
      
      // Create 5 properties
      for (let i = 0; i < 5; i++) {
        await rateLimitingService.incrementPropertyCreationCount(userId);
      }
      
      // Fast-forward 24 hours
      jest.advanceTimersByTime(24 * 60 * 60 * 1000);
      
      const result = await rateLimitingService.checkPropertyCreationLimit(userId);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });
  });
});
```

**Image Compression Service**
```typescript
describe('ImageCompressionService', () => {
  describe('compressAndUpload', () => {
    it('should reject images larger than 10MB', async () => {
      const largeImage = Buffer.alloc(11 * 1024 * 1024); // 11MB
      
      await expect(
        imageCompressionService.compressAndUpload(largeImage, 'prop-123', 'img-1')
      ).rejects.toThrow('Image size exceeds 10MB limit');
    });
    
    it('should compress image to max 1920px width', async () => {
      const image = await loadTestImage('large-image.jpg'); // 4000x3000
      
      const result = await imageCompressionService.compressAndUpload(
        image,
        'prop-123',
        'img-1'
      );
      
      const metadata = await getImageMetadata(result.fullUrl);
      expect(metadata.width).toBeLessThanOrEqual(1920);
    });
    
    it('should generate thumbnail at 400px width', async () => {
      const image = await loadTestImage('test-image.jpg');
      
      const result = await imageCompressionService.compressAndUpload(
        image,
        'prop-123',
        'img-1'
      );
      
      const metadata = await getImageMetadata(result.thumbnailUrl);
      expect(metadata.width).toBe(400);
    });
    
    it('should follow naming convention', async () => {
      const image = await loadTestImage('test-image.jpg');
      
      const result = await imageCompressionService.compressAndUpload(
        image,
        'prop-123',
        'img-1'
      );
      
      expect(result.fullUrl).toContain('prop-123/img-1_full.jpg');
      expect(result.thumbnailUrl).toContain('prop-123/img-1_thumb.jpg');
    });
  });
});
```

### Integration Testing

Integration tests verify end-to-end flows across multiple components:

**Registration Flow**
```typescript
describe('Registration Integration', () => {
  it('should complete full registration with email verification', async () => {
    const registrationData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      fullName: 'Test User',
      role: 'buyer',
      buy_country: 'US',
      buy_city: 'New York',
      buy_state: 'NY',
      buy_address: '123 Main St',
      buy_pincode: '10001',
      captchaToken: 'valid-token'
    };
    
    // Register user
    const response = await request(app)
      .post('/api/auth/register')
      .send(registrationData)
      .expect(201);
    
    expect(response.body.data.user.emailVerified).toBe(false);
    expect(response.body.data.user.currency).toBe('USD');
    
    // Verify email was sent
    expect(mockEmailService.send).toHaveBeenCalled();
    const emailCall = mockEmailService.send.mock.calls[0][0];
    expect(emailCall.subject).toBe('Verify Your Estate Bridge Account');
    
    // Extract token from email
    const tokenMatch = emailCall.html.match(/token=([^&"]+)/);
    const token = tokenMatch[1];
    
    // Verify email
    await request(app)
      .get(`/api/auth/verify-email?token=${token}`)
      .expect(200);
    
    // Check user is now verified
    const user = await getUserById(response.body.data.user.id);
    expect(user.emailVerified).toBe(true);
  });
});
```

**Property Creation with Admin Approval**
```typescript
describe('Property Creation Integration', () => {
  it('should create property, trigger admin notification, and allow approval', async () => {
    // Create verified seller
    const seller = await createTestUser({ role: 'seller', emailVerified: true });
    const sellerToken = generateToken(seller.id);
    
    // Create property
    const propertyData = {
      title: 'Beautiful House',
      description: 'A lovely property in great location',
      price: 500000,
      currency: 'USD',
      region: 'New York',
      address: '456 Oak Ave',
      propertyType: 'house',
      pro_status: 'For Sale',
      added_by_broker: false,
      imageUrls: []
    };
    
    const createResponse = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(propertyData)
      .expect(201);
    
    const propertyId = createResponse.body.data.property.id;
    
    // Verify initial status
    expect(createResponse.body.data.property.pro_status).toBe('Waiting for Admin Approval');
    
    // Verify admin notification was triggered
    expect(mockAdminNotificationService.notifyPropertyPendingApproval).toHaveBeenCalled();
    
    // Verify property is hidden from public search
    const searchResponse = await request(app)
      .get('/api/properties')
      .expect(200);
    
    const foundProperty = searchResponse.body.data.data.find(p => p.id === propertyId);
    expect(foundProperty).toBeUndefined();
    
    // Admin approves property
    const admin = await createTestUser({ role: 'admin' });
    const adminToken = generateToken(admin.id);
    
    await request(app)
      .post(`/api/admin/properties/${propertyId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approvedStatus: 'For Sale' })
      .expect(200);
    
    // Verify property is now visible in search
    const searchResponse2 = await request(app)
      .get('/api/properties')
      .expect(200);
    
    const approvedProperty = searchResponse2.body.data.data.find(p => p.id === propertyId);
    expect(approvedProperty).toBeDefined();
    expect(approvedProperty.pro_status).toBe('For Sale');
  });
});
```

### Test Coverage Goals

- **Unit Test Coverage**: Minimum 80% line coverage
- **Property Test Coverage**: All 60 correctness properties must have corresponding tests
- **Integration Test Coverage**: All critical user flows must be tested end-to-end
- **Edge Case Coverage**: All error conditions and boundary cases must be tested

### Continuous Integration

All tests must pass before merging:
```yaml
# .github/workflows/test.yml
- name: Run unit tests
  run: npm test -- --coverage
  
- name: Run property-based tests
  run: npm test -- --testPathPattern=property
  
- name: Run integration tests
  run: npm test -- --testPathPattern=integration
  
- name: Check coverage thresholds
  run: npm run test:coverage-check
```


## Security Considerations

### Authentication & Authorization

1. **Email Verification Enforcement**: Property creation requires verified email to prevent spam accounts
2. **Role-Based Access Control**: Admin-only endpoints for property approval, flag clearing, and report review
3. **Owner-Based Authorization**: Users can only modify their own properties and profiles
4. **Token Security**: Verification tokens are single-use, time-limited (24 hours), and cryptographically secure

### Input Validation

1. **Location Data**: Country codes validated against ISO standard, pincode format validated per country
2. **CAPTCHA Validation**: All registration attempts validated server-side against Google reCAPTCHA
3. **File Upload Validation**: Images validated for type, size (10MB max), and format before processing
4. **SQL Injection Prevention**: Firestore queries use parameterized queries (built-in protection)
5. **XSS Prevention**: All user input sanitized before storage and display

### Rate Limiting

1. **Registration**: 5 attempts per IP per hour to prevent bot attacks
2. **Property Creation**: 5 properties per user per 24 hours to prevent spam
3. **Appointment Requests**: 3 requests per buyer per property to prevent harassment
4. **API Endpoints**: General rate limiting of 100 requests per minute per user

### Data Privacy

1. **PII Protection**: Email, phone, and address data encrypted at rest in Firestore
2. **Contact Information**: Seller contact only revealed after buyer completes qualification form
3. **Report Anonymity**: Reporter identity hidden from property owners
4. **Admin Access Logging**: All admin actions (approve, reject, flag clearing) logged with timestamp and admin ID

### Firebase Security Rules

Enhanced security rules for new collections:

```javascript
// Verification tokens collection
match /verification_tokens/{tokenId} {
  allow read: if false; // Backend only
  allow write: if false; // Backend only
}

// Property reports collection
match /property_reports/{reportId} {
  allow read: if hasRole('admin');
  allow create: if isAuthenticated() && 
                   request.resource.data.reporterId == request.auth.uid;
  allow update, delete: if hasRole('admin');
}

// Rate limit tracking collection
match /rate_limits/{limitId} {
  allow read: if false; // Backend only
  allow write: if false; // Backend only
}

// Brochures collection
match /brochures/{brochureId} {
  allow read: if isAuthenticated();
  allow write: if false; // Backend only
}
```

### Spam Prevention

1. **Duplicate Content Detection**: 90% similarity threshold triggers automatic flagging
2. **Image Hash Comparison**: Perceptual hashing detects duplicate images across listings
3. **Report Threshold**: 3 reports automatically flag property for admin review
4. **Pattern Detection**: Multiple properties with identical descriptions from same user flagged
5. **Admin Review Queue**: All flagged properties require manual admin review before unflagging


## Implementation Notes

### Phase 1: Foundation (Week 1-2)

**Priority: Critical**

1. Enhanced user registration with location data
   - Update User model with location fields
   - Add location validation (country codes, pincode formats)
   - Implement currency determination logic
   - Update registration API endpoint
   - Update registration form UI

2. Email verification system
   - Create verification token model and repository
   - Implement email sending service
   - Add verification endpoints (verify, resend)
   - Create email templates
   - Add verification check middleware

3. CAPTCHA integration
   - Set up Google reCAPTCHA v3 + v2
   - Implement backend validation
   - Add CAPTCHA widget to registration form
   - Implement fallback logic (v3 → v2)

### Phase 2: Property Management (Week 3-4)

**Priority: Critical**

1. Property status management
   - Update Property model with new status values
   - Implement status transition logic
   - Add admin approval/rejection endpoints
   - Create admin approval queue UI
   - Update property forms with new statuses

2. Rate limiting system
   - Create rate limit tracking model
   - Implement rate limiting service
   - Add rate limiting middleware
   - Apply to property creation and appointments
   - Add IP-based rate limiting for registration

3. Spam detection
   - Implement duplicate content detection (text similarity)
   - Implement duplicate image detection (perceptual hashing)
   - Add property flagging logic
   - Create admin flagged properties panel
   - Implement report threshold auto-flagging

### Phase 3: Enhanced Features (Week 5-6)

**Priority: High**

1. Buyer interest qualification
   - Update Appointment model with qualification fields
   - Implement qualification form validation
   - Update appointment creation endpoint
   - Create enhanced interest form UI
   - Implement contact revelation logic

2. Property reporting system
   - Create report model and repository
   - Implement report submission endpoint
   - Add report management for admins
   - Create report button UI
   - Implement duplicate report prevention

3. Image compression
   - Integrate Sharp library
   - Implement compression service
   - Add thumbnail generation
   - Update image upload flow
   - Implement storage naming convention

### Phase 4: Brochure & Notifications (Week 7-8)

**Priority: Medium**

1. PDF brochure generation
   - Integrate PDFKit library
   - Implement brochure generator service
   - Design brochure template
   - Add QR code generation
   - Implement download endpoint
   - Create download button UI

2. Admin notification system
   - Set up Firebase Cloud Functions
   - Implement property creation trigger
   - Create email notification templates
   - Implement batching logic
   - Add retry mechanism

3. Currency formatting
   - Implement USD formatting ($ with commas)
   - Implement INR formatting (₹ with Indian numbering)
   - Apply formatting across all price displays
   - Update property cards, detail pages, brochures

### Phase 5: Infrastructure & Optimization (Week 9-10)

**Priority: Medium**

1. Firebase optimization
   - Add composite indexes for queries
   - Update security rules for new collections
   - Implement scheduled token cleanup function
   - Optimize image storage structure
   - Add monitoring and logging

2. Testing implementation
   - Write unit tests for all services
   - Implement property-based tests (fast-check)
   - Create integration tests for critical flows
   - Set up CI/CD pipeline
   - Achieve 80%+ code coverage

### Dependencies

**External Services:**
- Google reCAPTCHA (v3 + v2)
- SMTP email service (SendGrid, AWS SES, or similar)
- Firebase Cloud Functions
- Firebase Storage

**NPM Packages:**
- `sharp`: Image compression and resizing
- `pdfkit`: PDF generation
- `qrcode`: QR code generation
- `fast-check`: Property-based testing
- `string-similarity`: Text similarity comparison
- `image-hash`: Perceptual image hashing
- `nodemailer`: Email sending
- `zod`: Schema validation

### Database Migrations

**New Collections:**
1. `verification_tokens`: Email verification tokens
2. `property_reports`: User-submitted property reports
3. `rate_limits`: Rate limiting tracking
4. `brochures`: Generated PDF brochures metadata

**Updated Collections:**
1. `users`: Add location fields, emailVerified, currency
2. `properties`: Add pro_status, added_by_broker, flagged fields, currency
3. `appointments`: Add qualification fields

**Firestore Indexes to Add:**
```json
{
  "indexes": [
    {
      "collectionGroup": "properties",
      "fields": [
        { "fieldPath": "buy_country", "order": "ASCENDING" },
        { "fieldPath": "buy_city", "order": "ASCENDING" },
        { "fieldPath": "pro_status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "properties",
      "fields": [
        { "fieldPath": "pro_status", "order": "ASCENDING" },
        { "fieldPath": "propertyType", "order": "ASCENDING" },
        { "fieldPath": "price", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "properties",
      "fields": [
        { "fieldPath": "flagged", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "property_reports",
      "fields": [
        { "fieldPath": "propertyId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Configuration Requirements

**Environment Variables:**
```bash
# reCAPTCHA
RECAPTCHA_V3_SITE_KEY=your_v3_site_key
RECAPTCHA_V3_SECRET_KEY=your_v3_secret_key
RECAPTCHA_V2_SITE_KEY=your_v2_site_key
RECAPTCHA_V2_SECRET_KEY=your_v2_secret_key

# Email Service
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_EMAIL=noreply@estatebridge.com
SMTP_FROM_NAME=Estate Bridge

# Platform URLs
PLATFORM_URL=https://estatebridge.com
ADMIN_EMAIL=admin@estatebridge.com

# Rate Limiting
PROPERTY_CREATION_LIMIT=5
PROPERTY_CREATION_WINDOW_HOURS=24
APPOINTMENT_REQUEST_LIMIT=3
REGISTRATION_ATTEMPT_LIMIT=5
REGISTRATION_WINDOW_HOURS=1

# Image Processing
MAX_IMAGE_SIZE_MB=10
FULL_IMAGE_MAX_WIDTH=1920
THUMBNAIL_WIDTH=400
IMAGE_QUALITY=85

# Spam Detection
DUPLICATE_CONTENT_THRESHOLD=0.9
REPORT_AUTO_FLAG_THRESHOLD=3

# Brochure
BROCHURE_URL_EXPIRY_HOURS=1
```

### Monitoring & Observability

**Metrics to Track:**
1. Registration success/failure rate
2. Email verification completion rate
3. CAPTCHA challenge rate (v3 → v2 fallback)
4. Property creation rate and rate limit hits
5. Admin approval queue size and processing time
6. Spam detection accuracy (false positives/negatives)
7. Brochure generation success rate
8. Image compression processing time
9. Email delivery success rate
10. API response times for new endpoints

**Logging Requirements:**
- All rate limit violations
- All CAPTCHA failures
- All spam detection flags
- All admin actions (approve, reject, clear flag)
- All email sending attempts and results
- All brochure generation requests
- All image compression operations

### Rollback Plan

If critical issues arise:

1. **Phase 1 Rollback**: Revert to old registration flow, disable email verification requirement
2. **Phase 2 Rollback**: Disable rate limiting, revert property status to old values
3. **Phase 3 Rollback**: Disable spam detection, use old appointment form
4. **Phase 4 Rollback**: Disable brochure generation, disable admin notifications

Each phase should be deployed independently with feature flags to enable quick rollback without full deployment.

