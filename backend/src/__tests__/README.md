# Backend Testing Guide

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Test Structure

```
__tests__/
├── setup.ts              # Global test setup and Firebase mocks
├── utils/
│   └── testHelpers.ts   # Helper functions for creating mocks
├── factories/
│   ├── userFactory.ts
│   ├── propertyFactory.ts
│   ├── appointmentFactory.ts
│   ├── feedbackFactory.ts
│   └── index.ts
└── sample.test.ts       # Example tests
```

## Using Test Factories

```typescript
import { UserFactory, PropertyFactory } from './__tests__/factories';

// Create test data
const user = UserFactory.createSeller();
const property = PropertyFactory.create({ sellerId: user.id });
```

## Using Test Helpers

```typescript
import { createMockRequest, createMockResponse } from './__tests__/utils/testHelpers';

const req = createMockRequest({ body: { email: 'test@example.com' } });
const res = createMockResponse();
```

## Property-Based Testing

```typescript
import fc from 'fast-check';
import { propertyArbitrary } from './__tests__/factories';

/**
 * Feature: estate-bridge-mern, Property 11: Property Creation Round-Trip
 * Validates: Requirements 3.1
 */
it('should preserve property data in round-trip', () => {
  fc.assert(
    fc.asyncProperty(propertyArbitrary, async (property) => {
      // Test logic
    }),
    { numRuns: 100 }
  );
});
```

## Firebase Mocking

Firebase Admin SDK is automatically mocked in `setup.ts`. All Firebase operations will use mock implementations during tests.

## Test Database Configuration

For integration tests that need a real database:

1. Create a separate Firebase project for testing
2. Set environment variables in `.env.test`:
   ```
   FIREBASE_PROJECT_ID=your-test-project-id
   FIREBASE_PRIVATE_KEY=your-test-private-key
   FIREBASE_CLIENT_EMAIL=your-test-client-email
   ```
3. Use a different database for tests to avoid affecting production data

## Writing Tests

### Unit Test Template

```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should do something with valid input', async () => {
      // Arrange
      const input = Factory.create();
      
      // Act
      const result = await service.method(input);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.property).toBe(input.property);
    });
    
    it('should throw error with invalid input', async () => {
      // Arrange
      const invalidInput = {};
      
      // Act & Assert
      await expect(service.method(invalidInput)).rejects.toThrow();
    });
  });
});
```

### Integration Test Template

```typescript
import request from 'supertest';
import app from '../server';

describe('POST /api/v1/endpoint', () => {
  it('should create resource with valid data', async () => {
    const response = await request(app)
      .post('/api/v1/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .send(validData)
      .expect(201);
    
    expect(response.body.data).toMatchObject(validData);
  });
});
```

## Coverage Reports

After running `npm run test:coverage`, view the coverage report:

```bash
# Open in browser
open coverage/lcov-report/index.html
```

## Debugging Tests

```typescript
// Add console.log for debugging
console.log('Debug:', variable);

// Use Jest's debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Common Issues

### Issue: Tests timing out
**Solution**: Increase timeout in test file
```typescript
jest.setTimeout(15000);
```

### Issue: Firebase connection errors
**Solution**: Ensure Firebase is mocked in setup.ts

### Issue: Module not found
**Solution**: Check path aliases in jest.config.js and tsconfig.json
