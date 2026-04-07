import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { config, validateConfig } from './config';

// Validate environment variables and initialize Firebase
if (process.env.NODE_ENV !== 'test') {
  try {
    validateConfig();
  } catch (error) {
    logger.error('Configuration validation failed', { error });
    process.exit(1);
  }

  // Initialize Firebase (imported for side effects)
  try {
    require('./config/firebase');
    logger.info('Firebase Admin SDK initialized');
  } catch (error) {
    logger.error('Firebase initialization failed', { error });
    process.exit(1);
  }
}

const app: Application = express();
const PORT = config.port;

// Security middleware - Enhanced Helmet configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://firebasestorage.googleapis.com'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: config.security.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware with size limits
// 10mb for JSON payloads, 50mb for URL-encoded (file uploads will use multer)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request ID middleware (must be before Morgan)
app.use(requestIdMiddleware);

// HTTP request logging with Morgan
// Custom token to include request ID
morgan.token('request-id', (req: any) => req.requestId || 'N/A');

// Use different Morgan formats based on environment
if (config.nodeEnv === 'production') {
  // Production: JSON format for structured logging
  app.use(
    morgan(
      (tokens, req, res) => {
        return JSON.stringify({
          method: tokens.method(req, res),
          url: tokens.url(req, res),
          status: tokens.status(req, res),
          contentLength: tokens.res(req, res, 'content-length'),
          responseTime: `${tokens['response-time'](req, res)}ms`,
          requestId: tokens['request-id'](req, res),
          userAgent: tokens['user-agent'](req, res),
          remoteAddr: tokens['remote-addr'](req, res),
        });
      },
      {
        stream: {
          write: (message) => {
            const logData = JSON.parse(message);
            logger.info('HTTP Request', logData);
          },
        },
      }
    )
  );
} else {
  // Development: Human-readable format
  app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms [RequestID: :request-id]', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

// Global rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Auth-specific rate limiting (stricter for authentication endpoints)
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.authMaxRequests, // 5 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
app.use('/api/v1/auth', authLimiter);

// Health check endpoint
app.get('/api/v1/health', (_req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: '1.0.0',
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
    },
  });
});

// API routes
import authRoutes from './routes/authRoutes';
import propertyRoutes from './routes/propertyRoutes';
import searchRoutes from './routes/searchRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import aiSupportRoutes from './routes/aiSupportRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/ai-support', aiSupportRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🚀 Estate Bridge API server running on port ${PORT}`);
    logger.info(`📝 Environment: ${config.nodeEnv}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/api/v1/health`);
  });
}

export default app;
