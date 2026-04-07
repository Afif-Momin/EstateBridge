# useCurrency Hook

A React hook for formatting currency values with proper symbols and formatting rules for USD and INR.

## Overview

The `useCurrency` hook provides currency formatting utilities that match the backend currency service logic, ensuring consistent price display across the Estate Bridge platform.

## Features

- **USD Formatting**: `$X,XXX.XX` with 2 decimal places and comma thousand separators
- **INR Formatting**: `₹X,XX,XXX` with 0 decimal places using Indian numbering system
- **Error Handling**: Validates input and throws descriptive errors for invalid amounts
- **Type Safety**: Full TypeScript support with proper type definitions

## Installation

The hook is already available in the project. Simply import it:

```typescript
import { useCurrency } from '@/hooks/useCurrency';
// or
import { formatPrice } from '@/hooks/useCurrency';
```

## Usage

### Basic Usage with Hook

```typescript
import { useCurrency } from '@/hooks/useCurrency';

function PropertyPrice({ property }) {
  const { formatPrice } = useCurrency();
  
  return (
    <div>
      {formatPrice(property.price, property.currency)}
    </div>
  );
}
```

### Direct Function Usage

```typescript
import { formatPrice } from '@/hooks/useCurrency';

function PriceTag({ amount, currency }) {
  return <span>{formatPrice(amount, currency)}</span>;
}
```

## API Reference

### `useCurrency()`

Returns an object with currency formatting utilities.

**Returns:**
```typescript
{
  formatPrice: (amount: number, currency: Currency) => string
}
```

### `formatPrice(amount, currency)`

Formats a price amount with proper currency symbol and formatting rules.

**Parameters:**
- `amount` (number): The price amount to format. Must be a finite, non-negative number.
- `currency` ('USD' | 'INR'): The currency code.

**Returns:**
- (string): Formatted price string with currency symbol and code.

**Throws:**
- Error if amount is not a finite number
- Error if amount is negative
- Error if amount is NaN or Infinity

**Examples:**

```typescript
formatPrice(1234.56, 'USD')    // "1,234.56 USD"
formatPrice(123456, 'INR')     // "₹1,23,456 INR"
formatPrice(1000000, 'USD')    // "1,000,000.00 USD"
formatPrice(10000000, 'INR')   // "₹1,00,00,000 INR"
```

## Formatting Rules

### USD (United States Dollar)

- **Symbol**: $ (dollar sign)
- **Decimal Places**: 2 (always shown)
- **Thousand Separator**: Comma (,)
- **Grouping**: Standard Western (groups of 3)
- **Format**: `X,XXX.XX USD`

Examples:
- `5.99` → `5.99 USD`
- `1,234.56` → `1,234.56 USD`
- `1,234,567.89` → `1,234,567.89 USD`

### INR (Indian Rupee)

- **Symbol**: ₹ (rupee sign)
- **Decimal Places**: 0 (rounded to nearest whole number)
- **Thousand Separator**: Comma (,)
- **Grouping**: Indian numbering system (first group of 3, then groups of 2)
- **Format**: `₹X,XX,XXX INR`

Examples:
- `999` → `₹999 INR`
- `1,000` → `₹1,000 INR`
- `10,000` → `₹10,000 INR`
- `1,00,000` → `₹1,00,000 INR`
- `10,00,000` → `₹10,00,000 INR`
- `1,23,45,678` → `₹1,23,45,678 INR`

## Error Handling

The `formatPrice` function validates input and throws descriptive errors:

```typescript
// Invalid type
formatPrice('1234', 'USD')  // Error: Invalid amount: must be a finite number

// Negative amount
formatPrice(-100, 'USD')    // Error: Invalid amount: must be non-negative

// Infinity
formatPrice(Infinity, 'USD') // Error: Invalid amount: must be a finite number

// NaN
formatPrice(NaN, 'USD')      // Error: Invalid amount: must be a finite number
```

Always wrap calls in try-catch when dealing with user input:

```typescript
try {
  const formatted = formatPrice(userInput, currency);
  return <span>{formatted}</span>;
} catch (error) {
  console.error('Invalid price:', error);
  return <span>Invalid price</span>;
}
```

## Requirements Validation

This hook validates the following requirements:

- **Requirement 18.1**: USD prices formatted with pattern $X,XXX.XX
- **Requirement 18.2**: INR prices formatted with pattern ₹X,XX,XXX.XX (Indian numbering)
- **Requirement 18.3**: Prices rounded to 2 decimal places for USD, 0 for INR
- **Requirement 18.4**: Currency code (USD/INR) displayed alongside formatted price

## Testing

The hook includes comprehensive unit tests covering:

- USD formatting with various amounts
- INR formatting with Indian numbering system
- Error handling for invalid inputs
- Edge cases (zero, very small/large amounts)
- Decimal rounding behavior

Run tests:
```bash
npm test -- useCurrency.test.ts
```

## Examples

See `useCurrency.example.tsx` for complete usage examples including:

- Basic price display
- Property cards
- Price range filters
- Error handling
- Multiple currency display

## Related Files

- **Backend Service**: `backend/src/services/currencyService.ts`
- **Types**: `frontend/src/types/index.ts`
- **Tests**: `frontend/src/hooks/__tests__/useCurrency.test.ts`
- **Examples**: `frontend/src/hooks/useCurrency.example.tsx`

## Notes

- The formatting logic matches the backend currency service exactly to ensure consistency
- INR uses the Indian numbering system (lakhs and crores) as per requirement 18.2
- Currency codes are always appended to formatted prices for clarity
- The hook is stateless and can be safely used in any component
