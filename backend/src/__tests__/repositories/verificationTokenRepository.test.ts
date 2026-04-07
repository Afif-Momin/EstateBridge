import verificationTokenRepository from '../../repositories/verificationTokenRepository';
import { getFirebaseFirestore } from '../../config/firebase';
import { DatabaseError, NotFoundError } from '../../middleware/errorHandler';

// Mock Firebase
jest.mock('../../config/firebase');

describe('VerificationTokenRepository', () => {
  let mockCollection: any;
  let mockDoc: any;
  let mockBatch: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock batch
    mockBatch = {
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };

    // Setup mock doc
    mockDoc = {
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    // Setup mock collection
    mockCollection = {
      doc: jest.fn().mockReturnValue(mockDoc),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn(),
    };

    // Setup mock Firestore
    (getFirebaseFirestore as jest.Mock).mockReturnValue({
      collection: jest.fn().mockReturnValue(mockCollection),
      batch: jest.fn().mockReturnValue(mockBatch),
    });
  });

  describe('create', () => {
    it('should create a new verification token', async () => {
      const tokenData = {
        userId: 'user123',
        token: 'abc123token',
        type: 'email_verification' as const,
        expiresAt: new Date('2024-12-31'),
      };

      mockDoc.id = 'token123';

      const result = await verificationTokenRepository.create(tokenData);

      expect(mockDoc.set).toHaveBeenCalledWith({
        ...tokenData,
        used: false,
        createdAt: expect.any(Date),
      });

      expect(result).toMatchObject({
        id: 'token123',
        userId: 'user123',
        token: 'abc123token',
        type: 'email_verification',
        used: false,
      });
    });

    it('should throw DatabaseError on failure', async () => {
      mockDoc.set.mockRejectedValue(new Error('Firestore error'));

      const tokenData = {
        userId: 'user123',
        token: 'abc123token',
        type: 'email_verification' as const,
        expiresAt: new Date('2024-12-31'),
      };

      await expect(verificationTokenRepository.create(tokenData)).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('findByToken', () => {
    it('should find a token by token string', async () => {
      const mockTokenData = {
        userId: 'user123',
        token: 'abc123token',
        type: 'email_verification',
        expiresAt: { toDate: () => new Date('2024-12-31') },
        used: false,
        createdAt: { toDate: () => new Date('2024-01-01') },
      };

      mockCollection.get.mockResolvedValue({
        empty: false,
        docs: [
          {
            id: 'token123',
            data: () => mockTokenData,
          },
        ],
      });

      const result = await verificationTokenRepository.findByToken('abc123token');

      expect(mockCollection.where).toHaveBeenCalledWith('token', '==', 'abc123token');
      expect(mockCollection.limit).toHaveBeenCalledWith(1);
      expect(result).toMatchObject({
        id: 'token123',
        userId: 'user123',
        token: 'abc123token',
        type: 'email_verification',
        used: false,
      });
    });

    it('should return null if token not found', async () => {
      mockCollection.get.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const result = await verificationTokenRepository.findByToken('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw DatabaseError on failure', async () => {
      mockCollection.get.mockRejectedValue(new Error('Firestore error'));

      await expect(
        verificationTokenRepository.findByToken('abc123token')
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe('markAsUsed', () => {
    it('should mark a token as used', async () => {
      const mockTokenData = {
        userId: 'user123',
        token: 'abc123token',
        type: 'email_verification',
        expiresAt: { toDate: () => new Date('2024-12-31') },
        used: true,
        usedAt: { toDate: () => new Date() },
        createdAt: { toDate: () => new Date('2024-01-01') },
      };

      mockDoc.get
        .mockResolvedValueOnce({ exists: true })
        .mockResolvedValueOnce({
          id: 'token123',
          data: () => mockTokenData,
        });

      const result = await verificationTokenRepository.markAsUsed('token123');

      expect(mockDoc.update).toHaveBeenCalledWith({
        used: true,
        usedAt: expect.any(Date),
      });

      expect(result).toMatchObject({
        id: 'token123',
        used: true,
      });
    });

    it('should throw NotFoundError if token does not exist', async () => {
      mockDoc.get.mockResolvedValue({ exists: false });

      await expect(verificationTokenRepository.markAsUsed('nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw DatabaseError on failure', async () => {
      mockDoc.get.mockResolvedValue({ exists: true });
      mockDoc.update.mockRejectedValue(new Error('Firestore error'));

      await expect(verificationTokenRepository.markAsUsed('token123')).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('deleteExpired', () => {
    it('should delete expired tokens and return count', async () => {
      const mockDocs = [
        { ref: { path: 'tokens/token1' } },
        { ref: { path: 'tokens/token2' } },
        { ref: { path: 'tokens/token3' } },
      ];

      mockCollection.get.mockResolvedValue({
        empty: false,
        size: 3,
        docs: mockDocs,
      });

      const result = await verificationTokenRepository.deleteExpired();

      expect(mockCollection.where).toHaveBeenCalledWith('expiresAt', '<', expect.any(Date));
      expect(mockCollection.where).toHaveBeenCalledWith('used', '==', false);
      expect(mockBatch.delete).toHaveBeenCalledTimes(3);
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(result).toBe(3);
    });

    it('should return 0 if no expired tokens found', async () => {
      mockCollection.get.mockResolvedValue({
        empty: true,
        size: 0,
        docs: [],
      });

      const result = await verificationTokenRepository.deleteExpired();

      expect(result).toBe(0);
      expect(mockBatch.delete).not.toHaveBeenCalled();
      expect(mockBatch.commit).not.toHaveBeenCalled();
    });

    it('should throw DatabaseError on failure', async () => {
      mockCollection.get.mockRejectedValue(new Error('Firestore error'));

      await expect(verificationTokenRepository.deleteExpired()).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('findByUserId', () => {
    it('should find all tokens for a user', async () => {
      const mockTokens = [
        {
          id: 'token1',
          data: () => ({
            userId: 'user123',
            token: 'token1',
            type: 'email_verification',
            expiresAt: { toDate: () => new Date('2024-12-31') },
            used: false,
            createdAt: { toDate: () => new Date('2024-01-01') },
          }),
        },
        {
          id: 'token2',
          data: () => ({
            userId: 'user123',
            token: 'token2',
            type: 'password_reset',
            expiresAt: { toDate: () => new Date('2024-12-30') },
            used: true,
            usedAt: { toDate: () => new Date('2024-01-02') },
            createdAt: { toDate: () => new Date('2024-01-01') },
          }),
        },
      ];

      mockCollection.get.mockResolvedValue({
        docs: mockTokens,
      });

      const result = await verificationTokenRepository.findByUserId('user123');

      expect(mockCollection.where).toHaveBeenCalledWith('userId', '==', 'user123');
      expect(mockCollection.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('token1');
      expect(result[1].id).toBe('token2');
    });

    it('should throw DatabaseError on failure', async () => {
      mockCollection.get.mockRejectedValue(new Error('Firestore error'));

      await expect(verificationTokenRepository.findByUserId('user123')).rejects.toThrow(
        DatabaseError
      );
    });
  });

  describe('deleteById', () => {
    it('should delete a token by ID', async () => {
      mockDoc.get.mockResolvedValue({ exists: true });

      await verificationTokenRepository.deleteById('token123');

      expect(mockDoc.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundError if token does not exist', async () => {
      mockDoc.get.mockResolvedValue({ exists: false });

      await expect(verificationTokenRepository.deleteById('nonexistent')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw DatabaseError on failure', async () => {
      mockDoc.get.mockResolvedValue({ exists: true });
      mockDoc.delete.mockRejectedValue(new Error('Firestore error'));

      await expect(verificationTokenRepository.deleteById('token123')).rejects.toThrow(
        DatabaseError
      );
    });
  });
});
