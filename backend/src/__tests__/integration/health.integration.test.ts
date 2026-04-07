import request from 'supertest';
import app from '../../server';

describe('Health Check Endpoint', () => {
  describe('GET /api/v1/health', () => {
    it('should return 200 status code', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
    });

    it('should return healthy status', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body.status).toBe('healthy');
    });

    it('should include timestamp', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp).toString()).not.toBe('Invalid Date');
    });

    it('should include uptime', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body.uptime).toBeDefined();
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should include environment', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body.environment).toBeDefined();
      expect(typeof response.body.environment).toBe('string');
    });

    it('should include version', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body.version).toBeDefined();
      expect(response.body.version).toBe('1.0.0');
    });

    it('should include memory usage information', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body.memory).toBeDefined();
      expect(response.body.memory.rss).toBeDefined();
      expect(response.body.memory.heapTotal).toBeDefined();
      expect(response.body.memory.heapUsed).toBeDefined();
      expect(response.body.memory.external).toBeDefined();
    });

    it('should return memory values in MB format', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.body.memory.rss).toMatch(/^\d+MB$/);
      expect(response.body.memory.heapTotal).toMatch(/^\d+MB$/);
      expect(response.body.memory.heapUsed).toMatch(/^\d+MB$/);
      expect(response.body.memory.external).toMatch(/^\d+MB$/);
    });

    it('should return consistent structure on multiple calls', async () => {
      const response1 = await request(app).get('/api/v1/health');
      const response2 = await request(app).get('/api/v1/health');

      expect(Object.keys(response1.body).sort()).toEqual(Object.keys(response2.body).sort());
      expect(Object.keys(response1.body.memory).sort()).toEqual(
        Object.keys(response2.body.memory).sort()
      );
    });

    it('should have increasing uptime on subsequent calls', async () => {
      const response1 = await request(app).get('/api/v1/health');
      
      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const response2 = await request(app).get('/api/v1/health');

      expect(response2.body.uptime).toBeGreaterThanOrEqual(response1.body.uptime);
    });
  });
});
