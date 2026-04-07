import request from 'supertest';
import app from '../../server';
import { logger } from '../../utils/logger';

describe('HTTP Request Logging', () => {
  let loggerInfoSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation();
  });

  afterEach(() => {
    loggerInfoSpy.mockRestore();
  });

  describe('Morgan Middleware', () => {
    it('should log HTTP requests', async () => {
      await request(app).get('/api/v1/health');

      // Morgan should have logged the request
      expect(loggerInfoSpy).toHaveBeenCalled();
    });

    it('should include request method in logs', async () => {
      await request(app).get('/api/v1/health');

      const logCalls = loggerInfoSpy.mock.calls;
      const httpLogCall = logCalls.find((call) => {
        const message = call[0];
        return typeof message === 'string' && message.includes('GET');
      });

      expect(httpLogCall).toBeDefined();
    });

    it('should include request URL in logs', async () => {
      await request(app).get('/api/v1/health');

      const logCalls = loggerInfoSpy.mock.calls;
      const httpLogCall = logCalls.find((call) => {
        const message = call[0];
        return typeof message === 'string' && message.includes('/api/v1/health');
      });

      expect(httpLogCall).toBeDefined();
    });

    it('should include response status in logs', async () => {
      await request(app).get('/api/v1/health');

      const logCalls = loggerInfoSpy.mock.calls;
      const httpLogCall = logCalls.find((call) => {
        const message = call[0];
        return typeof message === 'string' && message.includes('200');
      });

      expect(httpLogCall).toBeDefined();
    });

    it('should log 404 responses', async () => {
      await request(app).get('/api/v1/nonexistent');

      const logCalls = loggerInfoSpy.mock.calls;
      const httpLogCall = logCalls.find((call) => {
        const message = call[0];
        return typeof message === 'string' && message.includes('404');
      });

      expect(httpLogCall).toBeDefined();
    });
  });

  describe('Request ID in Logs', () => {
    it('should include request ID in response headers', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should generate unique request IDs for different requests', async () => {
      const response1 = await request(app).get('/api/v1/health');
      const response2 = await request(app).get('/api/v1/health');

      expect(response1.headers['x-request-id']).not.toBe(response2.headers['x-request-id']);
    });
  });
});
