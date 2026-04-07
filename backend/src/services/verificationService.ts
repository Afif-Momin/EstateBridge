import crypto from 'crypto';
import { getFirebaseFirestore } from '../config/firebase';
import verificationTokenRepository from '../repositories/verificationTokenRepository';
import { logWithContext } from '../utils/logger';
import { COLLECTIONS } from '../constants';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

/**
 * Google reCAPTCHA API response interface
 */
interface RecaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  score?: number;
  action?: string;
  'error-codes'?: string[];
}

/**
 * Verification Service
 * Handles email verification token generation, email sending, token verification, and CAPTCHA validation
 */
class VerificationService {
  private readonly TOKEN_EXPIRY_HOURS = 24;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly RECAPTCHA_SCORE_THRESHOLD = 0.5;
  private readonly CAPTCHA_TOKEN_EXPIRY_MINUTES = 2;

  /**
   * Generate a cryptographically secure verification token
   * @param userId - The user ID to generate token for
   * @returns The generated token string
   */
  async generateVerificationToken(userId: string): Promise<string> {
    try {
      // Generate 32 random bytes and convert to hex string
      const token = crypto.randomBytes(32).toString('hex');
      
      // Calculate expiration time (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

      // Store token in database
      await verificationTokenRepository.create({
        userId,
        token,
        type: 'email_verification',
        expiresAt,
      });

      logWithContext('info', 'Verification token generated', { userId });

      return token;
    } catch (error) {
      logWithContext('error', 'Error generating verification token', { error, userId });
      throw error;
    }
  }

  /**
   * Validate CAPTCHA token with Google reCAPTCHA API
   * @param token - The CAPTCHA token from the client
   * @param action - The action being performed (e.g., 'register')
   * @returns True if CAPTCHA is valid, false otherwise
   */
  async validateCaptcha(token: string, action: string): Promise<boolean> {
    try {
      const secretKey = process.env.RECAPTCHA_V3_SECRET_KEY;
      
      if (!secretKey) {
        logWithContext('error', 'RECAPTCHA_V3_SECRET_KEY not configured');
        throw new Error('CAPTCHA validation not configured');
      }

      // Make request to Google reCAPTCHA API
      const response = await this.makeRecaptchaRequest(token, secretKey);

      // Check if request was successful
      if (!response.success) {
        logWithContext('warn', 'CAPTCHA validation failed', { 
          errorCodes: response['error-codes'],
          action 
        });
        return false;
      }

      // Check if action matches (for v3)
      if (response.action && response.action !== action) {
        logWithContext('warn', 'CAPTCHA action mismatch', { 
          expected: action,
          received: response.action 
        });
        return false;
      }

      // Check token expiration (2 minutes)
      if (response.challenge_ts) {
        const tokenTime = new Date(response.challenge_ts);
        const now = new Date();
        const ageMinutes = (now.getTime() - tokenTime.getTime()) / (1000 * 60);
        
        if (ageMinutes > this.CAPTCHA_TOKEN_EXPIRY_MINUTES) {
          logWithContext('warn', 'CAPTCHA token expired', { 
            ageMinutes,
            threshold: this.CAPTCHA_TOKEN_EXPIRY_MINUTES 
          });
          return false;
        }
      }

      // For v3, check score threshold (0.5)
      if (response.score !== undefined) {
        if (response.score < this.RECAPTCHA_SCORE_THRESHOLD) {
          logWithContext('warn', 'CAPTCHA score below threshold', { 
            score: response.score,
            threshold: this.RECAPTCHA_SCORE_THRESHOLD,
            action 
          });
          return false;
        }
        
        logWithContext('info', 'CAPTCHA v3 validation successful', { 
          score: response.score,
          action 
        });
      } else {
        // v2 checkbox - no score, just success
        logWithContext('info', 'CAPTCHA v2 validation successful', { action });
      }

      return true;
    } catch (error) {
      logWithContext('error', 'Error validating CAPTCHA', { error, action });
      throw error;
    }
  }

  /**
   * Make HTTP request to Google reCAPTCHA API
   * @param token - The CAPTCHA token
   * @param secretKey - The reCAPTCHA secret key
   * @returns The reCAPTCHA API response
   */
  private async makeRecaptchaRequest(
    token: string,
    secretKey: string
  ): Promise<RecaptchaResponse> {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const querystring = require('querystring');

      const postData = querystring.stringify({
        secret: secretKey,
        response: token,
      });

      const options = {
        hostname: 'www.google.com',
        port: 443,
        path: '/recaptcha/api/siteverify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res: any) => {
        let data = '';

        res.on('data', (chunk: any) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(new Error('Failed to parse reCAPTCHA response'));
          }
        });
      });

      req.on('error', (error: Error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Send verification email with retry logic
   * @param email - The recipient email address
   * @param token - The verification token
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        await this.sendEmail(email, token);
        
        logWithContext('info', 'Verification email sent successfully', { 
          email, 
          attempt 
        });
        
        return;
      } catch (error) {
        lastError = error as Error;
        
        logWithContext('warn', 'Failed to send verification email', { 
          email, 
          attempt, 
          error 
        });

        // Wait before retrying (exponential backoff)
        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    // All retry attempts failed
    logWithContext('error', 'All email send attempts failed', { 
      email, 
      attempts: this.MAX_RETRY_ATTEMPTS 
    });
    
    throw new Error(`Failed to send verification email after ${this.MAX_RETRY_ATTEMPTS} attempts: ${lastError?.message}`);
  }

  /**
   * Verify an email token
   * @param token - The verification token to verify
   * @returns Object with userId and validity status
   */
  async verifyEmailToken(token: string): Promise<{ userId: string; valid: boolean }> {
    try {
      // Find token in database
      const verificationToken = await verificationTokenRepository.findByToken(token);

      if (!verificationToken) {
        logWithContext('warn', 'Verification token not found', { token });
        return { userId: '', valid: false };
      }

      // Check if token has already been used
      if (verificationToken.used) {
        logWithContext('warn', 'Verification token already used', { 
          tokenId: verificationToken.id 
        });
        return { userId: verificationToken.userId, valid: false };
      }

      // Check if token has expired (24 hours)
      const now = new Date();
      if (verificationToken.expiresAt < now) {
        logWithContext('warn', 'Verification token expired', { 
          tokenId: verificationToken.id,
          expiresAt: verificationToken.expiresAt 
        });
        return { userId: verificationToken.userId, valid: false };
      }

      // Token is valid - mark as used
      await verificationTokenRepository.markAsUsed(verificationToken.id);

      // Update user's emailVerified status
      const db = getFirebaseFirestore();
      await db.collection(COLLECTIONS.USERS).doc(verificationToken.userId).update({
        emailVerified: true,
        updatedAt: now,
      });

      logWithContext('info', 'Email verified successfully', { 
        userId: verificationToken.userId 
      });

      return { userId: verificationToken.userId, valid: true };
    } catch (error) {
      logWithContext('error', 'Error verifying email token', { error, token });
      throw error;
    }
  }

  /**
   * Resend verification email
   * @param email - The user's email address
   */
  async resendVerificationEmail(email: string): Promise<void> {
    try {
      // Find user by email
      const db = getFirebaseFirestore();
      const usersSnapshot = await db
        .collection(COLLECTIONS.USERS)
        .where('email', '==', email)
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        throw new NotFoundError('User not found');
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();

      // Check if already verified
      if (userData.emailVerified) {
        throw new ValidationError('Email is already verified');
      }

      // Generate new token
      const token = await this.generateVerificationToken(userDoc.id);

      // Send email
      await this.sendVerificationEmail(email, token);

      logWithContext('info', 'Verification email resent', { email });
    } catch (error) {
      logWithContext('error', 'Error resending verification email', { error, email });
      throw error;
    }
  }

  /**
   * Check if a user's email is verified
   * @param userId - The user ID to check
   * @returns True if email is verified, false otherwise
   */
  async isEmailVerified(userId: string): Promise<boolean> {
    try {
      const db = getFirebaseFirestore();
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();

      if (!userDoc.exists) {
        throw new NotFoundError('User not found');
      }

      const userData = userDoc.data();
      return userData?.emailVerified === true;
    } catch (error) {
      logWithContext('error', 'Error checking email verification status', { 
        error, 
        userId 
      });
      throw error;
    }
  }

  /**
   * Internal method to send email
   * Note: This is a placeholder implementation. In production, this should use
   * a proper email service like SendGrid, AWS SES, or Nodemailer with SMTP.
   * @param email - The recipient email address
   * @param token - The verification token
   */
  private async sendEmail(email: string, token: string): Promise<void> {
    // TODO: Implement actual email sending using a service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    // - Firebase Extensions (Trigger Email)
    
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    const subject = 'Verify Your Estate Bridge Account';

    // For development/testing: Log the email instead of sending
    if (process.env.NODE_ENV === 'development') {
      logWithContext('info', 'Email would be sent (development mode)', {
        to: email,
        subject,
        verificationLink,
      });
      
      // Simulate email sending delay
      await this.sleep(100);
      return;
    }

    // In production, this should actually send the email
    // Example with Nodemailer:
    // const transporter = nodemailer.createTransport({ ... });
    // const htmlBody = `...email template...`;
    // await transporter.sendMail({ from, to: email, subject, html: htmlBody });
    
    throw new Error('Email service not configured. Please set up an email provider.');
  }

  /**
   * Helper method to sleep for a specified duration
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new VerificationService();
