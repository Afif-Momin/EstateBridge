# Authentication and Authorization Middleware

This directory contains middleware for authentication and authorization in the Estate Bridge backend.

## Table of Contents

1. [Authentication Middleware](#authentication-middleware-authts)
2. [RBAC Middleware](#rbac-middleware-rbacts)
3. [Complete Usage Examples](#complete-usage-examples)

## Authentication Middleware (`auth.ts`)

### Overview

The authentication middleware provides two functions for verifying Firebase Auth tokens:

1. **`authenticate`** - Required authentication (blocks requests without valid tokens)
2. **`optionalAuth`** - Optional authentication (allows requests with or without tokens)

### Usage

#### Required Authentication

Use the `authenticate` middleware to protect routes that require a logged-in user:

```typescript
import { authenticate } from './middleware/auth';
import { Router } from 'express';

const router = Router();

// Protect a route - only authenticated users can access
router.get('/api/v1/properties/seller/me', authenticate, getMyProperties);
router.post('/api/v1/properties', authenticate, createProperty);
router.delete('/api/v1/properties/:id', authenticate, deleteProperty);
```

#### Optional Authentication

Use the `optionalAuth` middleware for routes that work with or without authentication:

```typescript
import { optionalAuth } from './middleware/auth';

// Route works for both authenticated and unauthenticated users
router.get('/api/v1/properties', optionalAuth, getAllProperties);
router.get('/api/v1/properties/:id', optionalAuth, getPropertyById);
```

### How It Works

#### `authenticate` Middleware

1. **Extracts Token**: Reads the `Authorization` header and extracts the Bearer token
2. **Verifies Token**: Uses Firebase Admin Auth to verify the token
3. **Attaches User Info**: Adds `userId` and `userEmail` to the request object
4. **Error Handling**: Returns 401 errors for missing, invalid, or expired tokens

**Request Flow:**
```
Client Request
    ↓
Authorization: Bearer <token>
    ↓
authenticate middleware
    ↓
Firebase Admin Auth verifyIdToken()
    ↓
Success: req.userId & req.userEmail attached
    ↓
Next middleware/route handler
```

#### `optionalAuth` Middleware

1. **Checks for Token**: Looks for an `Authorization` header
2. **If Present**: Attempts to verify the token and attach user info
3. **If Missing/Invalid**: Continues without authentication (no error thrown)
4. **Use Case**: Routes that provide different data based on authentication status

### Request Object Extensions

After authentication, the request object is extended with:

```typescript
interface AuthenticatedRequest extends Request {
  userId?: string;      // Firebase Auth UID
  userEmail?: string;   // User's email address
  userRole?: 'buyer' | 'seller';  // Set by RBAC middleware
}
```

### Accessing User Information

In your route handlers, access the authenticated user information:

```typescript
import { AuthenticatedRequest } from '../types';

export const getMyProperties = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.userId;  // Available after authenticate middleware
  const email = req.userEmail;
  
  // Fetch user's properties
  const properties = await propertyService.getPropertiesBySeller(userId);
  
  res.json({ success: true, data: properties });
};
```

### Error Responses

#### Missing Authorization Header
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization header is required"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Invalid Format
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid authorization format. Expected: Bearer <token>"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Expired Token
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token has expired"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Invalid Token
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Client-Side Integration

#### Sending Authenticated Requests

```typescript
// Frontend: Attach Firebase Auth token to requests
import { getAuth } from 'firebase/auth';
import axios from 'axios';

const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const token = await user.getIdToken();
  
  const response = await axios.get('/api/v1/properties/seller/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}
```

#### Axios Interceptor (Recommended)

```typescript
// Automatically attach token to all requests
import axios from 'axios';
import { getAuth } from 'firebase/auth';

axios.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});
```

### Token Refresh

Firebase Auth tokens expire after 1 hour. The Firebase SDK automatically refreshes tokens:

```typescript
// Frontend: Get fresh token (automatically refreshed if needed)
const user = auth.currentUser;
const token = await user.getIdToken(/* forceRefresh */ false);
```

### Security Considerations

1. **HTTPS Only**: Always use HTTPS in production to protect tokens in transit
2. **Token Storage**: Store tokens securely (memory or httpOnly cookies, not localStorage)
3. **Token Expiration**: Tokens expire after 1 hour - handle 401 errors and refresh
4. **Rate Limiting**: Apply rate limiting to prevent brute force attacks
5. **Logging**: Authentication failures are logged for security monitoring

### Testing

The middleware includes comprehensive unit tests covering:

- ✅ Valid token authentication
- ✅ Missing authorization header
- ✅ Invalid authorization format
- ✅ Empty tokens
- ✅ Expired tokens
- ✅ Invalid tokens
- ✅ Unexpected errors
- ✅ Optional authentication scenarios

Run tests:
```bash
npm test -- auth.test.ts
```

### Related Middleware

- **RBAC Middleware** (`rbac.ts`) - Role-based access control (requires `authenticate` first)
- **Error Handler** (`errorHandler.ts`) - Centralized error handling
- **Rate Limiter** - API throttling (configured in `server.ts`)

### Example: Complete Route Protection

```typescript
import { Router } from 'express';
import { authenticate } from './middleware/auth';
import { requireSeller } from './middleware/rbac';
import { validatePropertyCreation } from './validators/property';

const router = Router();

// 1. Authenticate user
// 2. Check seller role
// 3. Validate request body
// 4. Execute route handler
router.post(
  '/api/v1/properties',
  authenticate,           // Step 1: Verify token
  requireSeller,          // Step 2: Check role
  validatePropertyCreation, // Step 3: Validate input
  createProperty          // Step 4: Handle request
);

export default router;
```

### Troubleshooting

#### "Authorization header is required"
- Ensure the client is sending the `Authorization` header
- Check that the header format is `Bearer <token>`

#### "Token has expired"
- Token expired after 1 hour
- Call `user.getIdToken(true)` to force refresh
- Implement automatic token refresh in your client

#### "Invalid token"
- Token is malformed or tampered with
- Ensure you're using the correct Firebase project
- Verify the service account credentials match the project

#### "Firebase Admin SDK not initialized"
- Check that Firebase is properly initialized in `config/firebase.ts`
- Verify environment variables are set correctly
- Check the service account key file exists

### Performance Considerations

- **Token Verification**: Firebase Admin SDK caches public keys (fast verification)
- **Network Calls**: First verification requires fetching public keys (~100ms)
- **Subsequent Calls**: Cached keys make verification very fast (~1-5ms)
- **Optimization**: Consider implementing a local token cache for high-traffic scenarios

### Logging

Authentication events are logged with context:

```typescript
// Successful authentication
logger.info('User authenticated', {
  userId: 'user-123',
  email: 'user@example.com',
  path: '/api/v1/properties',
  method: 'GET'
});

// Failed authentication
logger.warn('Token expired', {
  path: '/api/v1/properties',
  method: 'GET'
});
```

View logs in development:
```bash
tail -f logs/combined.log
```


---

## RBAC Middleware (`rbac.ts`)

### Overview

The Role-Based Access Control (RBAC) middleware enforces role-based permissions for routes. It works in conjunction with the authentication middleware to restrict access based on user roles (buyer or seller).

### Available Middleware Functions

1. **`attachUserRole`** - Fetches user role from Firestore and attaches to request
2. **`requireSeller`** - Restricts access to sellers only
3. **`requireBuyer`** - Restricts access to buyers only
4. **`requireRole(role)`** - Generic function to require a specific role

### Usage

#### Basic Role Protection

```typescript
import { Router } from 'express';
import { authenticate } from './middleware/auth';
import { attachUserRole, requireSeller, requireBuyer } from './middleware/rbac';

const router = Router();

// Seller-only route
router.post(
  '/api/v1/properties',
  authenticate,        // Step 1: Verify token
  attachUserRole,      // Step 2: Fetch role from Firestore
  requireSeller,       // Step 3: Check seller role
  createProperty       // Step 4: Handle request
);

// Buyer-only route
router.post(
  '/api/v1/appointments',
  authenticate,
  attachUserRole,
  requireBuyer,
  createAppointment
);
```

#### Using Generic `requireRole`

```typescript
import { requireRole } from './middleware/rbac';

// Equivalent to requireSeller
router.post('/api/v1/properties', authenticate, attachUserRole, requireRole('seller'), createProperty);

// Equivalent to requireBuyer
router.post('/api/v1/appointments', authenticate, attachUserRole, requireRole('buyer'), createAppointment);
```

### How It Works

#### `attachUserRole` Middleware

1. **Checks Authentication**: Ensures `userId` is present (requires `authenticate` middleware first)
2. **Queries Firestore**: Checks both `buyers` and `sellers` collections for user profile
3. **Attaches Role**: Adds `userRole` to the request object
4. **Error Handling**: Returns 403 if user profile not found or 500 for Firestore errors

**Request Flow:**
```
Client Request
    ↓
authenticate middleware (userId attached)
    ↓
attachUserRole middleware
    ↓
Query Firestore: buyers/{userId} and sellers/{userId}
    ↓
Success: req.userRole attached ('buyer' or 'seller')
    ↓
Next middleware/route handler
```

#### `requireSeller` Middleware

1. **Checks Role**: Verifies `userRole` is set (requires `attachUserRole` first)
2. **Validates Role**: Ensures `userRole === 'seller'`
3. **Error Handling**: Returns 403 Forbidden if user is not a seller

#### `requireBuyer` Middleware

1. **Checks Role**: Verifies `userRole` is set (requires `attachUserRole` first)
2. **Validates Role**: Ensures `userRole === 'buyer'`
3. **Error Handling**: Returns 403 Forbidden if user is not a buyer

### Request Object Extensions

After RBAC middleware, the request object includes:

```typescript
interface AuthenticatedRequest extends Request {
  userId?: string;              // From authenticate middleware
  userEmail?: string;           // From authenticate middleware
  userRole?: 'buyer' | 'seller'; // From attachUserRole middleware
}
```

### Accessing Role Information

In your route handlers, access the user role:

```typescript
import { AuthenticatedRequest } from '../types';

export const createProperty = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.userId;    // From authenticate
  const role = req.userRole;    // From attachUserRole (guaranteed to be 'seller')
  
  // Create property for seller
  const property = await propertyService.createProperty(req.body, userId);
  
  res.json({ success: true, data: property });
};
```

### Firestore User Profile Structure

The RBAC middleware expects user profiles in Firestore:

```typescript
// Collection: buyers/{userId}
{
  email: "buyer@example.com",
  fullName: "John Buyer",
  role: "buyer",  // Optional, defaults to 'buyer'
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// Collection: sellers/{userId}
{
  email: "seller@example.com",
  fullName: "Jane Seller",
  role: "seller",  // Optional, defaults to 'seller'
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Error Responses

#### User Not Authenticated
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "User must be authenticated to access this resource"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### User Profile Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "User profile not found"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Insufficient Permissions (Buyer accessing Seller route)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "This resource requires seller role"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Insufficient Permissions (Seller accessing Buyer route)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "This resource requires buyer role"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Role Not Attached
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "User role not found. Ensure attachUserRole middleware is used."
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Middleware Order

**CRITICAL**: RBAC middleware must be used in the correct order:

```typescript
// ✅ CORRECT ORDER
router.post('/api/v1/properties',
  authenticate,      // 1. Verify token (attaches userId)
  attachUserRole,    // 2. Fetch role (attaches userRole)
  requireSeller,     // 3. Check role
  createProperty     // 4. Handle request
);

// ❌ WRONG ORDER - Will fail
router.post('/api/v1/properties',
  requireSeller,     // ❌ userRole not set yet
  authenticate,
  attachUserRole,
  createProperty
);

// ❌ WRONG ORDER - Will fail
router.post('/api/v1/properties',
  authenticate,
  requireSeller,     // ❌ userRole not set yet
  attachUserRole,
  createProperty
);
```

### Testing

The RBAC middleware includes comprehensive unit tests covering:

- ✅ Attaching buyer role from Firestore
- ✅ Attaching seller role from Firestore
- ✅ Default role when role field is missing
- ✅ User profile not found error
- ✅ Missing userId error
- ✅ Firestore connection errors
- ✅ Seller access control
- ✅ Buyer access control
- ✅ Generic role requirement
- ✅ Integration scenarios

Run tests:
```bash
npm test -- rbac.test.ts
```

### Security Considerations

1. **Firestore Rules**: Ensure Firestore security rules prevent unauthorized profile access
2. **Role Immutability**: User roles should not be easily changeable by users
3. **Profile Validation**: Validate user profiles during registration
4. **Logging**: All authorization failures are logged for security monitoring
5. **Performance**: Consider caching user roles for high-traffic scenarios

### Performance Optimization

The `attachUserRole` middleware queries Firestore on every request. For high-traffic applications, consider:

1. **Caching**: Implement a short-lived cache (e.g., Redis) for user roles
2. **Custom Claims**: Store role in Firebase Auth custom claims (requires token refresh)
3. **Database Optimization**: Ensure Firestore indexes are properly configured

Example with caching:

```typescript
import { createClient } from 'redis';

const redis = createClient();
const ROLE_CACHE_TTL = 300; // 5 minutes

export const attachUserRoleWithCache = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    
    // Check cache first
    const cachedRole = await redis.get(`user:${userId}:role`);
    if (cachedRole) {
      req.userRole = cachedRole as UserRole;
      return next();
    }
    
    // Fetch from Firestore
    const db = getFirebaseFirestore();
    const buyerDoc = await db.collection('buyers').doc(userId).get();
    const sellerDoc = await db.collection('sellers').doc(userId).get();
    
    let userRole: UserRole | undefined;
    if (buyerDoc.exists) {
      userRole = 'buyer';
    } else if (sellerDoc.exists) {
      userRole = 'seller';
    }
    
    if (!userRole) {
      throw new NotFoundError('User profile not found');
    }
    
    // Cache the role
    await redis.setEx(`user:${userId}:role`, ROLE_CACHE_TTL, userRole);
    
    req.userRole = userRole;
    next();
  } catch (error) {
    next(error);
  }
};
```

### Logging

RBAC events are logged with context:

```typescript
// Role attached successfully
logger.debug('User role attached', {
  userId: 'user-123',
  role: 'seller',
  path: '/api/v1/properties',
  method: 'POST'
});

// Access denied
logger.warn('Seller access denied', {
  userId: 'user-123',
  role: 'buyer',
  path: '/api/v1/properties',
  method: 'POST'
});

// User profile not found
logger.warn('User profile not found in Firestore', {
  userId: 'user-123',
  path: '/api/v1/properties',
  method: 'POST'
});
```

---

## Complete Usage Examples

### Example 1: Seller Property Management

```typescript
import { Router } from 'express';
import { authenticate } from './middleware/auth';
import { attachUserRole, requireSeller } from './middleware/rbac';
import { validatePropertyCreation } from './validators/property';
import * as propertyController from './controllers/property';

const router = Router();

// Create property (seller only)
router.post(
  '/api/v1/properties',
  authenticate,
  attachUserRole,
  requireSeller,
  validatePropertyCreation,
  propertyController.createProperty
);

// Update property (seller only, with ownership check in controller)
router.put(
  '/api/v1/properties/:id',
  authenticate,
  attachUserRole,
  requireSeller,
  propertyController.updateProperty
);

// Delete property (seller only, with ownership check in controller)
router.delete(
  '/api/v1/properties/:id',
  authenticate,
  attachUserRole,
  requireSeller,
  propertyController.deleteProperty
);

// Get seller's properties
router.get(
  '/api/v1/properties/seller/me',
  authenticate,
  attachUserRole,
  requireSeller,
  propertyController.getMyProperties
);

export default router;
```

### Example 2: Buyer Appointments

```typescript
import { Router } from 'express';
import { authenticate } from './middleware/auth';
import { attachUserRole, requireBuyer } from './middleware/rbac';
import * as appointmentController from './controllers/appointment';

const router = Router();

// Create appointment (buyer only)
router.post(
  '/api/v1/appointments',
  authenticate,
  attachUserRole,
  requireBuyer,
  appointmentController.createAppointment
);

// Get buyer's appointments
router.get(
  '/api/v1/appointments/buyer/me',
  authenticate,
  attachUserRole,
  requireBuyer,
  appointmentController.getMyAppointments
);

// Submit feedback (buyer only)
router.post(
  '/api/v1/feedback',
  authenticate,
  attachUserRole,
  requireBuyer,
  appointmentController.submitFeedback
);

export default router;
```

### Example 3: Mixed Access Routes

```typescript
import { Router } from 'express';
import { authenticate, optionalAuth } from './middleware/auth';
import { attachUserRole } from './middleware/rbac';
import * as propertyController from './controllers/property';

const router = Router();

// Public route - no authentication required
router.get(
  '/api/v1/properties',
  propertyController.getAllProperties
);

// Public route - optional authentication for personalized results
router.get(
  '/api/v1/properties/:id',
  optionalAuth,
  propertyController.getPropertyById
);

// Protected route - any authenticated user (buyer or seller)
router.get(
  '/api/v1/dashboard',
  authenticate,
  attachUserRole,
  propertyController.getDashboard
);

export default router;
```

### Example 4: Role-Specific Logic in Controllers

```typescript
import { AuthenticatedRequest } from '../types';
import { Response } from 'express';

export const getDashboard = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { userId, userRole } = req;
  
  // Role-specific logic
  if (userRole === 'seller') {
    const dashboard = await dashboardService.getSellerDashboard(userId);
    return res.json({ success: true, data: dashboard });
  }
  
  if (userRole === 'buyer') {
    const dashboard = await dashboardService.getBuyerDashboard(userId);
    return res.json({ success: true, data: dashboard });
  }
  
  // This should never happen if middleware is properly configured
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Invalid user role' }
  });
};
```

### Troubleshooting

#### "User role not found. Ensure attachUserRole middleware is used."
- You're using `requireSeller` or `requireBuyer` without `attachUserRole`
- Ensure middleware order: `authenticate` → `attachUserRole` → `requireSeller/requireBuyer`

#### "User profile not found"
- User doesn't exist in either `buyers` or `sellers` collection
- Ensure user registration creates a profile in Firestore
- Check that the userId matches the document ID in Firestore

#### "User must be authenticated to access this resource"
- `attachUserRole` was called without `authenticate` first
- Ensure `authenticate` middleware is before `attachUserRole`

#### "This resource requires seller/buyer role"
- User has the wrong role for the route
- Verify the user's role in Firestore
- Check that the correct role middleware is used for the route

### Related Files

- **Authentication Middleware**: `auth.ts` - Token verification
- **Error Handler**: `errorHandler.ts` - Error classes and handling
- **Types**: `../types/index.ts` - TypeScript interfaces
- **Firebase Config**: `../config/firebase.ts` - Firestore access
