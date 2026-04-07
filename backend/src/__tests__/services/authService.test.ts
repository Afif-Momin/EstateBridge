import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  validatePassword,
  RegisterDTO,
  LoginDTO,
} from '../../services/authService';
import { getFirebaseAuth, getFirebaseFirestore } from '../../config/firebase';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '../../middleware/errorHandler';

jest.mock('../../config/firebase');
jest.mock('../../utils/logger');

const mockAuth = {
  createUser: jest.fn(),
  getUserByEmail: jest.fn(),
  revokeRefreshTokens: jest.fn(),
};

const mockDb = {
  collection: jest.fn(),
};

const mockCollection = {
  doc: jest.fn(),
};

const mockDoc = {
  set: jest.fn(),
  get: jest.fn(),
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getFirebaseAuth as jest.Mock).mockReturnValue(mockAuth);
    (getFirebaseFirestore as jest.Mock).mockReturnValue(mockDb);
    mockDb.collection.mockReturnValue(mockCollection);
    mockCollection.doc.mockReturnValue(mockDoc);
  });


  describe('validatePassword', () => {
    it('should return valid for password meeting all requirements', () => {
      const result = validatePassword('Password123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for password less than 8 characters', () => {
      const result = validatePassword('Pass1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should return invalid for password without uppercase', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should return invalid for password without lowercase', () => {
      const result = validatePassword('PASSWORD123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should return invalid for password without number', () => {
      const result = validatePassword('PasswordABC');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });


  describe('registerUser', () => {
    const validData: RegisterDTO = {
      email: 'test@example.com',
      password: 'Password123',
      fullName: 'John Doe',
      role: 'buyer',
    };

    it('should successfully register a new user', async () => {
      const mockUserRecord = {
        uid: 'user-123',
        email: validData.email,
        displayName: validData.fullName,
      };

      mockAuth.getUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
      mockAuth.createUser.mockResolvedValue(mockUserRecord);
      mockDoc.set.mockResolvedValue(undefined);

      const result = await registerUser(validData);

      expect(result.user.id).toBe('user-123');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.fullName).toBe('John Doe');
      expect(result.user.role).toBe('buyer');
      expect(result.message).toBe('User registered successfully');
    });

    it('should throw ValidationError for invalid email', async () => {
      const invalidData = { ...validData, email: 'invalid-email' };
      await expect(registerUser(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for weak password', async () => {
      const invalidData = { ...validData, password: 'weak' };
      await expect(registerUser(invalidData)).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if email already exists', async () => {
      mockAuth.getUserByEmail.mockResolvedValue({ uid: 'existing-user' });
      await expect(registerUser(validData)).rejects.toThrow(ConflictError);
    });
  });


  describe('loginUser', () => {
    it('should throw AuthenticationError', async () => {
      const credentials: LoginDTO = {
        email: 'test@example.com',
        password: 'Password123',
      };

      await expect(loginUser(credentials)).rejects.toThrow(AuthenticationError);
    });
  });

  describe('getCurrentUser', () => {
    it('should successfully retrieve user profile', async () => {
      const mockUserData = {
        email: 'test@example.com',
        fullName: 'John Doe',
        role: 'buyer',
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-01') },
      };

      mockDoc.get.mockResolvedValue({
        exists: true,
        id: 'user-123',
        data: () => mockUserData,
      });

      const result = await getCurrentUser('user-123');

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.fullName).toBe('John Doe');
      expect(result.role).toBe('buyer');
    });

    it('should throw ValidationError for missing userId', async () => {
      await expect(getCurrentUser('')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockDoc.get.mockResolvedValue({ exists: false });
      await expect(getCurrentUser('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('logoutUser', () => {
    it('should successfully revoke user tokens', async () => {
      mockAuth.revokeRefreshTokens.mockResolvedValue(undefined);

      await expect(logoutUser('user-123')).resolves.not.toThrow();
      expect(mockAuth.revokeRefreshTokens).toHaveBeenCalledWith('user-123');
    });

    it('should throw ValidationError for missing userId', async () => {
      await expect(logoutUser('')).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError if user does not exist', async () => {
      mockAuth.revokeRefreshTokens.mockRejectedValue({ code: 'auth/user-not-found' });
      await expect(logoutUser('non-existent')).rejects.toThrow(NotFoundError);
    });
  });
});
