# Frontend Testing Guide

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Test Structure

```
__tests__/
├── setup.ts              # Global test setup and mocks
├── utils/
│   └── testUtils.tsx    # Custom render with providers
├── factories/
│   ├── userFactory.ts
│   ├── propertyFactory.ts
│   ├── appointmentFactory.ts
│   ├── feedbackFactory.ts
│   └── index.ts
└── sample.test.ts       # Example tests
```

## Using Custom Render

```typescript
import { render, screen } from './__tests__/utils/testUtils';

const { getByText, store } = render(<MyComponent />);
```

The custom render includes:
- Redux Provider
- React Query Provider
- React Router

## Using Test Factories

```typescript
import { UserFactory, PropertyFactory } from './__tests__/factories';

const user = UserFactory.createBuyer();
const property = PropertyFactory.create();
```

## Component Testing

```typescript
import { render, screen, fireEvent } from './__tests__/utils/testUtils';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```
