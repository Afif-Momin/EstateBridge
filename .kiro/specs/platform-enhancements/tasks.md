# Implementation Plan: Platform Enhancements

## Overview

This implementation plan breaks down the platform enhancements feature into discrete coding tasks organized by the 5-phase approach from the design document. Each task builds incrementally on previous work, with property-based tests integrated throughout to validate correctness properties. The plan focuses exclusively on tasks that involve writing, modifying, or testing code.

## Tasks

- [x] 1. Phase 1 - Foundation: Enhanced Registration with Location Data
  - [x] 1.1 Update User model and types with location fields
    - Add buy_country, buy_city, buy_state, buy_address, buy_pincode fields to User interface
    - Add emailVerified, emailVerificationToken, emailVerificationTokenExpiry fields
    - Add currency field ('USD' | 'INR')
    - Update both backend/src/types/index.ts and frontend/src/types/index.ts
    - _Requirements: 1.1, 1.2, 2.3, 4.2_

  - [x] 1.2 Create location validation utilities
    - Implement country code validation (ISO standard)
    - Implement pincode format validation per country (US: 5 digits, IN: 6 digits)
    - Create validation error messages with specific field details
    - Add to backend/src/utils/validation.ts
    - _Requirements: 1.3, 1.4, 1.5_

  - [ ]* 1.3 Write property tests for location validation
    - **Property 2: Country Code Validation**
    - **Validates: Requirements 1.3**
    - **Property 3: Pincode Format Validation**
    - **Validates: Requirements 1.4**

  - [x] 1.4 Implement Currency Service
    - Create backend/src/services/currencyService.ts
    - Implement determineCurrency(countryCode) - USD for "US", INR for others
    - Implement formatPrice(amount, currency) with proper formatting
    - Implement validateCountryCode() and validatePincode()
    - _Requirements: 2.1, 2.2, 2.4, 18.1, 18.2, 18.3, 18.4_


  - [ ]* 1.5 Write property tests for currency service
    - **Property 5: Currency Assignment Based on Country**
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - **Property 6: USD Price Formatting**
    - **Validates: Requirements 2.4, 18.1, 18.3, 18.4**
    - **Property 7: INR Price Formatting**
    - **Validates: Requirements 2.4, 18.2, 18.3, 18.4**

  - [x] 1.6 Update registration API endpoint
    - Update backend/src/controllers/authController.ts register method
    - Add location fields to request validation
    - Call currencyService.determineCurrency() to set user currency
    - Update backend/src/validators/authValidator.ts with location schema
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

  - [ ]* 1.7 Write unit tests for registration with location data
    - Test successful registration with valid location data
    - Test validation errors for missing/invalid location fields
    - Test currency assignment for US and non-US countries
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2_

- [x] 2. Phase 1 - Foundation: Email Verification System
  - [x] 2.1 Create Verification Token model and repository
    - Create VerificationToken interface in backend/src/types/index.ts
    - Create backend/src/repositories/verificationTokenRepository.ts
    - Implement CRUD operations: create, findByToken, markAsUsed, deleteExpired
    - _Requirements: 4.1, 4.5_

  - [x] 2.2 Implement Verification Service
    - Create backend/src/services/verificationService.ts
    - Implement generateVerificationToken(userId) - crypto.randomBytes(32)
    - Implement sendVerificationEmail(email, token) with retry logic
    - Implement verifyEmailToken(token) with expiration check (24 hours)
    - Implement resendVerificationEmail(email)
    - Implement isEmailVerified(userId)
    - _Requirements: 4.1, 4.2, 4.5, 20.1, 20.2, 20.3, 20.4_

  - [ ]* 2.3 Write property tests for verification service
    - **Property 10: Email Verification Token Generation**
    - **Validates: Requirements 4.1, 20.1, 20.2**
    - **Property 13: Verification Token Expiration**
    - **Validates: Requirements 4.5**
    - **Property 57: Verification Email Subject**
    - **Validates: Requirements 20.1**
    - **Property 58: Verification Link Format**
    - **Validates: Requirements 20.2**

  - [x] 2.4 Create email verification endpoints
    - Add GET /api/auth/verify-email endpoint in backend/src/routes/authRoutes.ts
    - Add POST /api/auth/resend-verification endpoint
    - Add GET /api/auth/verification-status endpoint
    - Implement handlers in backend/src/controllers/authController.ts
    - _Requirements: 20.3, 20.4_

  - [x] 2.5 Create email verification middleware
    - Create backend/src/middleware/emailVerificationCheck.ts
    - Check user.emailVerified before allowing property creation
    - Return 401 error if not verified
    - _Requirements: 4.3, 4.4, 15.3_

  - [ ]* 2.6 Write property test for email verification requirement
    - **Property 12: Email Verification Requirement for Property Creation**
    - **Validates: Requirements 4.3, 4.4, 15.3**

  - [ ]* 2.7 Write unit tests for email verification flow
    - Test token generation and email sending
    - Test successful verification with valid token
    - Test rejection of expired tokens
    - Test resend verification email
    - _Requirements: 4.1, 4.5, 20.1, 20.2, 20.3, 20.4_

- [x] 3. Phase 1 - Foundation: CAPTCHA Integration
  - [x] 3.1 Set up reCAPTCHA configuration
    - Add reCAPTCHA keys to backend/.env
    - Add RECAPTCHA_V3_SITE_KEY, RECAPTCHA_V3_SECRET_KEY
    - Add RECAPTCHA_V2_SITE_KEY, RECAPTCHA_V2_SECRET_KEY
    - Add keys to frontend environment configuration
    - _Requirements: 19.1, 19.2_

  - [x] 3.2 Implement CAPTCHA validation service
    - Add validateCaptcha(token, action) to backend/src/services/verificationService.ts
    - Call Google reCAPTCHA API to verify token
    - Check score threshold (0.5) for v3
    - Handle token expiration (2 minutes)
    - _Requirements: 19.1, 19.2, 19.3, 19.5_

  - [x] 3.3 Create CAPTCHA validation middleware
    - Create backend/src/middleware/captchaValidator.ts
    - Extract captchaToken from request body
    - Call verificationService.validateCaptcha()
    - Return 400 error if validation fails
    - _Requirements: 19.3, 19.4_

  - [ ]* 3.4 Write property tests for CAPTCHA validation
    - **Property 8: CAPTCHA Validation Requirement**
    - **Validates: Requirements 3.2, 3.3, 19.3, 19.4**
    - **Property 55: reCAPTCHA v2 Fallback**
    - **Validates: Requirements 19.2**
    - **Property 56: CAPTCHA Token Expiration**
    - **Validates: Requirements 19.5**

  - [x] 3.4 Add CAPTCHA to registration endpoint
    - Apply captchaValidator middleware to POST /api/auth/register
    - Update registration request validation to require captchaToken
    - _Requirements: 3.2, 3.3_

  - [x] 3.5 Create frontend CAPTCHA widget component
    - Create frontend/src/components/auth/CaptchaWidget.tsx
    - Integrate reCAPTCHA v3 (invisible)
    - Implement v2 fallback for low scores
    - Expose token via callback
    - _Requirements: 19.1, 19.2_

  - [x] 3.6 Update registration form with CAPTCHA
    - Update frontend/src/pages/RegisterPage.tsx
    - Add CaptchaWidget component
    - Include captchaToken in registration request
    - Handle CAPTCHA validation errors
    - _Requirements: 3.1, 19.1, 19.2_

  - [ ]* 3.7 Write unit tests for CAPTCHA integration
    - Test successful CAPTCHA validation
    - Test rejection of invalid tokens
    - Test token expiration handling
    - Test v2 fallback logic
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 4. Phase 1 - Foundation: Registration Rate Limiting
  - [x] 4.1 Create Rate Limit model and repository
    - Create RateLimitEntry interface in backend/src/types/index.ts
    - Create backend/src/repositories/rateLimitRepository.ts
    - Implement methods: findByUserAndType, findByIP, incrementCount, resetCount
    - _Requirements: 3.4, 3.5_

  - [x] 4.2 Implement Rate Limiting Service
    - Create backend/src/services/rateLimitingService.ts
    - Implement checkRegistrationRateLimit(ipAddress) - 5 per hour
    - Implement incrementRegistrationAttempt(ipAddress)
    - Implement checkPropertyCreationLimit(userId) - 5 per 24 hours
    - Implement incrementPropertyCreationCount(userId)
    - Implement checkAppointmentRequestLimit(userId, propertyId) - 3 per property
    - Implement incrementAppointmentRequestCount(userId, propertyId)
    - _Requirements: 3.4, 3.5, 5.1, 5.2, 5.3, 10.1, 10.2_

  - [ ]* 4.3 Write property tests for rate limiting
    - **Property 9: Registration Rate Limiting by IP**
    - **Validates: Requirements 3.4, 3.5**
    - **Property 14: Property Creation Rate Limiting**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - **Property 15: Rate Limit Reset After 24 Hours**
    - **Validates: Requirements 5.4**
    - **Property 16: Admin Exemption from Rate Limiting**
    - **Validates: Requirements 5.5**

  - [x] 4.4 Create rate limiting middleware
    - Create backend/src/middleware/rateLimiter.ts
    - Implement registrationRateLimiter middleware
    - Implement propertyCreationRateLimiter middleware
    - Implement appointmentRequestRateLimiter middleware
    - Return 429 error with resetAt timestamp when limit exceeded
    - _Requirements: 3.4, 3.5, 5.1, 5.2, 10.1, 10.2_

  - [x] 4.5 Apply rate limiting to endpoints
    - Add registrationRateLimiter to POST /api/auth/register
    - Add propertyCreationRateLimiter to POST /api/properties
    - Add appointmentRequestRateLimiter to POST /api/appointments
    - _Requirements: 3.4, 5.1, 10.1_

  - [ ]* 4.6 Write unit tests for rate limiting
    - Test registration rate limit (5 per IP per hour)
    - Test property creation rate limit (5 per user per 24 hours)
    - Test appointment request rate limit (3 per buyer per property)
    - Test rate limit reset after time window
    - Test admin exemption from property rate limit
    - _Requirements: 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5, 10.1, 10.2_

- [x] 5. Checkpoint - Phase 1 Complete
  - Ensure all tests pass, ask the user if questions arise.


- [x] 6. Phase 2 - Property Management: Enhanced Property Status
  - [x] 6.1 Update Property model with new status fields
    - Update Property interface in backend/src/types/index.ts and frontend/src/types/index.ts
    - Add pro_status field with type: 'For Sale' | 'For Rent' | 'Under Construction' | 'Closed' | 'Finished' | 'Waiting for Admin Approval' | 'Rejected'
    - Add added_by_broker boolean field
    - Add currency field ('USD' | 'INR')
    - Add flagged, flaggedReason, flaggedAt fields for spam detection
    - Add reportCount field
    - Add approvedBy, approvedAt, rejectedBy, rejectedAt, rejectionReason fields
    - _Requirements: 6.1, 6.2, 6.3, 7.1_

  - [ ]* 6.2 Write property tests for status management
    - **Property 17: Property Status Values**
    - **Validates: Requirements 6.1**
    - **Property 18: Initial Property Status**
    - **Validates: Requirements 6.2, 7.1**
    - **Property 19: Broker Field Presence**
    - **Validates: Requirements 6.3**

  - [x] 6.3 Update property creation endpoint
    - Update backend/src/controllers/propertyController.ts create method
    - Set initial pro_status to "Waiting for Admin Approval"
    - Apply emailVerificationCheck middleware
    - Apply propertyCreationRateLimiter middleware
    - Store currency from user profile
    - _Requirements: 6.2, 7.1, 4.3, 5.1_

  - [x] 6.4 Implement property status update endpoint
    - Add PATCH /api/properties/:id/status in backend/src/routes/propertyRoutes.ts
    - Implement handler in backend/src/controllers/propertyController.ts
    - Validate user is property owner or admin
    - Validate status transition is allowed
    - _Requirements: 6.5, 15.4_

  - [ ]* 6.5 Write property tests for authorization
    - **Property 20: Seller Authorization for Status Updates**
    - **Validates: Requirements 6.5, 15.4**
    - **Property 48: User Profile Read Authorization**
    - **Validates: Requirements 15.1**

  - [ ]* 6.6 Write unit tests for property status management
    - Test initial status set to "Waiting for Admin Approval"
    - Test seller can update own property status
    - Test non-owner cannot update property status
    - Test status validation
    - _Requirements: 6.1, 6.2, 6.5_

- [x] 7. Phase 2 - Property Management: Admin Approval Workflow
  - [x] 7.1 Create admin approval endpoints
    - Add POST /api/admin/properties/:id/approve in backend/src/routes/propertyRoutes.ts
    - Add POST /api/admin/properties/:id/reject
    - Add GET /api/admin/properties/pending
    - Implement handlers in backend/src/controllers/propertyController.ts
    - Apply adminOnly middleware
    - _Requirements: 7.3, 7.4, 7.5_

  - [x] 7.2 Implement admin approval logic
    - Create backend/src/services/propertyStatusService.ts
    - Implement approveProperty(propertyId, adminId, approvedStatus)
    - Set pro_status to seller's intended status
    - Set approvedBy and approvedAt fields
    - Implement rejectProperty(propertyId, adminId, reason)
    - Set pro_status to "Rejected"
    - Set rejectedBy, rejectedAt, rejectionReason fields
    - _Requirements: 7.3, 7.4_

  - [ ]* 7.3 Write property tests for admin approval
    - **Property 22: Admin Approval Status Transition**
    - **Validates: Requirements 7.3**
    - **Property 23: Admin Rejection Status Transition**
    - **Validates: Requirements 7.4**
    - **Property 24: Pending Approval Count Accuracy**
    - **Validates: Requirements 7.5**
    - **Property 49: Admin-Only Status Approval**
    - **Validates: Requirements 15.5**

  - [x] 7.4 Update property search to hide pending properties
    - Update backend/src/services/propertyService.ts search method
    - Filter out properties with pro_status="Waiting for Admin Approval"
    - Allow property owner to see their own pending properties
    - _Requirements: 7.2, 15.2_

  - [ ]* 7.5 Write property test for pending property visibility
    - **Property 21: Pending Properties Hidden from Public Search**
    - **Validates: Requirements 7.2, 15.2**

  - [x] 7.6 Create admin approval queue UI component
    - Create frontend/src/components/admin/PropertyApprovalQueue.tsx
    - Display pending properties with details
    - Add approve/reject buttons
    - Show pending count badge
    - _Requirements: 7.3, 7.4, 7.5_

  - [x] 7.7 Create property status badge component
    - Create frontend/src/components/property/PropertyStatusBadge.tsx
    - Display status with color coding
    - Show appropriate icon for each status
    - _Requirements: 6.4_

  - [ ]* 7.8 Write unit tests for admin approval workflow
    - Test admin can approve properties
    - Test admin can reject properties with reason
    - Test non-admin cannot approve/reject
    - Test pending properties hidden from public search
    - Test pending count accuracy
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 15.5_

- [x] 8. Phase 2 - Property Management: Spam Detection
  - [x] 8.1 Implement Spam Detection Service
    - Create backend/src/services/spamDetectionService.ts
    - Implement checkDuplicateContent(description) using string similarity (90% threshold)
    - Implement checkDuplicateImages(imageUrls) using perceptual hashing
    - Implement flagProperty(propertyId, reason)
    - Implement checkReportThreshold(propertyId) - auto-flag at 3 reports
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 12.4_

  - [ ]* 8.2 Write property tests for spam detection
    - **Property 36: Duplicate Content Detection**
    - **Validates: Requirements 11.1, 11.2**
    - **Property 37: Duplicate Image Detection**
    - **Validates: Requirements 11.3**
    - **Property 38: Suspicious Property Flagging**
    - **Validates: Requirements 11.4**
    - **Property 42: Report Threshold Auto-Flagging**
    - **Validates: Requirements 12.4**

  - [x] 8.3 Integrate spam detection into property creation
    - Update backend/src/controllers/propertyController.ts create method
    - Call spamDetectionService.checkDuplicateContent()
    - Call spamDetectionService.checkDuplicateImages()
    - Flag property if suspicious patterns detected
    - Allow creation but mark as flagged
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 8.4 Create admin endpoints for flagged properties
    - Add GET /api/admin/properties/flagged in backend/src/routes/propertyRoutes.ts
    - Add POST /api/admin/properties/:id/clear-flag
    - Implement handlers in backend/src/controllers/propertyController.ts
    - _Requirements: 11.5_

  - [ ]* 8.5 Write property test for admin flag clearing
    - **Property 39: Admin Flag Clearing**
    - **Validates: Requirements 11.5**

  - [x] 8.6 Create flagged properties panel UI
    - Create frontend/src/components/admin/SuspiciousListingsPanel.tsx
    - Display flagged properties with reasons
    - Add clear flag button
    - Show flagged count badge
    - _Requirements: 11.4, 11.5_

  - [ ]* 8.7 Write unit tests for spam detection
    - Test duplicate content detection (90% similarity)
    - Test duplicate image detection
    - Test property flagging
    - Test admin can clear flags
    - Test report threshold auto-flagging
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.4_

- [x] 9. Phase 2 - Property Management: User Reporting System
  - [x] 9.1 Create Property Report model and repository
    - Create PropertyReport interface in backend/src/types/index.ts
    - Create backend/src/repositories/reportRepository.ts
    - Implement methods: create, findByProperty, findByReporter, updateStatus
    - _Requirements: 12.2, 12.3_

  - [x] 9.2 Implement report submission endpoint
    - Add POST /api/properties/:id/report in backend/src/routes/propertyRoutes.ts
    - Implement handler in backend/src/controllers/propertyController.ts
    - Validate report reason enum
    - Check for duplicate reports from same user
    - Increment property reportCount
    - Check report threshold and auto-flag if needed
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 9.3 Write property tests for reporting
    - **Property 40: Report Reason Values**
    - **Validates: Requirements 12.2**
    - **Property 41: Report Record Structure**
    - **Validates: Requirements 12.3**
    - **Property 43: Duplicate Report Prevention**
    - **Validates: Requirements 12.5**

  - [x] 9.4 Create admin report management endpoints
    - Add GET /api/admin/reports in backend/src/routes/propertyRoutes.ts
    - Add POST /api/admin/reports/:id/review
    - Implement handlers in backend/src/controllers/propertyController.ts
    - Support actions: dismiss, flag_property, remove_property
    - _Requirements: 12.4_

  - [x] 9.5 Create report property modal UI
    - Create frontend/src/components/property/ReportPropertyModal.tsx
    - Display report reason options
    - Add optional additional details textarea
    - Handle submission and error states
    - _Requirements: 12.1, 12.2_

  - [x] 9.6 Add report button to property detail page
    - Update frontend/src/pages/PropertyDetailPage.tsx
    - Add "Report" button
    - Open ReportPropertyModal on click
    - _Requirements: 12.1_

  - [ ]* 9.7 Write unit tests for reporting system
    - Test report submission with valid reasons
    - Test duplicate report prevention
    - Test report threshold auto-flagging
    - Test admin can review reports
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 10. Checkpoint - Phase 2 Complete
  - Ensure all tests pass, ask the user if questions arise.


- [x] 11. Phase 3 - Enhanced Features: Image Compression and Optimization
  - [x] 11.1 Install and configure Sharp library
    - Add sharp package to backend/package.json
    - Configure Sharp for JPEG compression with 85% quality
    - _Requirements: 13.1, 13.2_

  - [x] 11.2 Implement Image Compression Service
    - Create backend/src/services/imageCompressionService.ts
    - Implement validateImage(file) - check size (10MB max), format
    - Implement compressAndUpload(file, propertyId, imageId)
    - Compress to max 1920px width, maintain aspect ratio
    - Generate thumbnail at 400px width
    - Upload both versions to Firebase Storage
    - Use naming pattern: {propertyId}/{imageId}_full.jpg and {propertyId}/{imageId}_thumb.jpg
    - Return URLs for both versions
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ]* 11.3 Write property tests for image compression
    - **Property 44: Image Compression Width Limit**
    - **Validates: Requirements 13.1**
    - **Property 45: Thumbnail Generation**
    - **Validates: Requirements 13.3**
    - **Property 46: Image Size Validation**
    - **Validates: Requirements 13.4**
    - **Property 47: Image Storage Naming Convention**
    - **Validates: Requirements 13.5**

  - [x] 11.4 Update property image upload endpoint
    - Update backend/src/controllers/propertyController.ts uploadImage method
    - Call imageCompressionService.validateImage()
    - Call imageCompressionService.compressAndUpload()
    - Store both full and thumbnail URLs in property document
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 11.5 Update Property model with thumbnail URLs
    - Add thumbnailUrls string array field to Property interface
    - Update property creation to store thumbnail URLs
    - _Requirements: 13.3, 13.5_

  - [x] 11.6 Update frontend to use thumbnails
    - Update frontend/src/components/property/PropertyCard.tsx
    - Use thumbnail URLs for property card images
    - Use full URLs for property detail page
    - Add loading states for images
    - _Requirements: 13.3_

  - [ ]* 11.7 Write unit tests for image compression
    - Test image size validation (reject >10MB)
    - Test compression to 1920px width
    - Test thumbnail generation at 400px
    - Test storage naming convention
    - Test aspect ratio preservation
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 12. Phase 3 - Enhanced Features: Buyer Interest Qualification
  - [x] 12.1 Update Appointment model with qualification fields
    - Update BuyerInterest interface in backend/src/types/index.ts and frontend/src/types/index.ts
    - Add reason_to_buy: 'Investment' | 'Self Use'
    - Add is_property_dealer: boolean
    - Add buyer_name, buyer_phone: string
    - Add optional: purchase_timeline, home_loan_interest, site_visit_interest
    - Add terms_accepted, privacy_policy_accepted: boolean
    - Add contact_revealed, contact_revealed_at fields
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 12.2 Write property tests for buyer interest
    - **Property 29: Buyer Interest Required Fields**
    - **Validates: Requirements 9.1**
    - **Property 30: Buyer Interest Optional Fields**
    - **Validates: Requirements 9.2**
    - **Property 31: Terms Acceptance Requirement**
    - **Validates: Requirements 9.3**

  - [x] 12.3 Update appointment creation endpoint
    - Update backend/src/controllers/appointmentController.ts create method
    - Validate all required qualification fields
    - Validate terms_accepted and privacy_policy_accepted are true
    - Apply appointmentRequestRateLimiter middleware
    - Set contact_revealed to true and contact_revealed_at to current timestamp
    - Return seller contact information in response
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 10.1_

  - [ ]* 12.4 Write property tests for appointment rate limiting
    - **Property 33: Appointment Request Rate Limiting**
    - **Validates: Requirements 10.1, 10.2, 10.3**
    - **Property 34: Cancelled Appointments Exclusion from Limit**
    - **Validates: Requirements 10.4**
    - **Property 35: Appointment Limit Reset on Property Closure**
    - **Validates: Requirements 10.5**

  - [x] 12.5 Update appointment validators
    - Update backend/src/validators/appointmentValidator.ts
    - Add validation schema for qualification fields
    - Validate reason_to_buy enum
    - Validate required fields presence
    - Validate terms acceptance
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 12.6 Create buyer qualification form UI
    - Create frontend/src/components/property/BuyerQualificationForm.tsx
    - Add fields: reason_to_buy (radio), is_property_dealer (checkbox)
    - Add fields: buyer_name, buyer_phone (text inputs)
    - Add optional fields: purchase_timeline (select), home_loan_interest, site_visit_interest (checkboxes)
    - Add terms and privacy policy checkboxes with links
    - Add form validation
    - Display seller contact on successful submission
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [x] 12.7 Update appointment booking modal
    - Update frontend/src/components/property/AppointmentBookingModal.tsx
    - Replace simple form with BuyerQualificationForm
    - Handle qualification data submission
    - Display seller contact information after submission
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [ ]* 12.8 Write property test for seller contact revelation
    - **Property 32: Seller Contact Revelation**
    - **Validates: Requirements 9.5**

  - [ ]* 12.9 Write unit tests for buyer qualification
    - Test appointment creation with all required fields
    - Test rejection without terms acceptance
    - Test optional fields handling
    - Test seller contact revelation
    - Test rate limiting (3 per buyer per property)
    - Test cancelled appointments don't count toward limit
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 10.1, 10.2, 10.3, 10.4_

- [x] 13. Checkpoint - Phase 3 Complete
  - Ensure all tests pass, ask the user if questions arise.


- [x] 14. Phase 4 - Brochure & Notifications: PDF Brochure Generation
  - [x] 14.1 Install PDF generation dependencies
    - Add pdfkit package to backend/package.json
    - Add qrcode package for QR code generation
    - Configure PDFKit for document generation
    - _Requirements: 8.1, 17.5_

  - [x] 14.2 Create Brochure model
    - Create Brochure interface in backend/src/types/index.ts
    - Add fields: id, propertyId, generatedBy, fileUrl, fileName, fileSize, expiresAt, createdAt
    - _Requirements: 8.4, 8.5_

  - [x] 14.3 Implement Brochure Generator Service
    - Create backend/src/services/brochureGeneratorService.ts
    - Implement generateBrochure(propertyId, userId)
    - Fetch property data including images, details, seller info
    - Create PDF with PDFKit
    - Add Estate Bridge branding in header/footer
    - Add property images (max 3 per page)
    - Add property details: type, price (formatted with currency), location, description
    - Add property features if available
    - Add seller contact information
    - Generate QR code linking to property detail page
    - Upload PDF to Firebase Storage: brochures/{propertyId}/{timestamp}.pdf
    - Generate signed URL with 1 hour expiration
    - Return download URL, expiration time, filename
    - Implement cleanupExpiredBrochures() for maintenance
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 17.1, 17.2, 17.3, 17.4, 17.5_

  - [ ]* 14.4 Write property tests for brochure generation
    - **Property 25: Brochure Content Completeness**
    - **Validates: Requirements 8.1, 17.1, 17.2, 17.4**
    - **Property 26: Brochure Branding**
    - **Validates: Requirements 8.2**
    - **Property 27: Brochure Download URL Expiration**
    - **Validates: Requirements 8.4**
    - **Property 28: Brochure Storage Path Format**
    - **Validates: Requirements 8.5**
    - **Property 54: Brochure QR Code Inclusion**
    - **Validates: Requirements 17.5**

  - [x] 14.5 Create brochure download endpoint
    - Add POST /api/properties/:id/brochure in backend/src/routes/propertyRoutes.ts
    - Implement handler in backend/src/controllers/propertyController.ts
    - Call brochureGeneratorService.generateBrochure()
    - Return download URL with expiration
    - _Requirements: 8.1, 8.4_

  - [x] 14.6 Create brochure download button UI
    - Create frontend/src/components/property/BrochureDownloadButton.tsx
    - Add download icon and text
    - Handle loading state during generation
    - Trigger download on successful generation
    - Show error message if generation fails
    - _Requirements: 8.1, 8.4_

  - [x] 14.7 Add brochure button to property detail page
    - Update frontend/src/pages/PropertyDetailPage.tsx
    - Add BrochureDownloadButton component
    - Position near property title or action buttons
    - _Requirements: 8.1_

  - [ ]* 14.8 Write unit tests for brochure generation
    - Test PDF generation with all required content
    - Test branding inclusion
    - Test QR code generation
    - Test signed URL expiration (1 hour)
    - Test storage path format
    - Test graceful failure handling
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 17.1, 17.2, 17.3, 17.4, 17.5_

- [~] 15. Phase 4 - Brochure & Notifications: Admin Notification System
  - [~] 15.1 Set up Firebase Cloud Functions project
    - Initialize functions directory if not exists
    - Configure TypeScript for Cloud Functions
    - Add Firebase Admin SDK
    - Configure email service (Nodemailer with SMTP)
    - _Requirements: 16.1_

  - [~] 15.2 Implement Admin Notification Service
    - Create backend/src/services/adminNotificationService.ts
    - Implement notifyPropertyPendingApproval(property)
    - Implement notifyPropertyFlagged(property, reason)
    - Implement batchNotifications(notifications) - batch if within 5 minutes
    - Add retry logic with exponential backoff (3 retries)
    - Fetch admin emails from users collection
    - Send email with property details and review link
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [ ]* 15.3 Write property tests for admin notifications
    - **Property 50: Property Creation Notification Trigger**
    - **Validates: Requirements 16.1**
    - **Property 51: Admin Notification Content**
    - **Validates: Requirements 16.2, 16.3**
    - **Property 52: Notification Batching**
    - **Validates: Requirements 16.4**
    - **Property 53: Notification Retry Logic**
    - **Validates: Requirements 16.5**

  - [~] 15.4 Create property creation trigger function
    - Create functions/src/triggers/onPropertyCreate.ts
    - Listen to properties collection onCreate event
    - Check if pro_status is "Waiting for Admin Approval"
    - Call adminNotificationService.notifyPropertyPendingApproval()
    - _Requirements: 16.1_

  - [~] 15.5 Integrate notification service into property creation
    - Update backend/src/controllers/propertyController.ts create method
    - Call adminNotificationService.notifyPropertyPendingApproval() after property creation
    - Handle notification failures gracefully (log but don't block creation)
    - _Requirements: 16.1, 16.2_

  - [~] 15.6 Create email templates for notifications
    - Create email template for property approval request
    - Include property_id, seller_name, property_type, submission_timestamp
    - Include direct link to admin approval queue
    - Add Estate Bridge branding
    - _Requirements: 16.2, 16.3_

  - [ ]* 15.7 Write unit tests for admin notifications
    - Test notification triggered on property creation
    - Test notification content includes required fields
    - Test notification batching (5 minute window)
    - Test retry logic on failure
    - Test graceful handling of email service failures
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 16. Phase 4 - Brochure & Notifications: Currency Formatting
  - [x] 16.1 Enhance currency formatting in Currency Service
    - Update backend/src/services/currencyService.ts formatPrice method
    - Implement USD formatting: $X,XXX.XX with 2 decimals
    - Implement INR formatting: ₹X,XX,XXX with 0 decimals (Indian numbering)
    - Add currency code to formatted string
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [x] 16.2 Create frontend currency formatting hook
    - Create frontend/src/hooks/useCurrency.ts
    - Implement formatPrice(amount, currency) matching backend logic
    - Export hook for use in components
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [x] 16.3 Apply currency formatting to property cards
    - Update frontend/src/components/property/PropertyCard.tsx
    - Use useCurrency hook to format price
    - Display formatted price with currency symbol and code
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [x] 16.4 Apply currency formatting to property detail page
    - Update frontend/src/pages/PropertyDetailPage.tsx
    - Use useCurrency hook to format price
    - Display formatted price prominently
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [x] 16.5 Apply currency formatting to brochure generation
    - Update backend/src/services/brochureGeneratorService.ts
    - Use currencyService.formatPrice() for price in PDF
    - Ensure consistent formatting across all documents
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

  - [ ]* 16.6 Write unit tests for currency formatting
    - Test USD formatting with various amounts
    - Test INR formatting with Indian numbering system
    - Test decimal places (2 for USD, 0 for INR)
    - Test currency code inclusion
    - Test formatting consistency across frontend and backend
    - _Requirements: 18.1, 18.2, 18.3, 18.4_

- [x] 17. Checkpoint - Phase 4 Complete
  - Ensure all tests pass, ask the user if questions arise.


- [~] 18. Phase 5 - Infrastructure & Optimization: Firebase Optimization
  - [x] 18.1 Update Firestore security rules
    - Update firestore.rules file
    - Add rules for verification_tokens collection (backend only)
    - Add rules for property_reports collection (users can create, admins can read/update)
    - Add rules for rate_limits collection (backend only)
    - Add rules for brochures collection (authenticated users can read)
    - Update properties rules to check emailVerified for creation
    - Update properties rules to hide "Waiting for Admin Approval" from non-owners
    - Update properties rules to restrict pro_status approval to admins
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ]* 18.2 Write property tests for security rules
    - **Property 11: Initial Email Verification Status**
    - **Validates: Requirements 4.2**
    - **Property 59: Email Verification Success**
    - **Validates: Requirements 20.3**
    - **Property 60: Expired Token Error Handling**
    - **Validates: Requirements 20.4**

  - [x] 18.3 Create Firestore composite indexes
    - Update firestore.indexes.json
    - Add index: (buy_country, buy_city, pro_status, createdAt)
    - Add index: (pro_status, propertyType, price)
    - Add index: (flagged, createdAt)
    - Add index: (propertyId, status, createdAt) for property_reports
    - Add index: (buyerId, status, createdAt) for appointments
    - Add index: (sellerId, status, createdAt) for appointments
    - Deploy indexes to Firebase
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [~] 18.4 Create token cleanup Cloud Function
    - Create functions/src/scheduled/cleanupExpiredTokens.ts
    - Schedule to run daily (every 24 hours)
    - Query verification_tokens where expiresAt < now and used = false
    - Delete expired tokens in batches
    - Log cleanup statistics
    - _Requirements: 4.5_

  - [~] 18.5 Create brochure cleanup Cloud Function
    - Create functions/src/scheduled/cleanupExpiredBrochures.ts
    - Schedule to run daily
    - Query brochures where expiresAt < now
    - Delete expired brochure files from Storage
    - Delete expired brochure records from Firestore
    - Log cleanup statistics
    - _Requirements: 8.4_

  - [~] 18.6 Deploy Cloud Functions
    - Deploy onPropertyCreate trigger function
    - Deploy cleanupExpiredTokens scheduled function
    - Deploy cleanupExpiredBrochures scheduled function
    - Verify functions are running correctly
    - Set up monitoring and alerts
    - _Requirements: 16.1, 4.5, 8.4_

  - [x] 18.7 Update Storage security rules
    - Update storage.rules file
    - Restrict property image uploads to authenticated users
    - Restrict brochure access to authenticated users
    - Set size limits for uploads
    - _Requirements: 13.4_

  - [ ]* 18.8 Write unit tests for Firebase optimization
    - Test security rules enforcement
    - Test composite index usage in queries
    - Test token cleanup function
    - Test brochure cleanup function
    - _Requirements: 14.1, 14.2, 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 19. Phase 5 - Infrastructure & Optimization: Frontend UI Updates
  - [x] 19.1 Update registration form with location fields
    - Update frontend/src/pages/RegisterPage.tsx
    - Add country dropdown (with ISO codes)
    - Add city, state, address, pincode text inputs
    - Add field validation with error messages
    - Integrate CaptchaWidget component
    - Show email verification reminder after registration
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1_

  - [x] 19.2 Create email verification banner component
    - Create frontend/src/components/auth/EmailVerificationBanner.tsx
    - Display banner when user is not verified
    - Show "Verify your email" message with resend button
    - Hide banner after verification
    - _Requirements: 4.2, 20.4_

  - [x] 19.3 Add email verification banner to layout
    - Update frontend/src/components/layout/Navbar.tsx or App.tsx
    - Show EmailVerificationBanner for unverified users
    - Position at top of page
    - _Requirements: 4.2_

  - [x] 19.4 Update property form with new status options
    - Update frontend/src/pages/PropertyCreatePage.tsx
    - Update frontend/src/pages/PropertyEditPage.tsx
    - Add pro_status dropdown with new values
    - Add added_by_broker checkbox
    - Show status badge on property cards
    - _Requirements: 6.1, 6.3, 6.4_

  - [x] 19.5 Create admin dashboard page
    - Create frontend/src/pages/AdminDashboardPage.tsx
    - Add PropertyApprovalQueue component
    - Add SuspiciousListingsPanel component
    - Add navigation tabs for different admin views
    - Restrict access to admin users only
    - _Requirements: 7.3, 7.4, 7.5, 11.4, 11.5_

  - [x] 19.6 Update property detail page with new features
    - Update frontend/src/pages/PropertyDetailPage.tsx
    - Add PropertyStatusBadge component
    - Add BrochureDownloadButton component
    - Add Report button (opens ReportPropertyModal)
    - Update appointment booking to use BuyerQualificationForm
    - _Requirements: 6.4, 8.1, 12.1, 9.1_

  - [x] 19.7 Add rate limit feedback to UI
    - Create frontend/src/hooks/useRateLimiting.ts
    - Track rate limit state from API responses
    - Show user-friendly messages when limits reached
    - Display countdown timer for rate limit reset
    - _Requirements: 3.5, 5.3, 10.3_

  - [ ]* 19.8 Write integration tests for UI flows
    - Test registration flow with location data and CAPTCHA
    - Test email verification flow
    - Test property creation with approval workflow
    - Test brochure download flow
    - Test buyer qualification form submission
    - Test reporting flow
    - _Requirements: 1.1, 4.1, 6.2, 8.1, 9.1, 12.1_

- [x] 20. Phase 5 - Infrastructure & Optimization: Testing and Documentation
  - [x] 20.1 Write comprehensive unit tests for all services
    - Ensure all services have >80% code coverage
    - Test all error conditions and edge cases
    - Test all validation logic
    - Test all rate limiting scenarios
    - _Requirements: All_

  - [ ]* 20.2 Write property-based tests for all correctness properties
    - Implement all 60 property tests using fast-check
    - Configure to run 100 iterations per property
    - Add property tags referencing design document
    - Ensure all properties pass consistently
    - _Requirements: All_

  - [x] 20.3 Write integration tests for critical flows
    - Test end-to-end registration with email verification
    - Test end-to-end property creation with admin approval
    - Test end-to-end buyer interest with qualification
    - Test end-to-end brochure generation
    - Test end-to-end spam detection and reporting
    - _Requirements: All_

  - [x] 20.4 Update environment configuration
    - Add all required environment variables to .env.example
    - Document reCAPTCHA setup requirements
    - Document SMTP configuration requirements
    - Document Firebase configuration requirements
    - Update backend/README.md with setup instructions
    - _Requirements: All_

  - [x] 20.5 Create database migration guide
    - Document new collections: verification_tokens, property_reports, rate_limits, brochures
    - Document updated collections: users, properties, appointments
    - Document required Firestore indexes
    - Document security rules updates
    - Create migration script if needed
    - _Requirements: All_

  - [x] 20.6 Update API documentation
    - Document all new endpoints with request/response examples
    - Document authentication requirements
    - Document rate limiting behavior
    - Document error codes and messages
    - Update Postman collection or OpenAPI spec
    - _Requirements: All_

- [x] 21. Final Checkpoint - All Phases Complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate end-to-end user flows
- Checkpoints ensure incremental validation at the end of each phase
- All code examples use TypeScript as specified in the design document
- Firebase Cloud Functions are used for background tasks (notifications, cleanup)
- Rate limiting is enforced at multiple levels (registration, property creation, appointments)
- Admin approval workflow ensures quality control before properties go live
- Spam detection uses both content similarity and image hashing
- Email verification is required before property creation
- CAPTCHA prevents bot registrations with v3/v2 fallback
- Multi-currency support is based on user location (US → USD, others → INR)
- Image compression reduces storage costs and improves performance
- Brochure generation provides professional PDF downloads with QR codes
- Buyer qualification forms improve lead quality for sellers

