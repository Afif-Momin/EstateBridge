import { Request, Response } from 'express';

/**
 * Create a mock Express Request object
 */
export function createMockRequest(overrides?: Partial<Request>): Partial<Request> {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    method: 'GET',
    url: '/',
    ...overrides,
  };
}

/**
 * Create a mock Express Response object
 */
export function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Create a mock Next function
 */
export function createMockNext() {
  return jest.fn();
}

/**
 * Create a mock authenticated request with user context
 */
export function createAuthenticatedRequest(
  userId: string,
  _role: 'buyer' | 'seller',
  overrides?: Partial<Request>
): Partial<Request> {
  return createMockRequest({
    headers: {
      authorization: `Bearer mock-token-${userId}`,
    },
    ...overrides,
  });
}

/**
 * Wait for a promise to resolve or reject
 */
export async function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a random email for testing
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate a random UUID for testing
 */
export function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
