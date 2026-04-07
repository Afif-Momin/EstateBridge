import rateLimitRepository from '../repositories/rateLimitRepository';
import { logWithContext } from '../utils/logger';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt?: Date;
}

class RateLimitingService {
  // Rate limit constants
  private readonly PROPERTY_CREATION_LIMIT = 5;
  private readonly PROPERTY_CREATION_WINDOW_HOURS = 24;
  private readonly APPOINTMENT_REQUEST_LIMIT = 3;
  private readonly REGISTRATION_LIMIT = 5;
  private readonly REGISTRATION_WINDOW_HOURS = 1;

  /**
   * Check if user can create a property (5 per 24 hours)
   * Requirements: 5.1, 5.2, 5.3
   */
  async checkPropertyCreationLimit(userId: string): Promise<RateLimitResult> {
    try {
      const entry = await rateLimitRepository.findByUserAndType(
        userId,
        'property_creation'
      );

      if (!entry) {
        // No existing entry, user can create property
        return {
          allowed: true,
          remaining: this.PROPERTY_CREATION_LIMIT,
        };
      }

      // Check if window has expired
      const now = new Date();
      if (entry.windowEnd <= now) {
        // Window expired, user can create property
        return {
          allowed: true,
          remaining: this.PROPERTY_CREATION_LIMIT,
        };
      }

      // Check if limit exceeded
      if (entry.count >= this.PROPERTY_CREATION_LIMIT) {
        logWithContext('warn', 'Property creation rate limit exceeded', {
          userId,
          count: entry.count,
          resetAt: entry.windowEnd,
        });

        return {
          allowed: false,
          remaining: 0,
          resetAt: entry.windowEnd,
        };
      }

      // User can create property
      return {
        allowed: true,
        remaining: this.PROPERTY_CREATION_LIMIT - entry.count,
        resetAt: entry.windowEnd,
      };
    } catch (error) {
      logWithContext('error', 'Error checking property creation limit', {
        error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Increment property creation count for user
   * Requirements: 5.1, 5.2
   */
  async incrementPropertyCreationCount(userId: string): Promise<void> {
    try {
      const now = new Date();
      const windowEnd = new Date(
        now.getTime() + this.PROPERTY_CREATION_WINDOW_HOURS * 60 * 60 * 1000
      );

      await rateLimitRepository.incrementCount({
        userId,
        resourceType: 'property_creation',
        count: 1,
        windowStart: now,
        windowEnd,
      });

      logWithContext('info', 'Property creation count incremented', { userId });
    } catch (error) {
      logWithContext('error', 'Error incrementing property creation count', {
        error,
        userId,
      });
      throw error;
    }
  }

  /**
   * Check if user can request appointment for a property (3 per property)
   * Requirements: 10.1, 10.2
   */
  async checkAppointmentRequestLimit(
    userId: string,
    propertyId: string
  ): Promise<RateLimitResult> {
    try {
      const entry = await rateLimitRepository.findByUserAndType(
        userId,
        'appointment_request',
        propertyId
      );

      if (!entry) {
        // No existing entry, user can request appointment
        return {
          allowed: true,
          remaining: this.APPOINTMENT_REQUEST_LIMIT,
        };
      }

      // Check if limit exceeded
      if (entry.count >= this.APPOINTMENT_REQUEST_LIMIT) {
        logWithContext('warn', 'Appointment request rate limit exceeded', {
          userId,
          propertyId,
          count: entry.count,
        });

        return {
          allowed: false,
          remaining: 0,
        };
      }

      // User can request appointment
      return {
        allowed: true,
        remaining: this.APPOINTMENT_REQUEST_LIMIT - entry.count,
      };
    } catch (error) {
      logWithContext('error', 'Error checking appointment request limit', {
        error,
        userId,
        propertyId,
      });
      throw error;
    }
  }

  /**
   * Increment appointment request count for user and property
   * Requirements: 10.1, 10.2
   */
  async incrementAppointmentRequestCount(
    userId: string,
    propertyId: string
  ): Promise<void> {
    try {
      const now = new Date();
      // Appointment limits don't expire (permanent per property)
      const windowEnd = new Date('2099-12-31');

      await rateLimitRepository.incrementCount({
        userId,
        resourceType: 'appointment_request',
        resourceId: propertyId,
        count: 1,
        windowStart: now,
        windowEnd,
      });

      logWithContext('info', 'Appointment request count incremented', {
        userId,
        propertyId,
      });
    } catch (error) {
      logWithContext('error', 'Error incrementing appointment request count', {
        error,
        userId,
        propertyId,
      });
      throw error;
    }
  }

  /**
   * Check if IP address can register (5 per hour)
   * Requirements: 3.4, 3.5
   */
  async checkRegistrationRateLimit(ipAddress: string): Promise<RateLimitResult> {
    try {
      const entry = await rateLimitRepository.findByIP(
        ipAddress,
        'registration'
      );

      if (!entry) {
        // No existing entry, IP can register
        return {
          allowed: true,
          remaining: this.REGISTRATION_LIMIT,
        };
      }

      // Check if window has expired
      const now = new Date();
      if (entry.windowEnd <= now) {
        // Window expired, IP can register
        return {
          allowed: true,
          remaining: this.REGISTRATION_LIMIT,
        };
      }

      // Check if limit exceeded
      if (entry.count >= this.REGISTRATION_LIMIT) {
        logWithContext('warn', 'Registration rate limit exceeded', {
          ipAddress,
          count: entry.count,
          resetAt: entry.windowEnd,
        });

        return {
          allowed: false,
          remaining: 0,
          resetAt: entry.windowEnd,
        };
      }

      // IP can register
      return {
        allowed: true,
        remaining: this.REGISTRATION_LIMIT - entry.count,
        resetAt: entry.windowEnd,
      };
    } catch (error) {
      logWithContext('error', 'Error checking registration rate limit', {
        error,
        ipAddress,
      });
      throw error;
    }
  }

  /**
   * Increment registration attempt count for IP address
   * Requirements: 3.4, 3.5
   */
  async incrementRegistrationAttempt(ipAddress: string): Promise<void> {
    try {
      const now = new Date();
      const windowEnd = new Date(
        now.getTime() + this.REGISTRATION_WINDOW_HOURS * 60 * 60 * 1000
      );

      await rateLimitRepository.incrementCount({
        ipAddress,
        resourceType: 'registration',
        count: 1,
        windowStart: now,
        windowEnd,
      });

      logWithContext('info', 'Registration attempt count incremented', {
        ipAddress,
      });
    } catch (error) {
      logWithContext('error', 'Error incrementing registration attempt count', {
        error,
        ipAddress,
      });
      throw error;
    }
  }
}

export default new RateLimitingService();
