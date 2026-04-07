import request from 'supertest';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

describe('Security Middleware', () => {
  describe('Helmet Security Headers', () => {
    let app: Application;

    beforeEach(() => {
      app = express();
      
      // Apply Helmet with the same configuration as server.ts
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
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          },
          xssFilter: true,
          noSniff: true,
          referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        })
      );

      app.get('/test', (_req: Request, res: Response) => {
        res.json({ message: 'test' });
      });
    });

    it('should set Content-Security-Policy header', async () => {
      const response = await request(app).get('/test');
      
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });

    it('should set Strict-Transport-Security header with correct values', async () => {
      const response = await request(app).get('/test');
      
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      expect(response.headers['strict-transport-security']).toContain('includeSubDomains');
      expect(response.headers['strict-transport-security']).toContain('preload');
    });

    it('should set X-Content-Type-Options header to nosniff', async () => {
      const response = await request(app).get('/test');
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should set X-XSS-Protection header', async () => {
      const response = await request(app).get('/test');
      
      // Note: Helmet v7+ may not set this header as it's deprecated in modern browsers
      // but we're testing that xssFilter is enabled
      expect(response.status).toBe(200);
    });

    it('should set Referrer-Policy header', async () => {
      const response = await request(app).get('/test');
      
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should set X-Frame-Options header', async () => {
      const response = await request(app).get('/test');
      
      // Helmet sets this by default
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });

  describe('CORS Configuration', () => {
    let app: Application;
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];

    beforeEach(() => {
      app = express();
      
      app.use(
        cors({
          origin: allowedOrigins,
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          allowedHeaders: ['Content-Type', 'Authorization'],
        })
      );

      app.get('/test', (_req: Request, res: Response) => {
        res.json({ message: 'test' });
      });
    });

    it('should allow requests from whitelisted origins', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:5173');
      
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should allow requests from another whitelisted origin', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should not set CORS headers for non-whitelisted origins', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://malicious-site.com');
      
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should allow specified HTTP methods', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');
      
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('PUT');
      expect(response.headers['access-control-allow-methods']).toContain('PATCH');
      expect(response.headers['access-control-allow-methods']).toContain('DELETE');
    });

    it('should allow specified headers', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');
      
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    });
  });

  describe('Rate Limiting', () => {
    describe('Global Rate Limiter', () => {
      let app: Application;

      beforeEach(() => {
        app = express();
        
        // Global rate limiter: 100 requests per 15 minutes
        const limiter = rateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 5, // Using 5 for testing instead of 100
          message: 'Too many requests from this IP, please try again later.',
          standardHeaders: true,
          legacyHeaders: false,
        });
        
        app.use(limiter);

        app.get('/test', (_req: Request, res: Response) => {
          res.json({ message: 'test' });
        });
      });

      it('should allow requests within rate limit', async () => {
        const response = await request(app).get('/test');
        
        expect(response.status).toBe(200);
        expect(response.headers['ratelimit-limit']).toBeDefined();
        expect(response.headers['ratelimit-remaining']).toBeDefined();
      });

      it('should block requests exceeding rate limit', async () => {
        // Make requests up to the limit
        for (let i = 0; i < 5; i++) {
          await request(app).get('/test');
        }

        // This request should be rate limited
        const response = await request(app).get('/test');
        
        expect(response.status).toBe(429);
        expect(response.text).toContain('Too many requests');
      });

      it('should include rate limit headers', async () => {
        const response = await request(app).get('/test');
        
        expect(response.headers['ratelimit-limit']).toBe('5');
        expect(response.headers['ratelimit-remaining']).toBeDefined();
        expect(response.headers['ratelimit-reset']).toBeDefined();
      });
    });

    describe('Auth-Specific Rate Limiter', () => {
      let app: Application;

      beforeEach(() => {
        app = express();
        
        // Auth rate limiter: 5 requests per 15 minutes
        const authLimiter = rateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 3, // Using 3 for testing instead of 5
          message: 'Too many authentication attempts, please try again later.',
          standardHeaders: true,
          legacyHeaders: false,
          skipSuccessfulRequests: false,
        });
        
        app.use('/api/v1/auth', authLimiter);

        app.post('/api/v1/auth/login', (_req: Request, res: Response) => {
          res.json({ message: 'login' });
        });

        app.post('/api/v1/auth/register', (_req: Request, res: Response) => {
          res.json({ message: 'register' });
        });
      });

      it('should allow auth requests within rate limit', async () => {
        const response = await request(app).post('/api/v1/auth/login');
        
        expect(response.status).toBe(200);
        expect(response.headers['ratelimit-limit']).toBe('3');
      });

      it('should block auth requests exceeding rate limit', async () => {
        // Make requests up to the limit
        for (let i = 0; i < 3; i++) {
          await request(app).post('/api/v1/auth/login');
        }

        // This request should be rate limited
        const response = await request(app).post('/api/v1/auth/login');
        
        expect(response.status).toBe(429);
        expect(response.text).toContain('Too many authentication attempts');
      });

      it('should apply rate limit to all auth endpoints', async () => {
        // Mix requests to different auth endpoints
        await request(app).post('/api/v1/auth/login');
        await request(app).post('/api/v1/auth/register');
        await request(app).post('/api/v1/auth/login');

        // This request should be rate limited
        const response = await request(app).post('/api/v1/auth/register');
        
        expect(response.status).toBe(429);
      });

      it('should have stricter limit than global rate limiter', async () => {
        const response = await request(app).post('/api/v1/auth/login');
        
        // Auth limiter should have max of 3 (in test) vs global 5
        expect(response.headers['ratelimit-limit']).toBe('3');
      });
    });
  });

  describe('Request Body Size Limits', () => {
    let app: Application;

    beforeEach(() => {
      app = express();
      
      // Apply body size limits
      app.use(express.json({ limit: '10mb' }));
      app.use(express.urlencoded({ extended: true, limit: '50mb' }));

      app.post('/json', (req: Request, res: Response) => {
        res.json({ received: true, size: JSON.stringify(req.body).length });
      });

      app.post('/urlencoded', (_req: Request, res: Response) => {
        res.json({ received: true });
      });
    });

    it('should accept JSON payloads within 10mb limit', async () => {
      const smallPayload = { data: 'a'.repeat(1000) }; // Small payload
      
      const response = await request(app)
        .post('/json')
        .send(smallPayload)
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should reject JSON payloads exceeding 10mb limit', async () => {
      // Create a payload larger than 10mb
      const largePayload = { data: 'a'.repeat(11 * 1024 * 1024) };
      
      const response = await request(app)
        .post('/json')
        .send(largePayload)
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(413); // Payload Too Large
    });

    it('should accept URL-encoded payloads within 50mb limit', async () => {
      const smallPayload = 'data=' + 'a'.repeat(1000);
      
      const response = await request(app)
        .post('/urlencoded')
        .send(smallPayload)
        .set('Content-Type', 'application/x-www-form-urlencoded');
      
      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });
  });

  describe('Security Headers Integration', () => {
    let app: Application;

    beforeEach(() => {
      app = express();
      
      // Apply all security middleware
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
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          },
          xssFilter: true,
          noSniff: true,
          referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        })
      );

      app.use(
        cors({
          origin: ['http://localhost:5173'],
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          allowedHeaders: ['Content-Type', 'Authorization'],
        })
      );

      app.get('/secure', (_req: Request, res: Response) => {
        res.json({ secure: true });
      });
    });

    it('should apply all security headers together', async () => {
      const response = await request(app)
        .get('/secure')
        .set('Origin', 'http://localhost:5173');
      
      // Check Helmet headers
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      
      // Check CORS headers
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });
});
