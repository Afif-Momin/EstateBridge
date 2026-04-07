import { getFirebaseAuth, getFirebaseFirestore } from '../config/firebase';
import { 
  ValidationError, 
  AuthenticationError, 
  ConflictError,
  DatabaseError,
  NotFoundError 
} from '../middleware/errorHandler';
import { 
  isValidEmail, 
  isValidFullName,
  sanitizeString 
} from '../utils/validation';
import { User, UserRole } from '../types';
import { COLLECTIONS, USER_ROLES } from '../constants';
import { logger } from '../utils/logger';

/**
 * Registration data transfer object
 */
export interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  buy_country?: string;
  buy_city?: string;
  buy_state?: string;
  buy_address?: string;
  buy_pincode?: string;
  currency?: 'USD' | 'INR';
}

/**
 * Login data transfer object
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Auth response with user data
 */
export interface AuthResponse {
  user: User;
  message: string;
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate password strength
 * Requirements: min 8 chars, uppercase, lowercase, number
 */
export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Register a new user
 * Creates Firebase Auth account and stores user profile in Firestore
 * If idToken is provided, uses existing Firebase Auth user
 */
export const registerUser = async (data: RegisterDTO & { idToken?: string; userId?: string }): Promise<AuthResponse> => {
  try {
    // Validate input
    const { 
      email, 
      password, 
      fullName, 
      role, 
      idToken, 
      userId,
      buy_country,
      buy_city,
      buy_state,
      buy_address,
      buy_pincode,
      currency
    } = data;

    // Validate email
    if (!email || !isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate full name
    const sanitizedFullName = sanitizeString(fullName);
    if (!isValidFullName(sanitizedFullName)) {
      throw new ValidationError(
        'Full name must be 2-100 characters and contain only letters, spaces, and hyphens'
      );
    }

    // Validate role
    if (!role || (role !== USER_ROLES.BUYER && role !== USER_ROLES.SELLER)) {
      throw new ValidationError('Role must be either "buyer" or "seller"');
    }

    const auth = getFirebaseAuth();
    const db = getFirebaseFirestore();

    let userRecord;

    // If idToken or userId is provided, use existing Firebase Auth user
    if (idToken || userId) {
      try {
        if (idToken) {
          const decodedToken = await auth.verifyIdToken(idToken);
          userRecord = await auth.getUser(decodedToken.uid);
        } else if (userId) {
          userRecord = await auth.getUser(userId);
        }
        logger.info('Using existing Firebase Auth user', { userId: userRecord?.uid, email });
      } catch (error: any) {
        logger.error('Failed to verify existing user', { error: error.message });
        throw new AuthenticationError('Invalid authentication token');
      }
    } else {
      // Validate password only if creating new user
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        throw new ValidationError('Invalid password', {
          errors: passwordValidation.errors,
        });
      }

      // Check if user already exists
      try {
        await auth.getUserByEmail(email);
        throw new ConflictError('Email already exists', 'EMAIL_ALREADY_EXISTS');
      } catch (error: any) {
        // If user not found, continue with registration
        if (error.code !== 'auth/user-not-found') {
          // If it's our ConflictError, re-throw it
          if (error instanceof ConflictError) {
            throw error;
          }
          // Otherwise, log and continue
          logger.debug('User check completed', { email });
        }
      }

      // Create Firebase Auth user
      userRecord = await auth.createUser({
        email,
        password,
        displayName: sanitizedFullName,
      });

      logger.info('Firebase Auth user created', { userId: userRecord.uid, email });
    }

    if (!userRecord) {
      throw new DatabaseError('Failed to get user record');
    }

    // Store user profile in Firestore
    const now = new Date();
    const userProfile = {
      email,
      fullName: sanitizedFullName,
      role,
      createdAt: now,
      updatedAt: now,
      // Location data (Requirements 1.1, 1.2)
      ...(buy_country && { buy_country }),
      ...(buy_city && { buy_city }),
      ...(buy_state && { buy_state }),
      ...(buy_address && { buy_address }),
      ...(buy_pincode && { buy_pincode }),
      // Currency preference (Requirements 2.1, 2.2, 2.3)
      ...(currency && { currency }),
      // Email verification (Requirements 4.2)
      emailVerified: false,
    };

    await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).set(userProfile);

    logger.info('User profile stored in Firestore', { 
      userId: userRecord.uid, 
      role,
      currency 
    });

    // Return user data
    const user: User = {
      id: userRecord.uid,
      email,
      fullName: sanitizedFullName,
      role,
      createdAt: now,
      updatedAt: now,
      buy_country,
      buy_city,
      buy_state,
      buy_address,
      buy_pincode,
      currency,
      emailVerified: false,
    };

    return {
      user,
      message: 'User registered successfully',
    };
  } catch (error: any) {
    // Re-throw known errors
    if (
      error instanceof ValidationError ||
      error instanceof ConflictError ||
      error instanceof AuthenticationError
    ) {
      throw error;
    }

    // Handle Firebase Auth errors
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-exists':
          throw new ConflictError('Email already exists', 'EMAIL_ALREADY_EXISTS');
        case 'auth/invalid-email':
          throw new ValidationError('Invalid email format');
        case 'auth/weak-password':
          throw new ValidationError('Password is too weak');
        default:
          logger.error('Firebase Auth error during registration', { 
            code: error.code, 
            message: error.message 
          });
      }
    }

    logger.error('User registration failed', { error: error.message });
    throw new DatabaseError('Failed to register user');
  }
};

/**
 * Login user
 * Note: Firebase Admin SDK doesn't support direct password verification.
 * This function is a placeholder that documents the expected behavior.
 * In production, login should be handled on the client side using Firebase Client SDK,
 * and the backend should only verify the resulting ID token.
 */
export const loginUser = async (_credentials: LoginDTO): Promise<AuthResponse> => {
  // Firebase Admin SDK does not support password verification
  // This is intentional - authentication should happen on the client side
  // The backend's role is to verify tokens, not credentials
  
  throw new AuthenticationError(
    'Login must be performed using Firebase Client SDK. ' +
    'The backend verifies tokens, not credentials. ' +
    'Please use the frontend authentication flow.'
  );
};

/**
 * Get current user profile from Firestore
 */
export const getCurrentUser = async (userId: string): Promise<User> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const db = getFirebaseFirestore();
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();

    if (!userDoc.exists) {
      throw new NotFoundError('User not found');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new NotFoundError('User data not found');
    }

    const user: User = {
      id: userDoc.id,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      profileImage: userData.profileImage,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
    };

    return user;
  } catch (error: any) {
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }

    logger.error('Failed to get current user', { 
      userId, 
      error: error.message 
    });
    throw new DatabaseError('Failed to retrieve user profile');
  }
};

/**
 * Logout user by revoking Firebase Auth tokens
 */
export const logoutUser = async (userId: string): Promise<void> => {
  try {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const auth = getFirebaseAuth();

    // Revoke all refresh tokens for the user
    // This invalidates all existing sessions
    await auth.revokeRefreshTokens(userId);

    logger.info('User tokens revoked', { userId });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      throw error;
    }

    // Handle Firebase Auth errors
    if (error.code === 'auth/user-not-found') {
      throw new NotFoundError('User not found');
    }

    logger.error('Failed to logout user', { 
      userId, 
      error: error.message 
    });
    throw new DatabaseError('Failed to logout user');
  }
};
