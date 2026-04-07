# Suspicious Listings Panel Implementation

## Overview
Implementation of the flagged properties panel UI component for administrators to review and manage suspicious/spam listings.

## Files Created

### Component
- `SuspiciousListingsPanel.tsx` - Main component for displaying and managing flagged properties

### Tests
- `__tests__/SuspiciousListingsPanel.test.tsx` - Comprehensive test suite with 11 tests

## Features Implemented

### 1. Flagged Properties Display
- Fetches flagged properties from `GET /api/v1/admin/properties/flagged`
- Displays properties in card layout with:
  - Property image (thumbnail or full image)
  - Title and description
  - Property status badge (if available)
  - Flagged reason badge with warning icon
  - Price (formatted for USD/INR)
  - Property type and region
  - Flagged date and time
  - Report count (if > 0)
  - Seller information

### 2. Flagged Count Badge
- Red error badge showing total number of flagged properties
- Displayed in header next to "Suspicious Listings" title
- Only shown when count > 0

### 3. Clear Flag Functionality
- Clear Flag button for each property
- Confirmation modal before clearing
- Calls `POST /api/v1/admin/properties/:id/clear-flag`
- Automatic list refresh after successful clear
- Toast notifications for success/error

### 4. Pagination
- Supports paginated results (10 per page)
- Previous/Next buttons
- Page indicator (e.g., "Page 1 of 3")
- Buttons disabled appropriately

### 5. Loading & Error States
- Spinner during data fetch
- Error message if API fails
- Empty state when no flagged properties

### 6. UI/UX Details
- Consistent with PropertyApprovalQueue design
- Uses existing UI components (Button, Card, Modal, Spinner, PropertyStatusBadge)
- Responsive layout
- Accessible (ARIA labels, roles)
- Visual hierarchy with color coding (error red for flags)

## API Integration

### Endpoints Used
1. **GET /api/v1/admin/properties/flagged**
   - Query params: `page`, `limit`
   - Returns: Paginated list of flagged properties

2. **POST /api/v1/admin/properties/:id/clear-flag**
   - Clears flag from property
   - Returns: Updated property data

## Testing Coverage

### Test Cases (11 total)
1. ✅ Renders loading state initially
2. ✅ Renders flagged properties list with count badge
3. ✅ Displays flagged reason badge
4. ✅ Displays report count when available
5. ✅ Renders empty state when no flagged properties
6. ✅ Opens clear flag modal when button clicked
7. ✅ Clears flag successfully
8. ✅ Handles pagination correctly
9. ✅ Renders error state when API fails
10. ✅ Formats price correctly for USD
11. ✅ Formats price correctly for INR

All tests passing ✅

## Requirements Validated

- ✅ **Requirement 11.4**: Display flagged properties to administrators
- ✅ **Requirement 11.5**: Admin can clear flags from properties

## Component Structure

```
SuspiciousListingsPanel
├── Header
│   ├── Title: "Suspicious Listings"
│   └── Flagged count badge (red)
├── Properties List
│   └── For each property:
│       ├── Property image
│       ├── Title + Status badge
│       ├── Description
│       ├── Flagged reason badge (warning icon)
│       ├── Details grid:
│       │   ├── Price
│       │   ├── Type
│       │   ├── Region
│       │   ├── Flagged date
│       │   ├── Report count (if > 0)
│       │   └── Seller info
│       └── Clear Flag button
├── Pagination (if multiple pages)
└── Clear Flag Modal
    ├── Confirmation message
    ├── Property details summary
    └── Cancel / Clear Flag buttons
```

## State Management

- **React Query**: Data fetching, caching, and mutations
- **Redux**: Toast notifications (success/error)
- **Local State**: Modal state, pagination

## Usage Example

```tsx
import SuspiciousListingsPanel from '../components/admin/SuspiciousListingsPanel';

function AdminDashboard() {
  return (
    <div className="container mx-auto py-8">
      <SuspiciousListingsPanel />
    </div>
  );
}
```

## Notes

- Component follows the same patterns as PropertyApprovalQueue
- Uses existing UI component library for consistency
- Fully typed with TypeScript
- No diagnostics or linting errors
- Ready for integration into admin dashboard
