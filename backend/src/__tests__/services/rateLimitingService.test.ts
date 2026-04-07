import rateLimitingService from '../../services/rateLimitingService';
import rateLimitRepository from '../../repositories/rateLimitRepository';
import { RateLimitEntry } from '../../types';

// Mock the repository
jest.mock('../../repositories/rateLimitRepository');

describe('RateLimitingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkPropertyCreationLimit', () => {
    it('should allow creation when no existing entry', async () => {
      (rateLimitRepository.findByUserAndType as jest.Mock).mockResolvedValue(null);

      const result = await rateLimitingService.checkPropertyCreationLimit('user-123');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.resetAt).toBeUndefined();
    });

    it('should allow creation when window has expired', async () => {
      const expiredEntry: RateLimitEntry = {
        id: 'entry-1',
        userId: 'user-123',
        resourceType: 'property_creation',
        count: 5,
        windowStart: new Date('2024-01-01T00:00:00Z'),
        windowEnd: new Date('2024-01-01T23:59:59Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      (rateLimitRepository.findByUserAndType as jest.Mock).mockResolvedValue(expiredEntry);

      const result = await rateLimitingService.checkPropertyCreationLimit('user-123');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });

    it('should allow creation when count is below limit', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const entry: RateLimitEntry = {
        id: 'entry-1',
        userId: 'user-123',
        resourceType: 'property_creation',
        count: 3,
        windowStart: new Date(),
        windowEnd: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (rateLimitRepository.findByUserAndType as jest.Mock).mockResolvedValue(entry);

      const result = await rateLimitingService.checkPropertyCreationLimit('user-123');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.resetAt).toEqual(futureDate);
    });

    it('should reject creation when limit is reached', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const entry: RateLimitEntry = {
        id: 'entry-1',
        userId: 'user-123',
        resourceType: 'property_creation',
        count: 5,
        windowStart: new Date(),
        windowEnd: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (rateLimitRepository.findByUserAndType as jest.Mock).mockResolvedValue(entry);

      const result = await rateLimitingService.checkPropertyCreationLimit('user-123');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toEqual(futureDate);
    });

    it('should reject creation when limit is exceeded', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const entry: RateLimitEntry = {
        id: 'entry-1',
        userId: 'user-123',
        resourceType: 'property_creation',
        count: 6,
        windowStart: new Date(),
        windowEnd: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (rateLimitRepository.findByUserAndType as jest.Mock).mockResolvedValue(entry);

      const result = await rateLimitingService.checkPropertyCreationLimit('user-123');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toEqual(futureDate);
    });
  });

  describe('incrementPropertyCreationCount', () => {
    it('should increment count with correct window', async () => {
      (rateLimitRepository.incrementCount as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        userId: 'user-123',
        resourceType: 'property_creation',
        count: 1,
      });

      await rateLimitingService.incrementPropertyCreationCount('user-123');

      expect(rateLimitRepository.incrementCount).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          resourceType: 'property_creation',
          count: 1,
        })
      );

      const callArgs = (rateLimitRepository.incrementCount as jest.Mock).mock.calls[0][0];
      const windowDuration = callArgs.windowEnd.getTime() - callArgs.windowStart.getTime();
      const expectedDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      expect(windowDuration).toBe(expectedDuration);
    });
  });

  describe('checkAppointmentRequestLimit', () => {
    it('should allow request when no existing entry', async () => {
      (rateLimitRepository.findByUserAndType as jest.Mock).mockResolvedValue(null);

      const result = await rateLimitingService.checkAppointmentRequestLimit(
        'user-123',
        'property-456'
      );

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);
      expect(result.resetAt).toBeUndefined();
    });

    it('should allow request when count is below limit', async () => {
      const entry: RateLimitEntry = {
        id: 'entry-1',
        userId: 'user-123',
        resourceType: 'appointment_request',
        resourceId: 'property-456',
        count: 2,
        windowStart: new Date(),
        windowEnd: new Date('2099-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (rateLimitRepository.findByUserAndType as jest.Mock).mockResolvedValue(entry);

      const result = await rateLimitingService.checkAppointmentRequestLimit(
        'user-123',
        'property-456'
      );

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('should reject request when limit is reached', async () => {
      const entry: RateLimitEntry = {
        id: 'entry-1',
        userId: 'user-123',
        resourceType: 'appointment_request',
        resourceId: 'property-456',
        count: 3,
        windowStart: new Date(),
        windowEnd: new Date('2099-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (rateLimitRepository.findByUserAndType as jest.Mock).mockResolvedValue(entry);

      const result = await rateLimitingService.checkAppointmentRequestLimit(
        'user-123',
        'property-456'
      );

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should check with correct propertyId', async () => {
      (rateLimitRepository.findByUserAndType as jest.Mock).mockResolvedValue(null);

      await rateLimitingService.checkAppointmentRequestLimit(
        'user-123',
        'property-456'
      );

      expect(rateLimitRepository.findByUserAndType).toHaveBeenCalledWith(
        'user-123',
        'appointment_request',
        'property-456'
      );
    });
  });

  describe('incrementAppointmentRequestCount', () => {
    it('should increment count with correct resourceId', async () => {
      (rateLimitRepository.incrementCount as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        userId: 'user-123',
        resourceType: 'appointment_request',
        resourceId: 'property-456',
        count: 1,
      });

      await rateLimitingService.incrementAppointmentRequestCount(
        'user-123',
        'property-456'
      );

      expect(rateLimitRepository.incrementCount).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          resourceType: 'appointment_request',
          resourceId: 'property-456',
          count: 1,
        })
      );
    });

    it('should set far future windowEnd for permanent limit', async () => {
      (rateLimitRepository.incrementCount as jest.Mock).mockResolvedValue({
        id: 'entry-1',
      });

      await rateLimitingService.incrementAppointmentRequestCount(
        'user-123',
        'property-456'
      );

      const callArgs = (rateLimitRepository.incrementCount as jest.Mock).mock.calls[0][0];
      const windowEnd = callArgs.windowEnd;

      expect(windowEnd.getFullYear()).toBe(2099);
    });
  });

  describe('checkRegistrationRateLimit', () => {
    it('should allow registration when no existing entry', async () => {
      (rateLimitRepository.findByIP as jest.Mock).mockResolvedValue(null);

      const result = await rateLimitingService.checkRegistrationRateLimit('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.resetAt).toBeUndefined();
    });

    it('should allow registration when window has expired', async () => {
      const expiredEntry: RateLimitEntry = {
        id: 'entry-1',
        ipAddress: '192.168.1.1',
        resourceType: 'registration',
        count: 5,
        windowStart: new Date('2024-01-01T00:00:00Z'),
        windowEnd: new Date('2024-01-01T00:59:59Z'),
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      (rateLimitRepository.findByIP as jest.Mock).mockResolvedValue(expiredEntry);

      const result = await rateLimitingService.checkRegistrationRateLimit('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
    });

    it('should allow registration when count is below limit', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);
      const entry: RateLimitEntry = {
        id: 'entry-1',
        ipAddress: '192.168.1.1',
        resourceType: 'registration',
        count: 3,
        windowStart: new Date(),
        windowEnd: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (rateLimitRepository.findByIP as jest.Mock).mockResolvedValue(entry);

      const result = await rateLimitingService.checkRegistrationRateLimit('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.resetAt).toEqual(futureDate);
    });

    it('should reject registration when limit is reached', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);
      const entry: RateLimitEntry = {
        id: 'entry-1',
        ipAddress: '192.168.1.1',
        resourceType: 'registration',
        count: 5,
        windowStart: new Date(),
        windowEnd: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (rateLimitRepository.findByIP as jest.Mock).mockResolvedValue(entry);

      const result = await rateLimitingService.checkRegistrationRateLimit('192.168.1.1');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toEqual(futureDate);
    });
  });

  describe('incrementRegistrationAttempt', () => {
    it('should increment count with correct window', async () => {
      (rateLimitRepository.incrementCount as jest.Mock).mockResolvedValue({
        id: 'entry-1',
        ipAddress: '192.168.1.1',
        resourceType: 'registration',
        count: 1,
      });

      await rateLimitingService.incrementRegistrationAttempt('192.168.1.1');

      expect(rateLimitRepository.incrementCount).toHaveBeenCalledWith(
        expect.objectContaining({
          ipAddress: '192.168.1.1',
          resourceType: 'registration',
          count: 1,
        })
      );

      const callArgs = (rateLimitRepository.incrementCount as jest.Mock).mock.calls[0][0];
      const windowDuration = callArgs.windowEnd.getTime() - callArgs.windowStart.getTime();
      const expectedDuration = 60 * 60 * 1000; // 1 hour in milliseconds

      expect(windowDuration).toBe(expectedDuration);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from repository in checkPropertyCreationLimit', async () => {
      const error = new Error('Database error');
      (rateLimitRepository.findByUserAndType as jest.Mock).mockRejectedValue(error);

      await expect(
        rateLimitingService.checkPropertyCreationLimit('user-123')
      ).rejects.toThrow('Database error');
    });

    it('should propagate errors from repository in incrementPropertyCreationCount', async () => {
      const error = new Error('Database error');
      (rateLimitRepository.incrementCount as jest.Mock).mockRejectedValue(error);

      await expect(
        rateLimitingService.incrementPropertyCreationCount('user-123')
      ).rejects.toThrow('Database error');
    });

    it('should propagate errors from repository in checkAppointmentRequestLimit', async () => {
      const error = new Error('Database error');
      (rateLimitRepository.findByUserAndType as jest.Mock).mockRejectedValue(error);

      await expect(
        rateLimitingService.checkAppointmentRequestLimit('user-123', 'property-456')
      ).rejects.toThrow('Database error');
    });

    it('should propagate errors from repository in checkRegistrationRateLimit', async () => {
      const error = new Error('Database error');
      (rateLimitRepository.findByIP as jest.Mock).mockRejectedValue(error);

      await expect(
        rateLimitingService.checkRegistrationRateLimit('192.168.1.1')
      ).rejects.toThrow('Database error');
    });
  });
});
