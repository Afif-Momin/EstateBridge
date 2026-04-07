# Services Layer

This directory contains the business logic layer for the Estate Bridge platform. Services encapsulate domain logic, coordinate between repositories, and enforce business rules.

## Auth Service

**File:** `authService.ts`

The Auth Service handles user authentication and authorization operations using Firebase Auth and Firestore.

### Functions

#### `validatePassword(password: string): PasswordValidationResult`

Validates password strength according to platform requirements.

**Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

**Returns:**
```typescript
{
  valid: boolean;
  errors: string[];
}
```

**Example:**
```typescript
const result = validatePassword('Password123');
if (!result.valid) {
  console.error('Password validation failed:', result.errors);
}
```

---

#### `registerUser(data: RegisterDTO): Promise<AuthResponse>`

Registers a new user by creating a Firebase Auth account and storing the user profile in Firestore.

**Parameters:**
```typescript
{
  email: string;
  password: string;
  fullName: string;
  role: 'buyer' | 'seller';
}
```

**Validation:**
- Email must be valid format
- Password must meet strength requirements
- Full name must be 2-100 characters, letters/spaces/hyphens only
- Role must be 'buyer' or 'seller'

**Throws:**
- `ValidationError` - Invalid input data
- `ConflictError` - Email already exists
- `DatabaseError` - Firebase operation failed

**Example:**
```typescript
try {
  const result = await registerUser({
    email: 'john@example.com',
    password: 'SecurePass123',
    fullName: 'John Doe',
    role: 'buyer'
  });
  console.log('User registered:', result.user.id);
} catch (error) {
  if (error instanceof ConflictError) {
    console.error('Email already in use');
  }
}
```

---

#### `loginUser(credentials: LoginDTO): Promise<AuthResponse>`

**Note:** This function intentionally throws an error. Firebase Admin SDK does not support password verification.

**Authentication Flow:**
1. Client-side: Use Firebase Client SDK to authenticate with email/password
2. Client-side: Obtain ID token from Firebase Auth
3. Client-side: Send ID token to backend in Authorization header
4. Backend: Verify token using auth middleware
5. Backend: Extract user ID from verified token

**Why this design?**
- Firebase Admin SDK is designed for server-side token verification, not credential validation
- Client-side authentication is more secure (credentials never sent to backend)
- Follows Firebase best practices and security guidelines

**Example (Client-side):**
```typescript
// Frontend code using Firebase Client SDK
import { signInWithEmailAndPassword } from 'firebase/auth';

const userCredential = await signInWithEmailAndPassword(
  auth, 
  'user@example.com', 
  'Password123'
);
const idToken = await userCredential.user.getIdToken();

// Send idToken to backend in Authorization header
```

---

#### `getCurrentUser(userId: string): Promise<User>`

Retrieves the current user's profile from Firestore.

**Parameters:**
- `userId` - Firebase Auth user ID (from verified token)

**Returns:**
```typescript
{
  id: string;
  email: string;
  fullName: string;
  role: 'buyer' | 'seller';
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Throws:**
- `ValidationError` - Missing user ID
- `NotFoundError` - User not found in Firestore
- `DatabaseError` - Firestore operation failed

**Example:**
```typescript
// In a controller, after auth middleware
const user = await getCurrentUser(req.userId);
res.json({ success: true, data: user });
```

---

#### `logoutUser(userId: string): Promise<void>`

Logs out a user by revoking all Firebase Auth refresh tokens.

**Parameters:**
- `userId` - Firebase Auth user ID

**Effect:**
- Invalidates all existing sessions for the user
- User must re-authenticate to obtain new tokens
- Existing ID tokens remain valid until expiration (typically 1 hour)

**Throws:**
- `ValidationError` - Missing user ID
- `NotFoundError` - User not found
- `DatabaseError` - Firebase operation failed

**Example:**
```typescript
await logoutUser(req.userId);
res.json({ 
  success: true, 
  message: 'Logged out successfully' 
});
```

**Note:** For immediate token invalidation, check token issue time against user's `tokensValidAfterTime` in subsequent requests.

---

## Error Handling

All service functions follow consistent error handling patterns:

1. **Validation Errors** (400) - Invalid input data
2. **Authentication Errors** (401) - Invalid or missing credentials
3. **Authorization Errors** (403) - Insufficient permissions
4. **Not Found Errors** (404) - Resource doesn't exist
5. **Conflict Errors** (409) - Duplicate resource
6. **Database Errors** (500) - Firebase operation failed

## Testing

Unit tests are located in `__tests__/services/authService.test.ts`

Run tests:
```bash
npm test authService
```

## Related Files

- **Middleware:** `middleware/auth.ts` - Token verification
- **Middleware:** `middleware/rbac.ts` - Role-based access control
- **Types:** `types/index.ts` - TypeScript interfaces
- **Constants:** `constants/index.ts` - Validation rules
- **Utils:** `utils/validation.ts` - Validation helpers
