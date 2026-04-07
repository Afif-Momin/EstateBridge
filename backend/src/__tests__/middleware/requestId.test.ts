import { Request, Response, NextFunction } from 'express';
import { requestIdMiddleware } from '../../middleware/requestId';

describe('Request ID Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      setHeader: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should add requestId to request object', () => {
    requestIdMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.requestId).toBeDefined();
    expect(typeof mockRequest.requestId).toBe('string');
    expect(mockRequest.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('should set X-Request-ID header in response', () => {
    requestIdMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', mockRequest.requestId);
  });

  it('should call next function', () => {
    requestIdMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should generate unique request IDs', () => {
    const mockRequest1: Partial<Request> = {};
    const mockRequest2: Partial<Request> = {};
    const mockResponse1: Partial<Response> = { setHeader: jest.fn() };
    const mockResponse2: Partial<Response> = { setHeader: jest.fn() };

    requestIdMiddleware(mockRequest1 as Request, mockResponse1 as Response, nextFunction);
    requestIdMiddleware(mockRequest2 as Request, mockResponse2 as Response, nextFunction);

    expect(mockRequest1.requestId).toBeDefined();
    expect(mockRequest2.requestId).toBeDefined();
    expect(mockRequest1.requestId).not.toBe(mockRequest2.requestId);
  });
});
