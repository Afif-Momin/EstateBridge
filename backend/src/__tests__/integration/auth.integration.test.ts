import request from 'supertest';
import app from '../../server';
import { getFirebaseAuth, getFirebaseFirestore } from '../../config/firebase';
import { UserFactory } from '../factories/userFactory';

// Mock Firebase
jest.mock('../../config/firebase');

// Mock rate limiter to avoid interference in tests
jest.mock('express-rate-limit', () => {
  return jest.fn(() => (_req: any, _res: any, next: any) => next());
});

// Mock verification service for CAPTCHA validation
jest.mock('../../services/verificationService', () => ({
  __esModule: true,
  default: {
    validateCaptcha: jest.fn().mockResolvedValue(true),
  },
}));

describe('Auth Routes Integration Tests', () => {
  let mockAuth: any;
  let mockDb: any;

  beforeEach(() => {
    // Setup Firebase mocks
    mockAuth = {
      createUser: jest.fn(),
      getUserByEmail: jest.fn(),
      verifyIdToken: jest.fn(),
      revokeRefreshTokens: jest.fn(),
    };

    mockDb = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(),
          set: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        })),
      })),
    };

    (getFirebaseAuth as jest.Mock).mockReturnValue(mockAuth);
    (getFirebaseFirestore as jest.Mock).mockReturnValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const registerData = UserFactory.createRegisterDTO();
      const userId = 'new-user-123';

      // Mock Firebase Auth user creation
      mockAuth.createUser.mockResolvedValue({
        uid: userId,
        email: registerData.email,
        displayName: registerData.fullName,
      });

      // Mock getUserByEmail to throw user-not-found (user doesn't exist)
      mockAuth.getUserByEmail.mockRejectedValue({
        code: 'auth/user-not-found',
      });

      // Mock Firestore set
      const mockSet = jest.fn().mockResolvedValue(undefined);
      mockDb.collection.mockReturnValue({
        doc: jest.fn(() => ({
          set: mockSet,
        })),
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        user: {
          id: userId,
          email: registerData.email,
          fullName: registerData.fullName,
          role: registerData.role,
          buy_country: registerData.buy_country,
          buy_city: registerData.buy_city,
          buy_state: registerData.buy_state,
          buy_address: registerData.buy_address,
          buy_pincode: registerData.buy_pincode,
          currency: 'USD',
          emailVerified: false,
        }
      });
      expect(response.body.message).toBe('User registered successfully');
      expect(mockAuth.createUser).toHaveBeenCalledWith({
        email: registerData.email,
        password: registerData.password,
        displayName: registerData.fullName,
      });
      expect(mockSet).toHaveBeenCalled();
    });

    it('should reject registration with invalid email', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Test1234',
        fullName: 'Test User',
        role: 'buyer',
        captchaToken: 'test-captcha-token',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fields.email).toBeDefined();
      expect(mockAuth.createUser).not.toHaveBeenCalled();
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordData = {
        email: 'test@example.com',
        password: 'weak',
        fullName: 'Test User',
        role: 'buyer',
        captchaToken: 'test-captcha-token',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fields.password).toBeDefined();
      expect(mockAuth.createUser).not.toHaveBeenCalled();
    });

    it('should reject registration with missing required fields', async () => {
      const incompleteData = {
        email: 'test@example.com',
        password: 'Test1234',
        captchaToken: 'test-captcha-token',
        // Missing fullName and role
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fields.fullName).toBeDefined();
      expect(response.body.error.fields.role).toBeDefined();
      expect(mockAuth.createUser).not.toHaveBeenCalled();
    });

    it('should reject registration with invalid role', async () => {
      const invalidRoleData = {
        email: 'test@example.com',
        password: 'Test1234',
        fullName: 'Test User',
        role: 'admin', // Invalid role
        captchaToken: 'test-captcha-token',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidRoleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fields.role).toBeDefined();
      expect(mockAuth.createUser).not.toHaveBeenCalled();
    });

    it('should reject registration with invalid full name', async () => {
      const invalidNameData = {
        email: 'test@example.com',
        password: 'Test1234',
        fullName: 'A', // Too short
        role: 'buyer',
        captchaToken: 'test-captcha-token',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidNameData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fields.fullName).toBeDefined();
    });

    it('should handle duplicate email registration', async () => {
      const registerData = UserFactory.createRegisterDTO();

      // Mock getUserByEmail to return existing user
      mockAuth.getUserByEmail.mockResolvedValue({
        uid: 'existing-user-123',
        email: registerData.email,
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(registerData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
      expect(mockAuth.createUser).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return error explaining client-side authentication requirement', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test1234',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toContain('Firebase Client SDK');
    });

    it('should reject login with missing email', async () => {
      const incompleteData = {
        password: 'Test1234',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fields.email).toBeDefined();
    });

    it('should reject login with missing password', async () => {
      const incompleteData = {
        email: 'test@example.com',
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fields.password).toBeDefined();
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout authenticated user successfully', async () => {
      const userId = 'user-123';
      const token = 'valid-token';

      // Mock token verification
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: userId,
        email: 'test@example.com',
      });

      // Mock token revocation
      mockAuth.revokeRefreshTokens.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith(token);
      expect(mockAuth.revokeRefreshTokens).toHaveBeenCalledWith(userId);
    });

    it('should reject logout without authentication token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(mockAuth.revokeRefreshTokens).not.toHaveBeenCalled();
    });

    it('should reject logout with invalid token', async () => {
      const invalidToken = 'invalid-token';

      mockAuth.verifyIdToken.mockRejectedValue({
        code: 'auth/invalid-id-token',
      });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(mockAuth.revokeRefreshTokens).not.toHaveBeenCalled();
    });

    it('should reject logout with expired token', async () => {
      const expiredToken = 'expired-token';

      mockAuth.verifyIdToken.mockRejectedValue({
        code: 'auth/id-token-expired',
      });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toContain('expired');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user profile for authenticated user', async () => {
      const userId = 'user-123';
      const token = 'valid-token';
      const user = UserFactory.create({ id: userId });

      // Mock token verification
      mockAuth.verifyIdToken.mockResolvedValue({
        uid: userId,
        email: user.email,
      });

      // Mock Firestore get
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        id: userId,
        data: () => ({
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          createdAt: { toDate: () => user.createdAt },
          updatedAt: { toDate: () => user.updatedAt },
        }),
      });

      mockDb.collection.mockReturnValue({
        doc: jest.fn(() => ({
          get: mockGet,
        })),
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: userId,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      });
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith(token);
      expect(mockGet).toHaveBeenCalled();
    });

    it('should reject request without authentication token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const invalidToken = 'invalid-token';

      mockAuth.verifyIdToken.mockRejectedValue({
        code: 'auth/invalid-id-token',
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should handle user not found in Firestore', async () => {
      const userId = 'non-existent-user';
      const token = 'valid-token';

      mockAuth.verifyIdToken.mockResolvedValue({
        uid: userId,
        email: 'test@example.com',
      });

      const mockGet = jest.fn().mockResolvedValue({
        exists: false,
      });

      mockDb.collection.mockReturnValue({
        doc: jest.fn(() => ({
          get: mockGet,
        })),
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
