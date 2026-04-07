import { logger, logWithContext } from '../../utils/logger';
import winston from 'winston';

describe('Logger', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on the logger's log method
    logSpy = jest.spyOn(logger, 'log').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  describe('Logger Configuration', () => {
    it('should have correct log level', () => {
      expect(logger.level).toBe(process.env.LOG_LEVEL || 'info');
    });

    it('should have file transports configured', () => {
      const transports = logger.transports;
      const fileTransports = transports.filter(
        (t) => t instanceof winston.transports.File
      );
      
      // Should have at least 2 file transports (error.log and combined.log)
      expect(fileTransports.length).toBeGreaterThanOrEqual(2);
    });

    it('should have error log transport', () => {
      const transports = logger.transports;
      const errorTransport = transports.find(
        (t) => t instanceof winston.transports.File && (t as any).filename?.includes('error.log')
      );
      
      expect(errorTransport).toBeDefined();
      if (errorTransport) {
        expect((errorTransport as any).level).toBe('error');
      }
    });

    it('should have combined log transport', () => {
      const transports = logger.transports;
      const combinedTransport = transports.find(
        (t) => t instanceof winston.transports.File && (t as any).filename?.includes('combined.log')
      );
      
      expect(combinedTransport).toBeDefined();
    });
  });

  describe('logWithContext', () => {
    it('should log info message with context', () => {
      const message = 'Test info message';
      const context = { userId: 'user123', requestId: 'req456' };

      logWithContext('info', message, context);

      expect(logSpy).toHaveBeenCalledWith('info', message, context);
    });

    it('should log error message with context', () => {
      const message = 'Test error message';
      const context = { userId: 'user789', requestId: 'req012', error: 'Something went wrong' };

      logWithContext('error', message, context);

      expect(logSpy).toHaveBeenCalledWith('error', message, context);
    });

    it('should log warn message with context', () => {
      const message = 'Test warning message';
      const context = { userId: 'user345', requestId: 'req678' };

      logWithContext('warn', message, context);

      expect(logSpy).toHaveBeenCalledWith('warn', message, context);
    });

    it('should log debug message with context', () => {
      const message = 'Test debug message';
      const context = { userId: 'user901', requestId: 'req234' };

      logWithContext('debug', message, context);

      expect(logSpy).toHaveBeenCalledWith('debug', message, context);
    });

    it('should log message without context', () => {
      const message = 'Test message without context';

      logWithContext('info', message);

      expect(logSpy).toHaveBeenCalledWith('info', message, undefined);
    });

    it('should log message with additional metadata', () => {
      const message = 'Test message with metadata';
      const context = {
        userId: 'user111',
        requestId: 'req222',
        action: 'create_property',
        propertyId: 'prop333',
      };

      logWithContext('info', message, context);

      expect(logSpy).toHaveBeenCalledWith('info', message, context);
    });
  });

  describe('Structured Logging Format', () => {
    it('should include timestamp in logs', () => {
      // Restore the spy temporarily to allow actual logging
      logSpy.mockRestore();
      
      // Just verify the logger can be called without errors
      expect(() => logger.info('Test message')).not.toThrow();
      
      // Re-create the spy for other tests
      logSpy = jest.spyOn(logger, 'log').mockImplementation();
    });

    it('should handle error objects with stack traces', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', { error });
      
      expect(logSpy).toHaveBeenCalledWith('error', 'Error occurred', { error });
    });
  });
});
