import request from 'supertest';
import app from '../../server';

describe('Security Middleware Integration', () => {
  describe('Helmet Security Headers on Real Server', () => {
    it('should set all required security headers on health endpoint', async () => {
      const response = await request(app).get('/api/v1/health');
      
      expect(response.status).toBe(200);
      
      // Helmet headers
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should set CSP with correct directives', async () => {
      const response = await request(app).get('/api/v1/health');
      
      const csp = response.headers['content-security-policy'];
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-src 'none'");
    });

    it('should set HSTS with correct configuration', async () => {
      const response = await request(app).get('/api/v1/health');
      
      const hsts = response.headers['strict-transport-security'];
      expect(hsts).toContain('max-age=31536000');
      expect(hsts).toContain('includeSubDomains');
      expect(hsts).toContain('preload');
    });
  });

  describe('CORS Configuration on Real Server', () => {
    it('should allow requests from whitelisted origin', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'http://localhost:5173');
      
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should not allow requests from non-whitelisted origin', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'http://malicious-site.com');
      
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should handle preflight requests correctly', async () => {
      const response = await request(app)
        .options('/api/v1/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');
      
      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });

  describe('Rate Limiting on Real Server', () => {
    it('should include rate limit headers in response', async () => {
      const response = await request(app).get('/api/v1/health');
      
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      expect(response.headers['ratelimit-reset']).toBeDefined();
    });

    it('should have global rate limit of 1000 requests', async () => {
      const response = await request(app).get('/api/v1/health');
      
      expect(response.headers['ratelimit-limit']).toBe('1000');
    });

    // Note: Testing actual rate limit exhaustion would require 100+ requests
    // which is impractical for integration tests. The unit tests cover this.
  });

  describe('Request Body Size Limits on Real Server', () => {
    it('should accept small JSON payloads', async () => {
      const smallPayload = { data: 'test data' };
      
      // Using health endpoint as a test endpoint (it doesn't process body but tests middleware)
      const response = await request(app)
        .get('/api/v1/health')
        .send(smallPayload)
        .set('Content-Type', 'application/json');
      
      expect(response.status).toBe(200);
    });

    it('should reject JSON payloads exceeding 10mb', async () => {
      // Create a payload larger than 10mb
      const largePayload = { data: 'a'.repeat(11 * 1024 * 1024) };
      
      const response = await request(app)
        .post('/api/v1/health') // Using POST to test body parsing
        .send(largePayload)
        .set('Content-Type', 'application/json');
      
      // Should be rejected by body parser before reaching route handler
      expect(response.status).toBe(413); // Payload Too Large
    });
  });

  describe('Security Headers on 404 Routes', () => {
    it('should apply security headers even on non-existent routes', async () => {
      const response = await request(app).get('/api/v1/non-existent-route');
      
      expect(response.status).toBe(404);
      
      // Security headers should still be present
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Combined Security Measures', () => {
    it('should apply all security measures together', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .set('Origin', 'http://localhost:5173');
      
      // Helmet headers
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      
      // CORS headers
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      
      // Rate limit headers
      expect(response.headers['ratelimit-limit']).toBe('1000');
      expect(response.headers['ratelimit-remaining']).toBeDefined();
      
      // Response should be successful
      expect(response.status).toBe(200);
    });
  });
});
