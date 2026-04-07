# Appointment Booking Modal Update

## Overview

Updated `AppointmentBookingModal.tsx` to use the `BuyerQualificationForm` component instead of a simple datetime form. This change implements the enhanced buyer interest qualification requirements (Requirements 9.1, 9.2, 9.3, 9.5).

## Changes Made

### 1. Component Simplification

**Before:**
- Modal contained its own form with react-hook-form setup
- Only collected `requestedDateTime`
- Closed modal immediately after submission
- Simple appointment booking flow

**After:**
- Modal now wraps the `BuyerQualificationForm` component
- All form logic delegated to `BuyerQualificationForm`
- Modal stays open after submission to display seller contact information
- Enhanced qualification flow with multiple fields

### 2. Props Interface

The modal's props interface remains unchanged:
```typescript
interface Props {
  listingId: string;
  sellerId: string;
  onClose: () => void;
}
```

This ensures backward compatibility with existing usage in `PropertyDetailPage.tsx`.

### 3. Behavior Changes

#### Query Invalidation
- Still invalidates `['appointments', 'buyer']` query on success
- Handled in `handleSuccess` callback passed to `BuyerQualificationForm`

#### Modal Closing
- Modal no longer closes automatically after form submission
- User can see seller contact information displayed by `BuyerQualificationForm`
- User must manually close modal using the close button

### 4. Data Collection

The form now collects comprehensive buyer qualification data:

**Required Fields:**
- `reason_to_buy`: Investment or Self Use
- `is_property_dealer`: Boolean
- `buyer_name`: String (2-100 characters)
- `buyer_phone`: String (10-15 digits)
- `requestedDateTime`: Future datetime
- `terms_accepted`: Boolean (must be true)
- `privacy_policy_accepted`: Boolean (must be true)

**Optional Fields:**
- `purchase_timeline`: 3 months, 6 months, or More than 6 months
- `home_loan_interest`: Boolean
- `site_visit_interest`: Boolean

### 5. Seller Contact Reveal

After successful submission, the `BuyerQualificationForm` displays:
- Seller name
- Seller email (clickable mailto link)
- Seller phone (clickable tel link)

This information is returned from the backend API and displayed in a success message within the form.

## Testing

### Unit Tests

Created `AppointmentBookingModal.test.tsx` with the following test cases:

1. ✅ Renders the modal with correct title
2. ✅ Renders the BuyerQualificationForm component
3. ✅ Passes listingId and sellerId to BuyerQualificationForm
4. ✅ Calls onClose when modal close button is clicked
5. ✅ Invalidates appointments query on form success

All tests pass successfully.

### Integration Testing

- Verified compatibility with `PropertyDetailPage.tsx` usage
- Confirmed no TypeScript errors
- All 140 frontend tests pass

## Requirements Addressed

- **9.1**: Collects reason_to_buy, is_property_dealer, buyer_name, buyer_phone
- **9.2**: Optionally collects purchase_timeline, home_loan_interest, site_visit_interest
- **9.3**: Requires acceptance of terms and conditions and privacy policy
- **9.5**: Reveals seller contact information after form submission

## Migration Notes

No migration required. The component interface remains the same, so existing code using `AppointmentBookingModal` will continue to work without changes.

## Files Modified

1. `frontend/src/components/property/AppointmentBookingModal.tsx` - Updated to use BuyerQualificationForm
2. `frontend/src/components/property/__tests__/AppointmentBookingModal.test.tsx` - Created new test file

## Dependencies

- `BuyerQualificationForm` component (already implemented in task 12.6)
- `Modal` component (existing)
- React Query for query invalidation
- Redux store for toast notifications (handled by BuyerQualificationForm)
