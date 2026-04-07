import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',

  // Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  },

  // AI API
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    apiUrl: process.env.AI_API_URL || 'https://api.openai.com/v1',
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    authMaxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || '5', 10),
  },

  // PDF Generation
  pdf: {
    brochureExpiryHours: parseInt(process.env.PDF_BROCHURE_EXPIRY_HOURS || '1', 10),
    maxImagesPerPage: parseInt(process.env.PDF_MAX_IMAGES_PER_PAGE || '3', 10),
  },
};

// Validate required environment variables
export const validateConfig = () => {
  const required = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Export PDFKit configuration
export * from './pdfkit';
