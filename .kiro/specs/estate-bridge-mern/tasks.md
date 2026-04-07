# Implementation Plan: Estate Bridge MERN Platform

## Overview

This implementation plan breaks down the Estate Bridge platform into discrete, sequential coding tasks. The platform uses React.js + TypeScript for the frontend, Express.js/Node.js + TypeScript for the backend, and Firebase (Auth, Firestore, Storage) for infrastructure. Each task builds incrementally, with property-based tests and unit tests marked as optional sub-tasks.

## Tasks

- [ ] 1. Project setup and infrastructure
  - [x] 1.1 Initialize backend project structure
    - Create Express.js + TypeScript project with folder structure (controllers, services, repositories, middleware, validators, models, utils, config)
    - Install dependencies: express, typescript, firebase-admin, helmet, cors, express-rate-limit, morgan, winston, joi, dotenv
    - Configure TypeScript with strict mode and path aliases
    - Set up ESLint and Prettier with TypeScript rules
    - Create .env.example with all required environment variables
    - _Requirements: 1.1, 1.2, 3.1_

  - [x] 1.2 Initialize frontend project structure
    - Create React + TypeScript project using Vite
    - Install dependencies: react, react-router-dom, redux-toolkit, react-query, axios, firebase, react-hook-form, zod, material-ui or tailwind
    - Configure TypeScript with strict mode
    - Set up folder structure (components, pages, features, services, hooks, utils, types, config, constants)
    - Configure ESLint and Prettier
    - _Requirements: 1.1, 4.1_

  - [x] 1.3 Configure Firebase projects
    - Create Firebase project for development environment
    - Enable Firebase Authentication with email/password provider
    - Create Firestore database with initial collections structure
    - Enable Firebase Storage with folder structure for property images
    - Generate service account credentials for backend
    - Configure Firebase SDK in both frontend and backend
    - _Requirements: 1.1, 1.2, 3.1, 3.2_

  - [x] 1.4 Set up testing infrastructure
    - Install Jest and testing libraries for backend (jest, supertest, @types/jest)
    - Install Jest and React Testing Library for frontend
    - Install fast-check for property-based testing
    - Configure Jest with TypeScript support
    - Create test utilities and factories for generating test data
    - Set up test database configuration
    - _Requirements: All_


- [ ] 2. Backend core infrastructure
  - [x] 2.1 Implement error handling middleware
    - Create custom error classes (ValidationError, AuthenticationError, AuthorizationError, NotFoundError, DatabaseError)
    - Implement centralized error handling middleware with consistent error response format
    - Add error logging with Winston
    - Configure different error responses for development vs production
    - _Requirements: 1.3, 3.3, 5.2, 6.2_

  - [x] 2.2 Implement logging and monitoring
    - Configure Winston logger with multiple transports (console, file)
    - Create structured logging format with context (userId, requestId, timestamp)
    - Add Morgan HTTP request logging middleware
    - Implement health check endpoint (/api/v1/health)
    - _Requirements: All_

  - [x] 2.3 Implement security middleware
    - Configure Helmet for security headers (CSP, XSS protection, HSTS)
    - Configure CORS with whitelist of allowed origins
    - Implement rate limiting middleware (100 req/15min global, 5 req/15min for auth endpoints)
    - Add request body size limits
    - _Requirements: 1.1, 1.3, 1.5_

  - [x] 2.4 Create Firebase Admin SDK initialization
    - Initialize Firebase Admin SDK with service account credentials
    - Create singleton instance for Firestore, Auth, and Storage
    - Implement connection error handling and retry logic
    - _Requirements: 1.1, 1.2, 3.1, 3.2_


- [ ] 3. Authentication and authorization (Backend)
  - [x] 3.1 Implement authentication middleware
    - Create middleware to verify Firebase Auth tokens from request headers
    - Extract user ID from verified token and attach to request object
    - Handle token expiration and invalid token errors
    - _Requirements: 1.4, 1.5, 2.1, 2.4_

  - [ ]* 3.2 Write property test for authentication middleware
    - **Property 3: Valid Login Authentication**
    - **Validates: Requirements 1.4**

  - [x] 3.3 Implement RBAC middleware
    - Create middleware to fetch user role from Firestore
    - Implement role checking functions (requireSeller, requireBuyer)
    - Return 403 Forbidden for insufficient permissions
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 3.4 Write property test for RBAC middleware
    - **Property 7: Buyer Route Access Control**
    - **Property 8: Seller Route Access Control**
    - **Validates: Requirements 2.2, 2.3**

  - [x] 3.5 Implement Auth Service
    - Create registerUser function (create Firebase Auth account, store user profile in Firestore)
    - Create loginUser function (verify credentials via Firebase Auth)
    - Create getCurrentUser function (fetch user profile from Firestore)
    - Create logoutUser function (revoke Firebase Auth token)
    - Implement password validation (min 8 chars, uppercase, lowercase, number)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 3.6 Write property tests for Auth Service
    - **Property 1: User Registration Round-Trip**
    - **Property 2: Invalid Registration Rejection**
    - **Property 4: Invalid Login Rejection**
    - **Property 5: Logout Session Termination**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 1.6**

  - [x] 3.7 Implement Auth Controller and routes
    - Create POST /api/v1/auth/register endpoint
    - Create POST /api/v1/auth/login endpoint
    - Create POST /api/v1/auth/logout endpoint
    - Create GET /api/v1/auth/me endpoint
    - Add request validation with Joi/Zod schemas
    - _Requirements: 1.1, 1.4, 1.6_

  - [ ]* 3.8 Write integration tests for Auth endpoints
    - Test registration with valid and invalid data
    - Test login with valid and invalid credentials
    - Test logout and session termination
    - Test getCurrentUser with and without authentication
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_


- [ ] 4. Property management (Backend)
  - [x] 4.1 Implement Property Repository
    - Create Firestore CRUD operations for properties collection
    - Implement create, findById, findBySellerId, update, delete methods
    - Add query methods with filters (region, price range, property type, status)
    - Implement pagination with cursor-based approach
    - _Requirements: 3.1, 3.4, 3.5, 3.7, 4.1, 4.2, 4.3, 4.4_

  - [x] 4.2 Implement Property Service
    - Create createProperty function with validation
    - Create updateProperty function with ownership verification
    - Create deleteProperty function with ownership verification and image cleanup
    - Create getPropertyById function
    - Create getPropertiesBySeller function
    - Implement property status transitions (available, under_offer, sold)
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 4.3 Write property tests for Property Service
    - **Property 11: Property Creation Round-Trip**
    - **Property 13: Property Creation Validation**
    - **Property 14: Property Update Persistence**
    - **Property 15: Property Deletion Cleanup**
    - **Property 16: Property Status Transitions**
    - **Property 17: Seller Property Isolation**
    - **Validates: Requirements 3.1, 3.3, 3.4, 3.5, 3.6, 3.7**

  - [x] 4.3 Implement image upload service
    - Create uploadImages function to upload files to Firebase Storage
    - Generate unique file names and organize by property ID
    - Return public URLs for uploaded images
    - Implement deleteImage function to remove images from Storage
    - Validate file types (JPEG, PNG, WebP) and size (max 5MB)
    - Enforce maximum 10 images per property
    - _Requirements: 3.2, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 4.4 Write property tests for image upload service
    - **Property 12: Property Image Upload Storage**
    - **Property 40: Image Format Validation**
    - **Property 41: Image Size Validation**
    - **Property 42: Image Count Limit**
    - **Property 43: Image Deletion Cleanup**
    - **Validates: Requirements 3.2, 11.1, 11.2, 11.3, 11.4, 11.5**

  - [x] 4.5 Implement Property Controller and routes
    - Create POST /api/v1/properties endpoint (seller only)
    - Create GET /api/v1/properties/:id endpoint
    - Create PUT /api/v1/properties/:id endpoint (seller only, ownership check)
    - Create DELETE /api/v1/properties/:id endpoint (seller only, ownership check)
    - Create GET /api/v1/properties/seller/me endpoint (seller only)
    - Create POST /api/v1/properties/:id/images endpoint (seller only, with multer)
    - Create DELETE /api/v1/properties/:id/images endpoint (seller only)
    - Add request validation schemas
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.7, 11.1, 11.5_

  - [ ]* 4.6 Write integration tests for Property endpoints
    - Test property creation with valid and invalid data
    - Test property update with ownership verification
    - Test property deletion with image cleanup
    - Test image upload with format and size validation
    - Test seller property isolation
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.7, 11.1, 11.2, 11.3, 11.4, 11.5_


- [ ] 5. Search and filtering (Backend)
  - [x] 5.1 Implement Search Service
    - Create searchProperties function with multiple filter support (region, price range, property type, keyword, status)
    - Implement keyword search in title and description (case-insensitive)
    - Add pagination and sorting (by price, createdAt)
    - Create getAvailableProperties function (status = "available")
    - Optimize Firestore queries with composite indexes
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 10.1, 10.2_

  - [ ]* 5.2 Write property tests for Search Service
    - **Property 18: Available Property Filtering**
    - **Property 19: Region Filter Accuracy**
    - **Property 20: Price Range Filter Accuracy**
    - **Property 21: Property Type Filter Accuracy**
    - **Property 22: Keyword Search Case-Insensitivity**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 10.1, 10.2**

  - [x] 5.3 Implement Region Service
    - Create getRegions function to fetch all active regions from Firestore
    - Create region repository with CRUD operations
    - Seed initial regions data in Firestore
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 5.4 Write property test for Region Service
    - **Property 39: Region Selector Completeness**
    - **Validates: Requirements 10.3, 10.4**

  - [x] 5.5 Implement Search Controller and routes
    - Create GET /api/v1/search/properties endpoint with query parameters
    - Create GET /api/v1/search/regions endpoint
    - Add request validation for search filters
    - Return paginated response format
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 10.1, 10.2, 10.3_

  - [ ]* 5.6 Write integration tests for Search endpoints
    - Test search with various filter combinations
    - Test keyword search case-insensitivity
    - Test pagination and sorting
    - Test region filtering
    - Test "no results found" scenario
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 10.1, 10.2_


- [ ] 6. Appointments (Backend)
  - [x] 6.1 Implement Appointment Repository
    - Create Firestore CRUD operations for appointments collection
    - Implement create, findById, findByBuyer, findBySeller, update methods
    - Add query methods with status filters
    - Implement checkDuplicateAppointment function
    - _Requirements: 5.1, 5.2, 5.5, 5.6_

  - [x] 6.2 Implement Appointment Service
    - Create createAppointment function with duplicate prevention
    - Create updateAppointmentStatus function (confirm, decline, cancel)
    - Create getAppointmentsByBuyer function
    - Create getAppointmentsBySeller function
    - Validate requested date/time is in the future
    - Verify user authorization for status updates
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 6.3 Write property tests for Appointment Service
    - **Property 24: Appointment Creation Round-Trip**
    - **Property 25: Appointment Duplicate Prevention**
    - **Property 26: Appointment Status Transitions**
    - **Property 27: Seller Appointment Visibility**
    - **Property 28: Buyer Appointment Visibility**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**

  - [x] 6.4 Implement Appointment Controller and routes
    - Create POST /api/v1/appointments endpoint (buyer only)
    - Create GET /api/v1/appointments/buyer/me endpoint (buyer only)
    - Create GET /api/v1/appointments/seller/me endpoint (seller only)
    - Create PATCH /api/v1/appointments/:id endpoint (buyer or seller, authorization check)
    - Add request validation schemas
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 6.5 Write integration tests for Appointment endpoints
    - Test appointment creation with duplicate prevention
    - Test appointment status updates by seller and buyer
    - Test buyer and seller appointment retrieval
    - Test authorization for status updates
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_


- [ ] 7. Feedback and reviews (Backend)
  - [x] 7.1 Implement Feedback Repository
    - Create Firestore CRUD operations for feedback collection
    - Implement create, findByListing, checkExistingFeedback methods
    - Add query to calculate average rating for a listing
    - _Requirements: 6.1, 6.3, 6.5, 6.6_

  - [x] 7.2 Implement Feedback Service
    - Create submitFeedback function with uniqueness check
    - Create getFeedbackByListing function
    - Create getAverageRating function
    - Validate rating (1-5) and comment length (max 500 chars)
    - Prevent duplicate feedback per buyer/listing combination
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 7.3 Write property tests for Feedback Service
    - **Property 29: Feedback Submission Round-Trip**
    - **Property 30: Feedback Validation**
    - **Property 31: Feedback Uniqueness Per Listing**
    - **Property 32: Feedback Retrieval Completeness**
    - **Property 33: Average Rating Calculation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

  - [x] 7.4 Implement Feedback Controller and routes
    - Create POST /api/v1/feedback endpoint (buyer only)
    - Create GET /api/v1/feedback/listing/:id endpoint
    - Create GET /api/v1/feedback/listing/:id/rating endpoint
    - Add request validation schemas
    - _Requirements: 6.1, 6.5, 6.6_

  - [ ]* 7.5 Write integration tests for Feedback endpoints
    - Test feedback submission with validation
    - Test duplicate feedback prevention
    - Test feedback retrieval by listing
    - Test average rating calculation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_


- [x] 8. AI Support (Backend)
  - [x] 8.1 Implement AI Support Service
    - Create sendMessage function to call external AI API
    - Implement conversation history management (store in Firestore or in-memory)
    - Add error handling and fallback messages for AI API failures
    - Implement timeout handling (10 seconds)
    - Create circuit breaker pattern for AI API resilience
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 8.2 Write property tests for AI Support Service
    - **Property 34: AI Support Role-Agnostic Access**
    - **Property 35: AI Support Message Processing**
    - **Property 36: AI Conversation History Persistence**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

  - [x] 8.3 Implement AI Support Controller and routes
    - Create POST /api/v1/ai-support/message endpoint
    - Create GET /api/v1/ai-support/conversation/:id endpoint
    - Create POST /api/v1/ai-support/conversation endpoint
    - Add request validation schemas
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [ ]* 8.4 Write integration tests for AI Support endpoints
    - Test message sending with mock AI API
    - Test conversation history retrieval
    - Test error handling for AI API failures
    - Test timeout handling
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_


- [x] 9. Dashboard statistics (Backend)
  - [x] 9.1 Implement Dashboard Service
    - Create getSellerDashboard function (total listings, active listings, pending/confirmed appointments, recent data)
    - Create getBuyerDashboard function (total appointments, pending/confirmed appointments, recent data)
    - Implement aggregation queries for statistics
    - Optimize queries with Firestore composite indexes
    - _Requirements: 8.1, 8.3, 9.1, 9.3_

  - [ ]* 9.2 Write property tests for Dashboard Service
    - **Property 37: Seller Dashboard Statistics Accuracy**
    - **Property 38: Buyer Dashboard Statistics Accuracy**
    - **Validates: Requirements 8.1, 8.3, 9.1, 9.3**

  - [x] 9.3 Implement Dashboard Controller and routes
    - Create GET /api/v1/dashboard/seller endpoint (seller only)
    - Create GET /api/v1/dashboard/buyer endpoint (buyer only)
    - _Requirements: 8.1, 8.2, 9.1, 9.2_

  - [ ]* 9.4 Write integration tests for Dashboard endpoints
    - Test seller dashboard statistics calculation
    - Test buyer dashboard statistics calculation
    - Test real-time updates via Firestore listeners
    - _Requirements: 8.1, 8.3, 9.1, 9.3_

- [x] 10. Checkpoint - Backend API complete
  - Ensure all backend tests pass
  - Verify all API endpoints are functional
  - Test authentication and authorization flows
  - Ask the user if questions arise


- [x] 11. Frontend core infrastructure
  - [x] 11.1 Set up routing and navigation
    - Configure React Router with protected routes
    - Create route guards for authentication (redirect to login if not authenticated)
    - Create route guards for RBAC (redirect based on role)
    - Implement lazy loading for route components
    - Create navigation component with role-based menu items
    - _Requirements: 1.7, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 11.2 Write property tests for route guards
    - **Property 6: Session Persistence**
    - **Property 9: Unauthenticated Route Protection**
    - **Property 10: Role-Based Navigation Display**
    - **Validates: Requirements 1.7, 2.4, 2.5**

  - [x] 11.3 Set up Redux store and slices
    - Configure Redux Toolkit store
    - Create auth slice (user, token, role, loading, error)
    - Create UI slice (theme, notifications, loading states)
    - Implement Redux persist for auth state
    - _Requirements: 1.7, 2.1_

  - [x] 11.4 Set up React Query
    - Configure QueryClient with caching strategy
    - Create API service layer with Axios
    - Implement Axios interceptors for authentication (attach token to headers)
    - Implement Axios interceptors for error handling
    - _Requirements: 1.4, 1.7, 4.1_

  - [x] 11.5 Create common UI components
    - Create Button, Input, Select, Textarea components
    - Create Card, Modal, Toast notification components
    - Create Loading spinner and Skeleton loader components
    - Create ErrorBoundary component
    - Ensure all components are accessible (ARIA labels, keyboard navigation)
    - _Requirements: All_

  - [x] 11.6 Implement Firebase client SDK
    - Initialize Firebase client SDK with configuration
    - Create auth service wrapper for Firebase Auth
    - Create Firestore service wrapper for real-time listeners
    - _Requirements: 1.1, 1.4, 1.7, 8.3, 9.3_


- [x] 12. Authentication pages (Frontend)
  - [x] 12.1 Implement registration page
    - Create registration form with fields (email, password, full name, role selector)
    - Implement form validation with React Hook Form and Zod
    - Add client-side validation (email format, password strength, required fields)
    - Display validation errors inline
    - Call backend registration API on submit
    - Redirect to appropriate dashboard on success
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 12.2 Write unit tests for registration page
    - Test form validation with valid and invalid inputs
    - Test API call on form submission
    - Test error display
    - Test redirect on success
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 12.3 Implement login page
    - Create login form with fields (email, password)
    - Implement form validation
    - Call backend login API on submit
    - Store auth token and user data in Redux
    - Redirect to role-appropriate dashboard on success
    - Display authentication errors
    - _Requirements: 1.4, 1.5, 2.2, 2.3_

  - [ ]* 12.4 Write unit tests for login page
    - Test form validation
    - Test API call and token storage
    - Test role-based redirect
    - Test error display
    - _Requirements: 1.4, 1.5_

  - [x] 12.5 Implement logout functionality
    - Create logout action in Redux
    - Call backend logout API
    - Clear auth state and redirect to login page
    - _Requirements: 1.6_


- [x] 13. Property management pages (Frontend - Seller)
  - [x] 13.1 Implement property creation page
    - Create property form with fields (title, description, price, region, address, property type, status)
    - Implement form validation with React Hook Form and Zod
    - Add image upload component with preview (max 10 images, 5MB each, JPEG/PNG/WebP)
    - Validate image format and size on client side
    - Call backend property creation API
    - Display success message and redirect to seller dashboard
    - _Requirements: 3.1, 3.2, 3.3, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 13.2 Write unit tests for property creation page
    - Test form validation
    - Test image upload validation
    - Test API call on form submission
    - Test error display
    - _Requirements: 3.1, 3.2, 3.3, 11.1, 11.2, 11.3, 11.4_

  - [x] 13.3 Implement property edit page
    - Pre-populate form with existing property data
    - Allow updating all fields including images
    - Support adding and removing images
    - Call backend property update API
    - Display success message
    - _Requirements: 3.4, 3.6, 11.5_

  - [ ]* 13.4 Write unit tests for property edit page
    - Test form pre-population
    - Test update API call
    - Test image management
    - _Requirements: 3.4, 3.6, 11.5_

  - [x] 13.5 Implement seller property list page
    - Display all properties owned by seller in a table/grid
    - Show property status, title, price, region
    - Add action buttons (edit, delete, view)
    - Implement delete confirmation modal
    - Call backend delete API and refresh list
    - Use React Query for data fetching and caching
    - _Requirements: 3.5, 3.7_

  - [ ]* 13.6 Write unit tests for seller property list page
    - Test property list rendering
    - Test delete confirmation and API call
    - Test navigation to edit page
    - _Requirements: 3.5, 3.7_


- [x] 14. Property browsing and search (Frontend - Buyer)
  - [x] 14.1 Implement property browse page
    - Display all available properties in a grid layout
    - Show property card with image, title, price, region
    - Implement lazy loading for images
    - Add pagination controls
    - Use React Query for data fetching
    - _Requirements: 4.1, 4.7_

  - [ ]* 14.2 Write unit tests for property browse page
    - Test property grid rendering
    - Test pagination
    - Test navigation to property detail
    - _Requirements: 4.1, 4.7_

  - [x] 14.3 Implement search and filter component
    - Create filter form with region selector, price range inputs, property type selector, keyword search
    - Fetch regions from backend API
    - Apply filters on form submission
    - Display active filters with clear buttons
    - Show "no results found" message when applicable
    - Preserve filter state in URL query parameters
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 10.1, 10.2, 10.3, 10.4_

  - [ ]* 14.4 Write property tests for search filters
    - **Property 23: Property Detail Completeness**
    - **Validates: Requirements 4.7**

  - [x] 14.5 Implement property detail page
    - Display all property information (title, description, price, region, address, property type, status)
    - Show image gallery with navigation
    - Display seller information
    - Show feedback and average rating
    - Add "Book Appointment" button (buyer only)
    - Fetch property data from backend API
    - _Requirements: 4.7, 6.5, 6.6_

  - [ ]* 14.6 Write unit tests for property detail page
    - Test property data rendering
    - Test image gallery
    - Test feedback display
    - Test appointment booking button
    - _Requirements: 4.7, 6.5, 6.6_


- [x] 15. Appointments (Frontend)
  - [x] 15.1 Implement appointment booking modal (Buyer)
    - Create modal with date/time picker
    - Validate requested date/time is in the future
    - Call backend appointment creation API
    - Display success message or error (duplicate appointment)
    - Close modal on success
    - _Requirements: 5.1, 5.2_

  - [ ]* 15.2 Write unit tests for appointment booking modal
    - Test date/time validation
    - Test API call
    - Test duplicate appointment error handling
    - _Requirements: 5.1, 5.2_

  - [x] 15.3 Implement buyer appointments page
    - Display all appointments submitted by buyer
    - Show appointment status (pending, confirmed, declined, cancelled)
    - Display property information and requested date/time
    - Add cancel button for confirmed appointments
    - Use Firestore real-time listener for live updates
    - _Requirements: 5.6, 5.7_

  - [ ]* 15.4 Write unit tests for buyer appointments page
    - Test appointments list rendering
    - Test status display
    - Test cancel functionality
    - _Requirements: 5.6, 5.7_

  - [x] 15.5 Implement seller appointments page
    - Display all appointments for seller's properties
    - Show appointment status and buyer information
    - Add accept and decline buttons for pending appointments
    - Call backend API to update appointment status
    - Use Firestore real-time listener for live updates
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ]* 15.6 Write unit tests for seller appointments page
    - Test appointments list rendering
    - Test accept/decline functionality
    - Test real-time updates
    - _Requirements: 5.3, 5.4, 5.5_


- [x] 16. Feedback and reviews (Frontend)
  - [x] 16.1 Implement feedback submission form (Buyer)
    - Create feedback form with rating selector (1-5 stars) and comment textarea
    - Implement form validation (rating required, comment max 500 chars)
    - Call backend feedback submission API
    - Display success message or error (duplicate feedback)
    - Disable form after successful submission
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 16.2 Write unit tests for feedback submission form
    - Test form validation
    - Test API call
    - Test duplicate feedback error handling
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 16.3 Implement feedback display component
    - Display all feedback entries for a property
    - Show buyer name, rating, comment, and timestamp
    - Display average rating prominently
    - Use Firestore real-time listener for live updates
    - _Requirements: 6.5, 6.6_

  - [ ]* 16.4 Write unit tests for feedback display component
    - Test feedback list rendering
    - Test average rating calculation display
    - Test real-time updates
    - _Requirements: 6.5, 6.6_


- [x] 17. AI Support (Frontend)
  - [x] 17.1 Implement AI support chat interface
    - Create chat UI with message list and input field
    - Display user and AI messages with different styling
    - Implement message sending functionality
    - Show loading indicator while waiting for AI response
    - Display error message if AI API fails
    - Maintain conversation history in component state
    - Make accessible to both buyers and sellers
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 17.2 Write unit tests for AI support chat
    - Test message sending
    - Test message display
    - Test error handling
    - Test conversation history
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 17.3 Implement conversation persistence
    - Store conversation history in session storage
    - Restore conversation when returning to AI support page
    - Clear conversation on logout
    - _Requirements: 7.5_

  - [ ]* 17.4 Write unit tests for conversation persistence
    - Test conversation storage
    - Test conversation restoration
    - Test conversation clearing
    - _Requirements: 7.5_


- [x] 18. Dashboard pages (Frontend)
  - [x] 18.1 Implement seller dashboard
    - Display statistics cards (total listings, active listings, pending appointments, confirmed appointments)
    - Show recent appointments list
    - Show recent listings list
    - Add navigation links to property management, appointments, feedback
    - Use Firestore real-time listeners for live statistics updates
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 18.2 Write unit tests for seller dashboard
    - Test statistics display
    - Test recent data rendering
    - Test navigation links
    - Test real-time updates
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 18.3 Implement buyer dashboard
    - Display statistics cards (total appointments, pending appointments, confirmed appointments)
    - Show recent appointments list
    - Add navigation links to property browsing, appointments, feedback
    - Use Firestore real-time listeners for live statistics updates
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 18.4 Write unit tests for buyer dashboard
    - Test statistics display
    - Test recent data rendering
    - Test navigation links
    - Test real-time updates
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 19. Checkpoint - Frontend implementation complete
  - Ensure all frontend tests pass
  - Verify all pages are functional and accessible
  - Test authentication and authorization flows
  - Test real-time updates via Firestore listeners
  - Ask the user if questions arise


- [x] 20. Firebase configuration
  - [x] 20.1 Create Firestore Security Rules
    - Implement authentication checks (isAuthenticated, isOwner, hasRole)
    - Define rules for users collection (read: authenticated, create/update: owner only)
    - Define rules for properties collection (read: authenticated, create: seller only, update/delete: owner seller only)
    - Define rules for appointments collection (read: buyer or seller involved, create: buyer only, update: involved parties only)
    - Define rules for feedback collection (read: authenticated, create: buyer only, immutable after creation)
    - Define rules for regions collection (read: public, write: admin only)
    - Deploy rules to Firebase project
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.4, 3.5, 5.1, 6.1_

  - [x] 20.2 Create Firestore indexes
    - Create composite index on properties: (status, region, price)
    - Create composite index on properties: (sellerId, createdAt)
    - Create composite index on appointments: (sellerId, status)
    - Create composite index on appointments: (buyerId, status)
    - Create composite index on feedback: (listingId, createdAt)
    - Deploy indexes to Firebase project
    - _Requirements: 3.7, 4.1, 4.2, 4.3, 5.5, 5.6_

  - [x] 20.3 Create Firebase Storage Security Rules
    - Allow authenticated users to read all images
    - Allow only sellers to upload images to their property folders
    - Allow only sellers to delete images from their property folders
    - Validate file size (max 5MB) and type (JPEG, PNG, WebP)
    - Deploy rules to Firebase project
    - _Requirements: 3.2, 11.1, 11.2, 11.3, 11.5_

  - [x] 20.4 Seed initial data
    - Create seed script to populate regions collection
    - Create seed script for test users (buyer and seller)
    - Create seed script for sample properties
    - Run seed scripts on development environment
    - _Requirements: 10.3, 10.4_


- [ ] 21. Integration and end-to-end testing
  - [ ] 21.1 Set up E2E testing framework
    - Install Playwright or Cypress
    - Configure E2E test environment
    - Create test utilities and helpers
    - Set up test data factories
    - _Requirements: All_

  - [ ]* 21.2 Write E2E tests for buyer journey
    - Test complete buyer flow: register → login → browse properties → search/filter → view property detail → book appointment → submit feedback
    - Test real-time appointment status updates
    - Test AI support interaction
    - _Requirements: 1.1, 1.4, 4.1, 4.2, 4.7, 5.1, 6.1, 7.1_

  - [ ]* 21.3 Write E2E tests for seller journey
    - Test complete seller flow: register → login → create property → upload images → manage appointments → view dashboard
    - Test property update and deletion
    - Test real-time appointment notifications
    - _Requirements: 1.1, 1.4, 3.1, 3.2, 3.4, 3.5, 5.3, 5.4, 8.1_

  - [ ]* 21.4 Write E2E tests for authentication and authorization
    - Test login with valid and invalid credentials
    - Test session persistence across page refreshes
    - Test role-based route protection
    - Test logout and session termination
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4_

  - [ ]* 21.5 Write E2E tests for real-time features
    - Test dashboard statistics updates when data changes
    - Test appointment status updates in real-time
    - Test feedback display updates in real-time
    - _Requirements: 5.5, 5.6, 6.5, 8.3, 9.3_


- [ ] 22. Deployment and CI/CD
  - [ ] 22.1 Create Docker configuration
    - Create Dockerfile for backend with multi-stage build
    - Create Dockerfile for frontend with Nginx
    - Create docker-compose.yml for local development
    - Add health check endpoints
    - _Requirements: All_

  - [ ] 22.2 Set up environment configuration
    - Create .env.example files for backend and frontend
    - Document all required environment variables
    - Set up environment-specific configurations (development, staging, production)
    - Configure Firebase projects for each environment
    - _Requirements: All_

  - [ ] 22.3 Create CI/CD pipeline
    - Set up GitHub Actions or GitLab CI workflow
    - Add lint and type-check steps
    - Add unit test execution step
    - Add integration test execution step
    - Add build step for backend and frontend
    - Add security audit step (npm audit)
    - Configure deployment to staging on develop branch
    - Configure deployment to production on main branch (with manual approval)
    - _Requirements: All_

  - [ ] 22.4 Deploy to staging environment
    - Deploy backend to Cloud Run or similar service
    - Deploy frontend to Firebase Hosting or similar service
    - Configure custom domain and SSL certificates
    - Set up monitoring and logging (Google Cloud Monitoring, Sentry)
    - Configure alerts for errors and performance issues
    - _Requirements: All_

  - [ ] 22.5 Create deployment documentation
    - Document deployment process
    - Document environment setup
    - Document rollback procedures
    - Document monitoring and alerting setup
    - _Requirements: All_


- [ ] 23. Documentation and polish
  - [ ] 23.1 Create API documentation
    - Write OpenAPI/Swagger specification for all endpoints
    - Document request/response schemas
    - Provide example requests and responses
    - Document error codes and messages
    - Set up Swagger UI for interactive API exploration
    - _Requirements: All_

  - [ ] 23.2 Create developer documentation
    - Write comprehensive README with project overview, setup instructions, and usage
    - Document project structure and architecture
    - Document coding standards and conventions
    - Create contributing guidelines
    - Document testing strategy and how to run tests
    - _Requirements: All_

  - [ ] 23.3 Implement accessibility improvements
    - Add ARIA labels to all interactive elements
    - Ensure keyboard navigation works for all features
    - Test with screen readers
    - Verify color contrast ratios meet WCAG 2.1 Level AA
    - Add skip navigation links
    - _Requirements: All_

  - [ ] 23.4 Performance optimization
    - Implement code splitting for frontend routes
    - Add image lazy loading and optimization
    - Configure React Query caching strategy
    - Optimize Firestore queries with proper indexing
    - Add compression for API responses
    - Implement CDN for static assets
    - _Requirements: 4.1, 4.7, 8.1, 9.1_

  - [ ] 23.5 Security hardening
    - Review and test all security rules (Firestore, Storage)
    - Verify rate limiting is working correctly
    - Test CORS configuration
    - Verify input validation on all endpoints
    - Test authentication and authorization flows
    - Run security audit tools (npm audit, Snyk)
    - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.3, 3.1, 5.1, 6.1_

- [ ] 24. Final checkpoint - Production readiness
  - Ensure all tests pass (unit, integration, E2E, property-based)
  - Verify all features are working as expected
  - Test on multiple browsers and devices
  - Verify performance meets requirements
  - Verify security measures are in place
  - Review documentation completeness
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests verify component interactions
- E2E tests validate complete user workflows
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- All code should be written in TypeScript for type safety
- Follow the architecture and design patterns specified in the design document
- Ensure all Firebase operations follow security best practices
- Maintain consistent error handling and logging throughout the application

