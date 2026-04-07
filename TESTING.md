# Testing Infrastructure - Estate Bridge

This document describes the testing infrastructure for the Estate Bridge MERN platform.

## Overview

The Estate Bridge platform uses a comprehensive testing strategy that includes:

- **Property-Based Testing**: Using fast-check to validate universal properties across all inputs
- **Unit Testing**: Testing specific examples, edge cases, and error conditions
- **Integration Testing**: Testing interactions between components and services
- **End-to-End Testing**: Validating complete user workflows (to be implemented)

## Backend Testing

### Framework

- **Jest**: Test runner and assertion library
- **Supertest**: HTTP assertion library for API testing
- **fast-check**: Property-based testing library
- **ts-jest**: TypeScript support for Jest

### Configuration

The backend uses Jest with TypeScript support. Configuration is in `backend/jest.config.js`.

### Running Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Test Structure

```
backend/src/__tests__/
├── setup.ts                    # Test setup and Firebase mocks
├── utils/
│   └── testHelpers.ts         # Helper functions for tests
├── factories/
│   ├── userFactory.ts         # User test data factory
│   ├── propertyFactory.ts     # Property test data factory
│   ├── appointmentFactory.ts  # Appointment test data factory
│   ├── feedbackFactory.ts     # Feedback test data factory
│   └── index.ts               # Factory exports
└── sample.test.ts             # Sample tests
```

### Test Utilities

#### Mock Request/Response

```typescript
import { createMockRequest, createMockResponse, createMockNext } from './__tests__/utils/testHelpers';

const req = createMockRequest({ body: { email: 'test@example.com' } });
const res = createMockResponse();
const next = createMockNext();
```

#### Authenticated Request

```typescript
import { createAuthenticatedRequest } from './__tests__/utils/testHelpers';

const req = createAuthenticatedRequest('user-123', 'seller');
```

### Test Factories

#### User Factory

```typescript
import { UserFactory, userArbitrary } from './__tests__/factories';

// Create a single user
const user = UserFactory.create();
const seller = UserFactory.createSeller();
const buyer = UserFactory.createBuyer();

// Create multiple users
const users = UserFactory.createMany(5);

// Property-based testing
fc.assert(fc.property(userArbitrary, (user) => {
  // Test properties
}));
```

#### Property Factory

```typescript
import { PropertyFactory, propertyArbitrary } from './__tests__/factories';

const property = PropertyFactory.create();
const available = PropertyFactory.createAvailable();
const sold = PropertyFactory.createSold();
const properties = PropertyFactory.createMany(10);
```

### Writing Tests

#### Unit Test Example

```typescript
describe('PropertyService', () => {
  it('should create property with valid data', async () => {
    const propertyData = PropertyFactory.createDTO();
    const property = await propertyService.createProperty(propertyData, 'seller-123');
    
    expect(property).toMatchObject(propertyData);
    expect(property.sellerId).toBe('seller-123');
  });
});
```

#### Property-Based Test Example

```typescript
import fc from 'fast-check';
import { propertyArbitrary } from './__tests__/factories';

/**
 * Feature: estate-bridge-mern, Property 11: Property Creation Round-Trip
 * Validates: Requirements 3.1
 */
it('should preserve all property fields in round-trip', () => {
  fc.assert(
    fc.asyncProperty(propertyArbitrary, async (propertyData) => {
      const created = await propertyService.createProperty(propertyData, 'seller-123');
      const retrieved = await propertyRepository.findById(created.id);
      
      expect(retrieved.title).toBe(propertyData.title);
      expect(retrieved.price).toBe(propertyData.price);
      // ... more assertions
    }),
    { numRuns: 100 }
  );
});
```

## Frontend Testing

### Framework

- **Vitest**: Fast test runner for Vite projects
- **React Testing Library**: React component testing utilities
- **jsdom**: DOM implementation for Node.js
- **fast-check**: Property-based testing library

### Configuration

The frontend uses Vitest with React Testing Library. Configuration is in `frontend/vitest.config.ts`.

### Running Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Test Structure

```
frontend/src/__tests__/
├── setup.ts                    # Test setup and mocks
├── utils/
│   └── testUtils.tsx          # Custom render with providers
├── factories/
│   ├── userFactory.ts         # User test data factory
│   ├── propertyFactory.ts     # Property test data factory
│   ├── appointmentFactory.ts  # Appointment test data factory
│   ├── feedbackFactory.ts     # Feedback test data factory
│   └── index.ts               # Factory exports
└── sample.test.ts             # Sample tests
```

### Test Utilities

#### Custom Render with Providers

```typescript
import { render } from './__tests__/utils/testUtils';

const { getByText, store } = render(<MyComponent />);
```

This custom render automatically wraps components with:
- Redux Provider
- React Query Provider
- React Router

### Test Factories

Same as backend factories, but for frontend TypeScript types.

### Writing Tests

#### Component Test Example

```typescript
import { render, screen, fireEvent } from './__tests__/utils/testUtils';
import { PropertyCard } from '@components/property/PropertyCard';
import { PropertyFactory } from './__tests__/factories';

describe('PropertyCard', () => {
  it('should display property information', () => {
    const property = PropertyFactory.create();
    render(<PropertyCard property={property} />);
    
    expect(screen.getByText(property.title)).toBeInTheDocument();
    expect(screen.getByText(`$${property.price.toLocaleString()}`)).toBeInTheDocument();
  });
  
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    const property = PropertyFactory.create();
    
    render(<PropertyCard property={property} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledWith(property.id);
  });
});
```

## Property-Based Testing

### What is Property-Based Testing?

Property-based testing validates that certain properties (invariants) hold true across a wide range of inputs, rather than testing specific examples.

### When to Use

- Testing universal properties (e.g., "round-trip" operations)
- Validating data transformations
- Testing edge cases automatically
- Ensuring correctness across all valid inputs

### Example Properties

1. **Round-Trip Property**: Data should be preserved when saved and retrieved
2. **Idempotency**: Applying an operation twice should have the same effect as applying it once
3. **Invariants**: Certain conditions should always hold (e.g., price > 0)
4. **Commutativity**: Order of operations shouldn't matter (where applicable)

### Writing Property Tests

```typescript
import fc from 'fast-check';

/**
 * Feature: estate-bridge-mern, Property 1: User Registration Round-Trip
 * Validates: Requirements 1.1, 1.2
 */
it('should preserve all registration fields in round-trip', () => {
  fc.assert(
    fc.asyncProperty(
      fc.record({
        email: fc.emailAddress(),
        password: fc.string({ minLength: 8, maxLength: 50 }),
        fullName: fc.string({ minLength: 2, maxLength: 100 }),
        role: fc.constantFrom('buyer', 'seller')
      }),
      async (registrationData) => {
        const user = await authService.register(registrationData);
        const retrieved = await userRepository.findById(user.id);
        
        expect(retrieved.email).toBe(registrationData.email);
        expect(retrieved.fullName).toBe(registrationData.fullName);
        expect(retrieved.role).toBe(registrationData.role);
      }
    ),
    { numRuns: 100 }
  );
});
```

## Test Coverage Goals

- **Line Coverage**: 80% minimum
- **Branch Coverage**: 75% minimum
- **Function Coverage**: 85% minimum
- **Critical Paths**: 100% coverage

## Firebase Mocking

Both backend and frontend tests mock Firebase services to avoid hitting real Firebase during tests.

### Backend Mocks

Firebase Admin SDK is mocked in `backend/src/__tests__/setup.ts`.

### Frontend Mocks

Firebase Client SDK is mocked in `frontend/src/__tests__/setup.ts`.

## Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **One Assertion Per Test**: Focus each test on a single behavior
4. **Use Factories**: Use test factories for consistent test data
5. **Mock External Services**: Mock Firebase, AI API, and other external services
6. **Property Test Annotations**: Always annotate property tests with feature and requirement links
7. **Clean Up**: Clean up test data and resources after tests

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main/develop branches
- Pre-commit hooks (optional)

## Troubleshooting

### Tests Timing Out

Increase timeout in test file:
```typescript
jest.setTimeout(15000); // Backend
// or
test.setTimeout(15000); // Frontend
```

### Firebase Connection Errors

Ensure Firebase is properly mocked in setup files.

### Module Resolution Errors

Check path aliases in:
- `backend/jest.config.js`
- `frontend/vitest.config.ts`
- `tsconfig.json`

## Next Steps

1. Write property-based tests for all 43 correctness properties
2. Write unit tests for all services, controllers, and components
3. Write integration tests for API endpoints
4. Set up E2E testing with Playwright or Cypress
5. Configure CI/CD pipeline for automated testing
6. Set up code coverage reporting
