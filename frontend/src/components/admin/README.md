# Admin Components

This directory contains components for administrative functionality in the Estate Bridge platform.

## PropertyApprovalQueue

A component that displays pending properties awaiting admin approval and provides approve/reject functionality.

### Features

- Displays pending properties with key details (title, price, seller, submission date)
- Shows pending count badge
- Approve button with status selection modal (For Sale, For Rent, Under Construction)
- Reject button with reason input modal
- Pagination support for large lists
- Loading and error states
- Automatic list refresh after approve/reject actions
- Toast notifications for success/error feedback

### Usage

```tsx
import PropertyApprovalQueue from '../components/admin/PropertyApprovalQueue';

function AdminDashboard() {
  return (
    <div>
      <PropertyApprovalQueue />
    </div>
  );
}
```

### API Endpoints Used

- `GET /api/v1/admin/properties/pending` - Fetch pending properties with pagination
- `POST /api/v1/admin/properties/:id/approve` - Approve a property (requires `approvedStatus` in body)
- `POST /api/v1/admin/properties/:id/reject` - Reject a property (requires `reason` in body)

### Requirements Validated

- **Requirement 7.3**: Admin can approve properties and set approved status
- **Requirement 7.4**: Admin can reject properties with reason
- **Requirement 7.5**: Display pending approval count to administrators

### Component Structure

```
PropertyApprovalQueue
├── Header with pending count badge
├── Properties list
│   ├── Property card (image, details, actions)
│   └── Approve/Reject buttons
├── Pagination controls
├── Approve modal (status selection)
└── Reject modal (reason input)
```

### State Management

- Uses React Query for data fetching and mutations
- Uses Redux for toast notifications
- Local state for modal management and form inputs

### Testing

Tests are located in `__tests__/PropertyApprovalQueue.test.tsx` and cover:
- Loading state
- Displaying pending properties with details
- Pending count badge
- Empty state
- Opening approve/reject modals
- Currency formatting (USD/INR)

---

## SuspiciousListingsPanel

A component that displays flagged/suspicious properties and provides functionality to clear flags.

### Features

- Displays flagged properties with key details (title, price, flagged reason, flagged date)
- Shows flagged count badge (red error badge)
- Displays flagged reason badge with warning icon
- Shows report count for each property
- Clear flag button with confirmation modal
- Pagination support for large lists
- Loading and error states
- Automatic list refresh after clearing flags
- Toast notifications for success/error feedback

### Usage

```tsx
import SuspiciousListingsPanel from '../components/admin/SuspiciousListingsPanel';

function AdminDashboard() {
  return (
    <div>
      <SuspiciousListingsPanel />
    </div>
  );
}
```

### API Endpoints Used

- `GET /api/v1/admin/properties/flagged` - Fetch flagged properties with pagination
- `POST /api/v1/admin/properties/:id/clear-flag` - Clear flag from a property

### Requirements Validated

- **Requirement 11.4**: Display flagged properties to administrators
- **Requirement 11.5**: Admin can clear flags from properties

### Component Structure

```
SuspiciousListingsPanel
├── Header with flagged count badge (red)
├── Properties list
│   ├── Property card (image, details, flagged reason badge)
│   └── Clear Flag button
├── Pagination controls
└── Clear Flag confirmation modal
```

### State Management

- Uses React Query for data fetching and mutations
- Uses Redux for toast notifications
- Local state for modal management

### Testing

Tests are located in `__tests__/SuspiciousListingsPanel.test.tsx` and cover:
- Loading state
- Displaying flagged properties with details
- Flagged count badge
- Flagged reason badge display
- Report count display
- Empty state
- Opening clear flag modal
- Clearing flags successfully
- Pagination
- Error handling
- Currency formatting (USD/INR)

