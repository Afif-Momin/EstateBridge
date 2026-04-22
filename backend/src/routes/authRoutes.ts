import { Router } from 'express';
import {
  register,
  login,
  logout,
  getCurrentUserProfile,
  verifyEmail,
  resendVerification,
  getVerificationStatus,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate, registerSchema, loginSchema } from '../validators/authValidator';
import { registrationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registrationRateLimiter, validate(registerSchema), register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user (documents client-side authentication requirement)
 * @access  Public
 */
router.post('/login', validate(loginSchema), login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and revoke tokens
 * @access  Private (requires authentication)
 */
router.post('/logout', authenticate, logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private (requires authentication)
 */
router.get('/me', authenticate, getCurrentUserProfile);

/**
 * @route   GET /api/v1/auth/verify-email
 * @desc    Verify user email with token
 * @access  Public
 */
router.get('/verify-email', verifyEmail);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend verification email
 * @access  Public
 */
router.post('/resend-verification', resendVerification);

/**
 * @route   GET /api/v1/auth/verification-status
 * @desc    Check email verification status
 * @access  Private (requires authentication)
 */
router.get('/verification-status', authenticate, getVerificationStatus);

export default router;
