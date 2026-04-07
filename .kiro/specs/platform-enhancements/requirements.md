# Requirements Document

## Introduction

This document specifies requirements for platform enhancements to the Estate Bridge real estate platform. These enhancements improve user registration with detailed location data, add multi-currency support, implement bot and spam prevention mechanisms, enhance property status management, enable property brochure generation, qualify buyer interest through detailed forms, and optimize Firebase infrastructure.

## Glossary

- **Registration_System**: The system component responsible for user account creation and profile management
- **Currency_System**: The system component that determines and manages currency display based on user location
- **Verification_System**: The system component that prevents automated bot registrations and spam
- **Property_Management_System**: The system component that handles property listings, status, and lifecycle
- **Brochure_Generator**: The system component that creates PDF brochures for property listings
- **Interest_Qualification_System**: The system component that collects and validates buyer interest information
- **Spam_Prevention_System**: The system component that detects and prevents spam listings and requests
- **Storage_System**: The Firebase Storage component for images and documents
- **Database_System**: The Firestore database component for structured data
- **Admin_Approval_Queue**: A collection of properties awaiting administrator review
- **Buyer**: A registered user with role "buyer" who searches for properties
- **Seller**: A registered user with role "seller" who lists properties
- **Admin**: A user with administrative privileges who moderates content
- **Property_Listing**: A property record in the properties collection
- **Qualified_Lead**: A buyer interest record with complete qualification information
- **Verification_Token**: A unique token sent to user email for verification
- **Rate_Limit**: Maximum number of operations allowed within a time window

## Requirements

### Requirement 1: Enhanced User Location Data Collection

**User Story:** As a platform administrator, I want to collect detailed location information during registration, so that users can be matched with relevant properties in their area and currency preferences can be set accurately.

#### Acceptance Criteria

1. WHEN a user registers, THE Registration_System SHALL collect country, city, state, place/address, and pincode
2. THE Registration_System SHALL store location data in fields: buy_country, buy_city, buy_state, buy_address, buy_pincode
3. THE Registration_System SHALL validate that country is a valid ISO country code
4. THE Registration_System SHALL validate that pincode matches the format for the selected country
5. WHEN location data is incomplete, THE Registration_System SHALL return a validation error with specific missing fields

### Requirement 2: Multi-Currency Support Based on Location

**User Story:** As an international user, I want to see prices in my local currency, so that I can understand property costs without manual conversion.

#### Acceptance Criteria

1. WHEN a user from USA registers, THE Currency_System SHALL set the user's currency preference to USD
2. WHEN a user from any country other than USA registers, THE Currency_System SHALL set the user's currency preference to INR
3. THE Currency_System SHALL store the currency preference in the user profile
4. WHEN displaying property prices, THE Currency_System SHALL format prices according to the user's currency preference
5. THE Currency_System SHALL persist currency preference across user sessions

### Requirement 3: Bot Registration Prevention

**User Story:** As a platform administrator, I want to prevent automated bot registrations, so that the platform maintains authentic user accounts.

#### Acceptance Criteria

1. WHEN a registration form is displayed, THE Verification_System SHALL present a CAPTCHA challenge
2. THE Verification_System SHALL validate the CAPTCHA response before creating an account
3. IF the CAPTCHA validation fails, THEN THE Verification_System SHALL reject the registration with an error message
4. THE Verification_System SHALL limit registration attempts to 5 per IP address per hour
5. IF registration rate limit is exceeded, THEN THE Verification_System SHALL block further attempts for 1 hour

### Requirement 4: Email Verification Requirement

**User Story:** As a platform administrator, I want users to verify their email addresses, so that spam accounts are reduced and communication channels are validated.

#### Acceptance Criteria

1. WHEN a user completes registration, THE Verification_System SHALL send a verification email containing a Verification_Token
2. THE Verification_System SHALL mark the user account as unverified until email verification completes
3. WHEN a user attempts to create a property listing, THE Property_Management_System SHALL verify that the user's email is verified
4. IF email is not verified, THEN THE Property_Management_System SHALL reject the property creation with a verification required message
5. THE Verification_Token SHALL expire after 24 hours

### Requirement 5: Property Creation Rate Limiting

**User Story:** As a platform administrator, I want to limit the number of properties a user can post per day, so that spam listings are prevented.

#### Acceptance Criteria

1. THE Spam_Prevention_System SHALL set a Rate_Limit of 5 properties per user per day
2. WHEN a user attempts to create a property, THE Spam_Prevention_System SHALL count properties created by that user in the last 24 hours
3. IF the count exceeds the Rate_Limit, THEN THE Spam_Prevention_System SHALL reject the creation with a rate limit exceeded message
4. THE Spam_Prevention_System SHALL reset the count after 24 hours from the first property creation
5. WHERE the user has admin privileges, THE Spam_Prevention_System SHALL exempt the user from rate limiting

### Requirement 6: Property Status Management

**User Story:** As a seller, I want to set and update property status, so that buyers know the current availability of my listings.

#### Acceptance Criteria

1. THE Property_Management_System SHALL support status values: "For Sale", "For Rent", "Under Construction", "Closed", "Finished"
2. WHEN a property is created, THE Property_Management_System SHALL set the initial status to "Waiting for Admin Approval"
3. THE Property_Management_System SHALL store a boolean field "added_by_broker" indicating broker submission
4. WHEN displaying a property, THE Property_Management_System SHALL show a status badge with the current status
5. THE Property_Management_System SHALL allow sellers to update status for their own properties

### Requirement 7: Admin Approval Workflow

**User Story:** As an administrator, I want to review and approve properties before they go live, so that fraudulent or inappropriate listings are prevented.

#### Acceptance Criteria

1. WHEN a new property is created, THE Property_Management_System SHALL add it to the Admin_Approval_Queue
2. THE Property_Management_System SHALL hide properties with status "Waiting for Admin Approval" from public search results
3. WHEN an Admin approves a property, THE Property_Management_System SHALL change the status to the seller's intended status
4. WHEN an Admin rejects a property, THE Property_Management_System SHALL change the status to "Rejected" and notify the seller
5. THE Property_Management_System SHALL display pending approval count to administrators

### Requirement 8: Property Brochure Generation

**User Story:** As a buyer, I want to download a professional PDF brochure for properties I'm interested in, so that I can review details offline and share with family.

#### Acceptance Criteria

1. WHEN a user requests a property brochure, THE Brochure_Generator SHALL create a PDF document containing property images, details, features, location, and price
2. THE Brochure_Generator SHALL include Estate Bridge branding in the PDF header and footer
3. THE Brochure_Generator SHALL format the PDF with professional styling and layout
4. WHEN brochure generation completes, THE Brochure_Generator SHALL provide a download link valid for 1 hour
5. THE Brochure_Generator SHALL store generated brochures in the Storage_System with path pattern: brochures/{property_id}/{timestamp}.pdf

### Requirement 9: Enhanced Buyer Interest Qualification

**User Story:** As a seller, I want to receive qualified buyer leads with detailed information, so that I can prioritize serious buyers and understand their needs.

#### Acceptance Criteria

1. WHEN a buyer expresses interest in a property, THE Interest_Qualification_System SHALL collect: reason_to_buy (Investment/Self Use), is_property_dealer (Yes/No), buyer_name, buyer_phone
2. THE Interest_Qualification_System SHALL optionally collect: purchase_timeline (3 months/6 months/More than 6 months), home_loan_interest (boolean), site_visit_interest (boolean)
3. THE Interest_Qualification_System SHALL require acceptance of terms and conditions and privacy policy
4. WHEN the qualification form is submitted, THE Interest_Qualification_System SHALL create a Qualified_Lead record in the appointments collection
5. THE Interest_Qualification_System SHALL reveal seller contact information only after form submission

### Requirement 10: Buyer Appointment Request Rate Limiting

**User Story:** As a seller, I want to prevent buyers from spamming appointment requests, so that I receive genuine interest inquiries.

#### Acceptance Criteria

1. THE Spam_Prevention_System SHALL limit appointment requests to 3 per buyer per property
2. WHEN a buyer attempts to create an appointment request, THE Spam_Prevention_System SHALL count existing requests from that buyer for that property
3. IF the count reaches the limit, THEN THE Spam_Prevention_System SHALL reject the request with a limit exceeded message
4. THE Spam_Prevention_System SHALL allow new requests if previous requests were rejected or cancelled by the buyer
5. THE Spam_Prevention_System SHALL reset the count when the property status changes to "Closed" or "Finished"

### Requirement 11: Suspicious Pattern Detection

**User Story:** As a platform administrator, I want to automatically detect suspicious property listings, so that spam and fraudulent content can be reviewed quickly.

#### Acceptance Criteria

1. WHEN a property is created, THE Spam_Prevention_System SHALL check for duplicate content by comparing description text with existing properties
2. IF description similarity exceeds 90% with another property, THEN THE Spam_Prevention_System SHALL flag the property as suspicious
3. THE Spam_Prevention_System SHALL detect if property images match images from other listings using image hash comparison
4. WHEN a property is flagged as suspicious, THE Spam_Prevention_System SHALL add a "flagged" field to the property record and notify administrators
5. THE Spam_Prevention_System SHALL allow administrators to review and clear flags

### Requirement 12: User Reporting System

**User Story:** As a buyer, I want to report spam or inappropriate listings, so that the platform quality is maintained.

#### Acceptance Criteria

1. WHEN viewing a property, THE Property_Management_System SHALL display a "Report" button
2. WHEN a user clicks report, THE Property_Management_System SHALL collect report reason: Spam, Inappropriate Content, Fake Images, Duplicate Listing, Other
3. THE Property_Management_System SHALL store the report with reporter_id, property_id, reason, and timestamp
4. WHEN a property receives 3 or more reports, THE Property_Management_System SHALL automatically flag it for admin review
5. THE Property_Management_System SHALL prevent users from reporting the same property multiple times

### Requirement 13: Image Compression and Optimization

**User Story:** As a platform administrator, I want property images to be compressed before upload, so that storage costs are reduced and page load times are improved.

#### Acceptance Criteria

1. WHEN a user uploads a property image, THE Storage_System SHALL compress the image to maximum 1920px width while maintaining aspect ratio
2. THE Storage_System SHALL reduce image quality to 85% JPEG compression
3. THE Storage_System SHALL generate a thumbnail version at 400px width for property cards
4. THE Storage_System SHALL reject images larger than 10MB before compression
5. WHEN compression completes, THE Storage_System SHALL store both full-size and thumbnail versions with naming pattern: {property_id}/{image_id}_full.jpg and {property_id}/{image_id}_thumb.jpg

### Requirement 14: Firestore Query Optimization

**User Story:** As a platform administrator, I want database queries to be optimized with proper indexes, so that search and listing operations perform efficiently at scale.

#### Acceptance Criteria

1. THE Database_System SHALL create a composite index on properties collection for fields: (country, city, pro_status, created_at)
2. THE Database_System SHALL create a composite index on properties collection for fields: (pro_status, pro_type, pro_price)
3. THE Database_System SHALL create a composite index on appointments collection for fields: (buyer_id, status, created_at)
4. THE Database_System SHALL create a composite index on appointments collection for fields: (seller_id, status, created_at)
5. THE Database_System SHALL create a single-field index on properties collection for field: sell_id

### Requirement 15: Firebase Security Rules

**User Story:** As a platform administrator, I want proper security rules enforced at the database level, so that users can only access data they are authorized to view or modify.

#### Acceptance Criteria

1. THE Database_System SHALL allow users to read only their own buyer profile document
2. THE Database_System SHALL allow users to read property documents with pro_status not equal to "Waiting for Admin Approval" unless they are the property owner
3. THE Database_System SHALL allow users to create property documents only if their email is verified
4. THE Database_System SHALL allow users to update only property documents where sell_id matches their user ID
5. THE Database_System SHALL allow only administrators to update pro_status field to "Approved" or "Rejected"

### Requirement 16: Admin Notification System

**User Story:** As an administrator, I want to receive notifications when properties require approval, so that I can review them promptly.

#### Acceptance Criteria

1. WHEN a property is created with status "Waiting for Admin Approval", THE Property_Management_System SHALL trigger a Cloud Function
2. THE Cloud Function SHALL send an email notification to all administrators with property details and review link
3. THE Cloud Function SHALL include property_id, seller_name, property_type, and submission_timestamp in the notification
4. THE Property_Management_System SHALL batch notifications if multiple properties are submitted within 5 minutes
5. IF notification delivery fails, THEN THE Property_Management_System SHALL retry up to 3 times with exponential backoff

### Requirement 17: Brochure Content Requirements

**User Story:** As a buyer, I want property brochures to contain comprehensive information, so that I have all details needed for decision making.

#### Acceptance Criteria

1. THE Brochure_Generator SHALL include all property images in the PDF with maximum 3 images per page
2. THE Brochure_Generator SHALL include property details: type, price, location (country, state, city, address), description
3. THE Brochure_Generator SHALL include property features if available: bedrooms, bathrooms, square footage, amenities
4. THE Brochure_Generator SHALL include seller contact information: name, email, phone
5. THE Brochure_Generator SHALL include a QR code linking to the property detail page on the platform

### Requirement 18: Currency Display Formatting

**User Story:** As a user, I want prices displayed in proper currency format with symbols, so that I can easily understand the cost.

#### Acceptance Criteria

1. WHEN displaying USD prices, THE Currency_System SHALL format with pattern: $X,XXX.XX
2. WHEN displaying INR prices, THE Currency_System SHALL format with pattern: ₹X,XX,XXX.XX (Indian numbering system)
3. THE Currency_System SHALL round prices to 2 decimal places for USD and 0 decimal places for INR
4. THE Currency_System SHALL display currency code (USD/INR) alongside the formatted price
5. THE Currency_System SHALL apply consistent formatting across all property cards, detail pages, and brochures

### Requirement 19: CAPTCHA Implementation

**User Story:** As a platform administrator, I want CAPTCHA verification to be user-friendly yet secure, so that legitimate users are not frustrated while bots are blocked.

#### Acceptance Criteria

1. THE Verification_System SHALL use Google reCAPTCHA v3 for invisible bot detection
2. WHEN reCAPTCHA score is below 0.5, THE Verification_System SHALL present a reCAPTCHA v2 checkbox challenge
3. THE Verification_System SHALL validate the CAPTCHA token on the backend before processing registration
4. THE Verification_System SHALL reject registration if CAPTCHA validation fails with error message "Verification failed. Please try again."
5. THE Verification_System SHALL expire CAPTCHA tokens after 2 minutes

### Requirement 20: Email Verification Flow

**User Story:** As a new user, I want a clear email verification process, so that I can activate my account and start using the platform.

#### Acceptance Criteria

1. WHEN a user registers, THE Verification_System SHALL send an email with subject "Verify Your Estate Bridge Account"
2. THE email SHALL contain a verification link with format: {platform_url}/verify-email?token={Verification_Token}
3. WHEN a user clicks the verification link, THE Verification_System SHALL validate the token and mark the account as verified
4. IF the token is expired or invalid, THEN THE Verification_System SHALL display an error and offer to resend verification email
5. WHEN verification succeeds, THE Verification_System SHALL redirect the user to the login page with a success message
