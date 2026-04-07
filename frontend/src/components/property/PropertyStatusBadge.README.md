# PropertyStatusBadge Component

A reusable badge component for displaying property status with color-coded styling and icons.

## Features

- ✅ Color-coded status display (success, info, warning, error, neutral)
- ✅ Icon support for each status type
- ✅ Three size variants (sm, md, lg)
- ✅ Fully accessible with ARIA attributes
- ✅ TailwindCSS styling
- ✅ TypeScript support
- ✅ Customizable with className prop

## Usage

```tsx
import { PropertyStatusBadge } from './components/property/PropertyStatusBadge';

// Basic usage
<PropertyStatusBadge status="For Sale" />

// With size variant
<PropertyStatusBadge status="Waiting for Admin Approval" size="lg" />

// With custom styling
<PropertyStatusBadge status="Rejected" className="shadow-md" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `PropertyProStatus` | required | The property status to display |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant of the badge |
| `className` | `string` | `''` | Additional CSS classes |

## Status Types & Colors

| Status | Color | Icon |
|--------|-------|------|
| For Sale | Green (success) | Shopping cart |
| For Rent | Green (success) | Key |
| Under Construction | Blue (info) | Construction cone |
| Waiting for Admin Approval | Yellow (warning) | Clock |
| Rejected | Red (error) | X circle |
| Closed | Gray (neutral) | Lock |
| Finished | Gray (neutral) | Check circle |

## Size Variants

- **sm**: Small badge (px-2 py-1, text-xs, icon h-3 w-3)
- **md**: Medium badge (px-3 py-1.5, text-sm, icon h-4 w-4) - Default
- **lg**: Large badge (px-4 py-2, text-base, icon h-5 w-5)

## Accessibility

- Uses semantic `role="status"` attribute
- Includes descriptive `aria-label` for screen readers
- Icons marked as decorative with `aria-hidden="true"`

## Examples

See `PropertyStatusBadge.example.tsx` for complete usage examples including:
- Property cards
- Detail pages
- Admin approval queues
- Custom styling

## Testing

Comprehensive test suite covers:
- All status types and their styling
- Size variants
- Icon rendering
- Accessibility features
- Custom className support

Run tests:
```bash
npm test -- PropertyStatusBadge
```

## Requirements

**Validates: Requirements 6.4** - Property status display with color coding
