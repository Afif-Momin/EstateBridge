# Requirements Document

## Introduction

Estate Bridge is a full-stack real estate platform built on a MERN-like architecture where Firebase replaces the traditional MongoDB/server layer. The platform enables property listing, search, and communication between buyers and sellers. Firestore serves as the real-time database, Firebase Auth handles authentication, Firebase Storage manages image assets, and Express.js/Node.js provides the API layer with React.js on the frontend.

## Glossary

- **Platform**: The Estate Bridge web application as a whole
- **Seller**: An authenticated user with the seller role who can list and manage properties
- **Buyer**: An authenticated user with the buyer role who can browse, search, and inquire about properties
- **Property**: A real estate listing containing details such as title, description, price, location, images, and status
- **Listing**: A Property record created and managed by a Seller
- **Firebase_Auth**: Firebase Authentication service used for user identity and session management
- **Firestore**: Firebase Firestore NoSQL real-time database used as the primary data store
- **Firebase_Storage**: Firebase Cloud Storage service used for property image uploads and retrieval
- **Auth_Service**: The application module responsible for registration, login, logout, and session handling via Firebase_Auth
- **Property_Service**: The application module responsible for property CRUD operations backed by Firestore
- **Search_Service**: The application module responsible for querying and filtering properties from Firestore
- **Appointment_Service**: The application module responsible for scheduling and managing appointments between Buyers and Sellers
- **Feedback_Service**: The application module responsible for collecting and displaying user feedback and reviews
- **AI_Support_Service**: The application module responsible for providing AI-powered support responses to users
- **Dashboard**: The role-specific home view presented to an authenticated user after login
- **RBAC**: Role-Based Access Control — the mechanism that restricts platform features based on a user's assigned role (Buyer or Seller)
- **Region**: A geographic area (city, province, or district) used to filter and categorize Properties

---

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a visitor, I want to register and log in using my email and password, so that I can access role-specific features of the platform.

#### Acceptance Criteria

1. THE Auth_Service SHALL support user registration with email, password, full name, and role selection (Buyer or Seller).
2. WHEN a visitor submits a valid registration form, THE Auth_Service SHALL create a Firebase_Auth account and store the user profile including role in Firestore.
3. WHEN a visitor submits an invalid registration form (missing fields, invalid email, or password under 8 characters), THE Auth_Service SHALL display a descriptive validation error without creating an account.
4. WHEN a registered user submits valid login credentials, THE Auth_Service SHALL authenticate the user via Firebase_Auth and redirect the user to the role-appropriate Dashboard.
5. WHEN a registered user submits invalid login credentials, THE Auth_Service SHALL display an authentication error message and retain the login form state.
6. WHEN an authenticated user requests logout, THE Auth_Service SHALL terminate the Firebase_Auth session and redirect the user to the login page.
7. WHILE a user session is active, THE Auth_Service SHALL persist the session across page refreshes using Firebase_Auth token management.

---

### Requirement 2: Role-Based Access Control

**User Story:** As a platform administrator, I want users to be restricted to features appropriate for their role, so that Buyers and Sellers cannot access each other's management functions.

#### Acceptance Criteria

1. THE Platform SHALL enforce RBAC by reading the authenticated user's role from Firestore on every protected route access.
2. WHEN a Buyer attempts to access a Seller-only route (such as property creation or listing management), THE Platform SHALL redirect the Buyer to the Buyer Dashboard.
3. WHEN a Seller attempts to access a Buyer-only route (such as appointment booking), THE Platform SHALL redirect the Seller to the Seller Dashboard.
4. WHEN an unauthenticated user attempts to access any protected route, THE Platform SHALL redirect the user to the login page.
5. THE Platform SHALL display navigation items conditionally based on the authenticated user's role.

---

### Requirement 3: Property Listing Management (Seller)

**User Story:** As a Seller, I want to create, update, and delete my property listings, so that I can manage the properties I offer to Buyers.

#### Acceptance Criteria

1. WHEN a Seller submits a valid property creation form, THE Property_Service SHALL store the Listing in Firestore with fields: title, description, price, region, address, property type, status, seller ID, and timestamp.
2. WHEN a Seller uploads images during property creation or editing, THE Property_Service SHALL upload the images to Firebase_Storage and store the resulting URLs in the Listing document in Firestore.
3. WHEN a Seller submits a property creation form with missing required fields (title, price, region, or address), THE Property_Service SHALL display a field-level validation error and not persist the Listing.
4. WHEN a Seller submits a valid property update form, THE Property_Service SHALL update the corresponding Listing document in Firestore and reflect changes in real time.
5. WHEN a Seller requests deletion of a Listing, THE Property_Service SHALL remove the Listing document from Firestore and delete all associated images from Firebase_Storage.
6. THE Property_Service SHALL allow a Seller to set a Listing status to "Available", "Under Offer", or "Sold".
7. WHILE a Seller is viewing the Seller Dashboard, THE Property_Service SHALL display only the Listings owned by that Seller, retrieved from Firestore in real time.

---

### Requirement 4: Property Search and Browsing (Buyer)

**User Story:** As a Buyer, I want to search and filter property listings, so that I can find properties that match my preferences.

#### Acceptance Criteria

1. THE Search_Service SHALL display all Listings with status "Available" to authenticated Buyers on the property browse page.
2. WHEN a Buyer applies a region filter, THE Search_Service SHALL return only Listings matching the selected Region from Firestore.
3. WHEN a Buyer applies a price range filter, THE Search_Service SHALL return only Listings where the price falls within the specified minimum and maximum values.
4. WHEN a Buyer applies a property type filter, THE Search_Service SHALL return only Listings matching the selected property type.
5. WHEN a Buyer enters a keyword in the search field, THE Search_Service SHALL return Listings whose title or description contains the keyword (case-insensitive).
6. WHEN no Listings match the applied filters, THE Search_Service SHALL display a "no results found" message and retain the current filter state.
7. WHEN a Buyer selects a Listing, THE Platform SHALL display a property detail page showing all Listing fields, images, and Seller contact options.

---

### Requirement 5: Appointments and Scheduling

**User Story:** As a Buyer, I want to request a viewing appointment with a Seller, so that I can schedule a time to visit a property.

#### Acceptance Criteria

1. WHEN a Buyer submits a valid appointment request for a Listing, THE Appointment_Service SHALL store the appointment in Firestore with fields: listing ID, buyer ID, seller ID, requested date/time, and status set to "Pending".
2. WHEN a Buyer submits an appointment request with a missing date/time or for a Listing the Buyer already has a pending appointment for, THE Appointment_Service SHALL display a descriptive error and not create a duplicate appointment.
3. WHEN a Seller accepts a pending appointment, THE Appointment_Service SHALL update the appointment status to "Confirmed" in Firestore.
4. WHEN a Seller declines a pending appointment, THE Appointment_Service SHALL update the appointment status to "Declined" in Firestore.
5. WHILE a Seller is viewing the Seller Dashboard, THE Appointment_Service SHALL display all pending and confirmed appointments for the Seller's Listings in real time via Firestore.
6. WHILE a Buyer is viewing the Buyer Dashboard, THE Appointment_Service SHALL display all appointments submitted by that Buyer with their current status in real time via Firestore.
7. WHEN a Buyer or Seller cancels a confirmed appointment, THE Appointment_Service SHALL update the appointment status to "Cancelled" in Firestore.

---

### Requirement 6: Feedback and Reviews

**User Story:** As a Buyer, I want to leave feedback on a property or Seller, so that other Buyers can make informed decisions.

#### Acceptance Criteria

1. WHEN a Buyer submits a valid feedback form for a Listing, THE Feedback_Service SHALL store the feedback in Firestore with fields: listing ID, buyer ID, rating (1–5), comment, and timestamp.
2. WHEN a Buyer submits a feedback form with a missing rating or comment exceeding 500 characters, THE Feedback_Service SHALL display a validation error and not persist the feedback.
3. THE Feedback_Service SHALL allow a Buyer to submit at most one feedback entry per Listing.
4. WHEN a Buyer attempts to submit a second feedback entry for the same Listing, THE Feedback_Service SHALL display an error indicating feedback has already been submitted for that Listing.
5. WHEN a Listing detail page is loaded, THE Feedback_Service SHALL retrieve and display all feedback entries for that Listing from Firestore in real time.
6. THE Feedback_Service SHALL calculate and display the average rating for a Listing based on all submitted feedback entries.

---

### Requirement 7: AI Support Page

**User Story:** As a user, I want to interact with an AI support assistant, so that I can get answers to platform and real estate related questions without contacting human support.

#### Acceptance Criteria

1. THE AI_Support_Service SHALL provide a chat interface accessible to all authenticated users regardless of role.
2. WHEN an authenticated user submits a message to the AI support chat, THE AI_Support_Service SHALL send the message to the configured AI API and display the response within 10 seconds.
3. IF the AI API returns an error or times out, THEN THE AI_Support_Service SHALL display a descriptive fallback error message and allow the user to retry.
4. THE AI_Support_Service SHALL maintain the conversation history within the current session so that context is preserved across multiple messages.
5. WHEN a user navigates away from the AI Support page and returns within the same session, THE AI_Support_Service SHALL restore the conversation history for that session.

---

### Requirement 8: Seller Dashboard

**User Story:** As a Seller, I want a dedicated dashboard, so that I can manage my listings, appointments, and account from a single view.

#### Acceptance Criteria

1. WHILE a Seller is authenticated, THE Dashboard SHALL display a summary of the Seller's total active Listings, pending appointments, and confirmed appointments retrieved from Firestore in real time.
2. THE Dashboard SHALL provide navigation to property listing management, appointment management, feedback received, and account settings.
3. WHEN a Seller's Listing receives a new appointment request, THE Dashboard SHALL reflect the updated pending appointment count in real time via Firestore.

---

### Requirement 9: Buyer Dashboard

**User Story:** As a Buyer, I want a dedicated dashboard, so that I can track my saved properties, appointments, and activity from a single view.

#### Acceptance Criteria

1. WHILE a Buyer is authenticated, THE Dashboard SHALL display a summary of the Buyer's submitted appointments and their statuses retrieved from Firestore in real time.
2. THE Dashboard SHALL provide navigation to property browsing, appointment history, submitted feedback, and account settings.
3. WHEN an appointment status changes (confirmed, declined, or cancelled), THE Dashboard SHALL reflect the updated status in real time via Firestore.

---

### Requirement 10: Region and Location-Based Filtering

**User Story:** As a Buyer, I want to filter properties by region or location, so that I can narrow my search to areas I am interested in.

#### Acceptance Criteria

1. THE Search_Service SHALL support filtering Listings by a predefined list of Regions stored in Firestore.
2. WHEN a Buyer selects a Region from the filter, THE Search_Service SHALL query Firestore and return only Listings tagged with that Region.
3. THE Platform SHALL display a region selector component populated with all available Regions from Firestore on the property browse page.
4. WHEN a new Region is added to Firestore by an administrator, THE Platform SHALL reflect the new Region in the region selector without requiring a frontend deployment.

---

### Requirement 11: Image Upload and Management

**User Story:** As a Seller, I want to upload multiple images for a property listing, so that Buyers can view the property visually before scheduling a visit.

#### Acceptance Criteria

1. THE Property_Service SHALL accept image uploads in JPEG, PNG, and WebP formats only.
2. WHEN a Seller uploads an image file exceeding 5MB, THE Property_Service SHALL display a file size error and reject the upload.
3. WHEN a Seller uploads an image in an unsupported format, THE Property_Service SHALL display a format error and reject the upload.
4. THE Property_Service SHALL allow a Seller to upload a maximum of 10 images per Listing.
5. WHEN a Seller removes an image from a Listing, THE Property_Service SHALL delete the image from Firebase_Storage and remove the URL from the Listing document in Firestore.
6. WHEN images are successfully uploaded, THE Property_Service SHALL display image previews to the Seller before the Listing is saved.
