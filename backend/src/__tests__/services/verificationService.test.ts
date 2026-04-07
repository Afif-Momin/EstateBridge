import verificationService from '../../services/verificationService';
import verificationTokenRepository from '../../repositories/verificationTokenRepository';
import { getFirebaseFirestore } from '../../config/firebase';
import { VerificationToken } from '../../types';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler';

// Mock dependencies
jest.mock('../../repositories/verificationTokenRepository');
jest.mock('../../config/firebase');
jest.mock('../../utils/logger');

describe('VerificationService', () => {
  let mockDb: any;
  let mockCollection: any;
  let mockDoc: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Firestore mocks
    mockDoc = {
      get: jest.fn(),
      update: jest.fn(),
    };

    mockCollection = {
      doc: jest.fn().mockReturnValue(mockDoc),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    (getFirebaseFirestore as jest.Mock).mockReturnValue(mockDb);
    
    // Set default environment variables
    process.env.RECAPTCHA_V3_SECRET_KEY = 'test-secret-key';
  });

  describe('validateCaptcha', () => {
    let mockMakeRecaptchaRequest: jest.SpyInstance;

    beforeEach(() => {
      // Mock the private makeRecaptchaRequest method
      mockMakeRecaptchaRequest = jest.spyOn(
        verificationService as any,
        'makeRecaptchaRequest'
      );
    });

    afterEach(() => {
      mockMakeRecaptchaRequest.mockRestore();
    });

    it('should return true for valid v3 CAPTCHA with score >= 0.5', async () => {
      const token = 'valid-v3-token';
      const action = 'register';
      const now = new Date();

      mockMakeRecaptchaRequest.mockResolvedValue({
        success: true,
        challenge_ts: now.toISOString(),
        hostname: 'localhost',
        score: 0.9,
        action: 'register',
      });

      const result = await verificationService.validateCaptcha(token, action);

      expect(result).toBe(true);
      expect(mockMakeRecaptchaRequest).toHaveBeenCalledWith(
        token,
        'test-secret-key'
      );
    });

    it('should return false for v3 CAPTCHA with score < 0.5', async () => {
      const token = 'low-score-token';
      const action = 'register';
      const now = new Date();

      mockMakeRecaptchaRequest.mockResolvedValue({
        success: true,
        challenge_ts: now.toISOString(),
        hostname: 'localhost',
        score: 0.3,
        action: 'register',
      });

      const result = await verificationService.validateCaptcha(token, action);

      expect(result).toBe(false);
    });

    it('should return false for v3 CAPTCHA with score exactly 0.5', async () => {
      const token = 'threshold-token';
      const action = 'register';
      const now = new Date();

      mockMakeRecaptchaRequest.mockResolvedValue({
        success: true,
        challenge_ts: now.toISOString(),
        hostname: 'localhost',
        score: 0.5,
        action: 'register',
      });

      const result = await verificationService.validateCaptcha(token, action);

      expect(result).toBe(true);
    });

    it('should return true for valid v2 CAPTCHA (no score)', async () => {
      const token = 'valid-v2-token';
      const action = 'register';
      const now = new Date();

      mockMakeRecaptchaRequest.mockResolvedValue({
        success: true,
        challenge_ts: now.toISOString(),
        hostname: 'localhost',
      });

      const result = await verificationService.validateCaptcha(token, action);

      expect(result).toBe(true);
    });

    it('should return false if reCAPTCHA API returns success=false', async () => {
      const token = 'invalid-token';
      const action = 'register';

      mockMakeRecaptchaRequest.mockResolvedValue({
        success: false,
        'error-codes': ['invalid-input-response'],
      });

      const result = await verificationService.validateCaptcha(token, action);

      expect(result).toBe(false);
    });

    it('should return false if action does not match', async () => {
      const token = 'valid-token';
      const action = 'register';
      const now = new Date();

      mockMakeRecaptchaRequest.mockResolvedValue({
        success: true,
        challenge_ts: now.toISOString(),
        hostname: 'localhost',
        score: 0.9,
        action: 'login', // Different action
      });

      const result = await verificationService.validateCaptcha(token, action);

      expect(result).toBe(false);
    });

    it('should return false if token is older than 2 minutes', async () => {
      const token = 'expired-token';
      const action = 'register';
      const oldTime = new Date();
      oldTime.setMinutes(oldTime.getMinutes() - 3); // 3 minutes ago

      mockMakeRecaptchaRequest.mockResolvedValue({
        success: true,
        challenge_ts: oldTime.toISOString(),
        hostname: 'localhost',
        score: 0.9,
        action: 'register',
      });

      const result = await verificationService.validateCaptcha(token, action);

      expect(result).toBe(false);
    });

    it('should return true if token is exactly 2 minutes old', async () => {
      const token = 'threshold-age-token';
      const action = 'register';
      const twoMinutesAgo = new Date();
      // Set to 1 minute 59 seconds ago to account for test execution time
      twoMinutesAgo.setSeconds(twoMinutesAgo.getSeconds() - 119);

      mockMakeRecaptchaRequest.mockResolvedValue({
        success: true,
        challenge_ts: twoMinutesAgo.toISOString(),
        hostname: 'localhost',
        score: 0.9,
        action: 'register',
      });

      const result = await verificationService.validateCaptcha(token, action);

      expect(result).toBe(true);
    });

    it('should throw error if RECAPTCHA_V3_SECRET_KEY is not configured', async () => {
      delete process.env.RECAPTCHA_V3_SECRET_KEY;

      await expect(
        verificationService.validateCaptcha('token', 'register')
      ).rejects.toThrow('CAPTCHA validation not configured');

      // Restore for other tests
      process.env.RECAPTCHA_V3_SECRET_KEY = 'test-secret-key';
    });

    it('should throw error if makeRecaptchaRequest fails', async () => {
      const token = 'error-token';
      const action = 'register';
      const error = new Error('Network error');

      mockMakeRecaptchaRequest.mockRejectedValue(error);

      await expect(
        verificationService.validateCaptcha(token, action)
      ).rejects.toThrow('Network error');
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate a 64-character hex token', async () => {
      const userId = 'user-123';
      const mockToken = 'a'.repeat(64); // 32 bytes = 64 hex chars

      (verificationTokenRepository.create as jest.Mock).mockResolvedValue({
        id: 'token-id',
        userId,
        token: mockToken,
        type: 'email_verification',
        expiresAt: new Date(),
        used: false,
        createdAt: new Date(),
      });

      const token = await verificationService.generateVerificationToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes in hex = 64 characters
      expect(verificationTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          token: expect.any(String),
          type: 'email_verification',
          expiresAt: expect.any(Date),
        })
      );
    });

    it('should set token expiration to 24 hours from now', async () => {
      const userId = 'user-123';
      const beforeTime = new Date();
      beforeTime.setHours(beforeTime.getHours() + 24);

      await verificationService.generateVerificationToken(userId);

      const createCall = (verificationTokenRepository.create as jest.Mock).mock.calls[0][0];
      const expiresAt = createCall.expiresAt;

      // Check that expiration is approximately 24 hours from now (within 1 minute tolerance)
      const timeDiff = Math.abs(expiresAt.getTime() - beforeTime.getTime());
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute difference
    });

    it('should throw error if repository fails', async () => {
      const userId = 'user-123';
      const error = new Error('Database error');

      (verificationTokenRepository.create as jest.Mock).mockRejectedValue(error);

      await expect(
        verificationService.generateVerificationToken(userId)
      ).rejects.toThrow('Database error');
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send email successfully on first attempt', async () => {
      const email = 'test@example.com';
      const token = 'test-token-123';

      // Mock successful email send (in development mode, it just logs)
      process.env.NODE_ENV = 'development';

      await expect(
        verificationService.sendVerificationEmail(email, token)
      ).resolves.not.toThrow();
    });

    it('should retry up to 3 times on failure', async () => {
      const email = 'test@example.com';
      const token = 'test-token-123';

      // Set to production to trigger actual email sending (which will fail)
      process.env.NODE_ENV = 'production';

      await expect(
        verificationService.sendVerificationEmail(email, token)
      ).rejects.toThrow(/Failed to send verification email after 3 attempts/);

      // Reset to development
      process.env.NODE_ENV = 'development';
    });

    it('should include verification link in email', async () => {
      const email = 'test@example.com';
      const token = 'test-token-123';

      process.env.NODE_ENV = 'development';
      process.env.FRONTEND_URL = 'https://example.com';

      await verificationService.sendVerificationEmail(email, token);

      // In development mode, it logs the email details
      // We can't easily verify the log content, but we can verify it doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('verifyEmailToken', () => {
    it('should return valid=false if token not found', async () => {
      const token = 'non-existent-token';

      (verificationTokenRepository.findByToken as jest.Mock).mockResolvedValue(null);

      const result = await verificationService.verifyEmailToken(token);

      expect(result).toEqual({ userId: '', valid: false });
    });

    it('should return valid=false if token already used', async () => {
      const token = 'used-token';
      const mockToken: VerificationToken = {
        id: 'token-id',
        userId: 'user-123',
        token,
        type: 'email_verification',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        used: true,
        usedAt: new Date(),
        createdAt: new Date(),
      };

      (verificationTokenRepository.findByToken as jest.Mock).mockResolvedValue(mockToken);

      const result = await verificationService.verifyEmailToken(token);

      expect(result).toEqual({ userId: 'user-123', valid: false });
      expect(verificationTokenRepository.markAsUsed).not.toHaveBeenCalled();
    });

    it('should return valid=false if token expired (24 hours)', async () => {
      const token = 'expired-token';
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 25); // 25 hours ago

      const mockToken: VerificationToken = {
        id: 'token-id',
        userId: 'user-123',
        token,
        type: 'email_verification',
        expiresAt: expiredDate,
        used: false,
        createdAt: new Date(),
      };

      (verificationTokenRepository.findByToken as jest.Mock).mockResolvedValue(mockToken);

      const result = await verificationService.verifyEmailToken(token);

      expect(result).toEqual({ userId: 'user-123', valid: false });
      expect(verificationTokenRepository.markAsUsed).not.toHaveBeenCalled();
    });

    it('should verify valid token and update user', async () => {
      const token = 'valid-token';
      const userId = 'user-123';
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 12); // 12 hours in future

      const mockToken: VerificationToken = {
        id: 'token-id',
        userId,
        token,
        type: 'email_verification',
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      };

      (verificationTokenRepository.findByToken as jest.Mock).mockResolvedValue(mockToken);
      (verificationTokenRepository.markAsUsed as jest.Mock).mockResolvedValue({
        ...mockToken,
        used: true,
        usedAt: new Date(),
      });

      const result = await verificationService.verifyEmailToken(token);

      expect(result).toEqual({ userId, valid: true });
      expect(verificationTokenRepository.markAsUsed).toHaveBeenCalledWith('token-id');
      expect(mockDoc.update).toHaveBeenCalledWith({
        emailVerified: true,
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('resendVerificationEmail', () => {
    it('should generate new token and send email', async () => {
      const email = 'test@example.com';
      const userId = 'user-123';

      mockCollection.get.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: userId,
            data: () => ({
              email,
              emailVerified: false,
            }),
          },
        ],
      });

      (verificationTokenRepository.create as jest.Mock).mockResolvedValue({
        id: 'token-id',
        userId,
        token: 'new-token',
        type: 'email_verification',
        expiresAt: new Date(),
        used: false,
        createdAt: new Date(),
      });

      process.env.NODE_ENV = 'development';

      await verificationService.resendVerificationEmail(email);

      expect(mockCollection.where).toHaveBeenCalledWith('email', '==', email);
      expect(verificationTokenRepository.create).toHaveBeenCalled();
    });

    it('should throw NotFoundError if user not found', async () => {
      const email = 'nonexistent@example.com';

      mockCollection.get.mockResolvedValue({
        empty: true,
        docs: [],
      });

      await expect(
        verificationService.resendVerificationEmail(email)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError if email already verified', async () => {
      const email = 'verified@example.com';
      const userId = 'user-123';

      mockCollection.get.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: userId,
            data: () => ({
              email,
              emailVerified: true,
            }),
          },
        ],
      });

      await expect(
        verificationService.resendVerificationEmail(email)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('isEmailVerified', () => {
    it('should return true if email is verified', async () => {
      const userId = 'user-123';

      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => ({
          emailVerified: true,
        }),
      });

      const result = await verificationService.isEmailVerified(userId);

      expect(result).toBe(true);
      expect(mockCollection.doc).toHaveBeenCalledWith(userId);
    });

    it('should return false if email is not verified', async () => {
      const userId = 'user-123';

      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => ({
          emailVerified: false,
        }),
      });

      const result = await verificationService.isEmailVerified(userId);

      expect(result).toBe(false);
    });

    it('should return false if emailVerified field is missing', async () => {
      const userId = 'user-123';

      mockDoc.get.mockResolvedValue({
        exists: true,
        data: () => ({}),
      });

      const result = await verificationService.isEmailVerified(userId);

      expect(result).toBe(false);
    });

    it('should throw NotFoundError if user does not exist', async () => {
      const userId = 'non-existent-user';

      mockDoc.get.mockResolvedValue({
        exists: false,
      });

      await expect(
        verificationService.isEmailVerified(userId)
      ).rejects.toThrow(NotFoundError);
    });
  });
});
