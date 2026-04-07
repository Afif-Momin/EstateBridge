/**
 * PropertyStatusBadge Component Usage Examples
 * 
 * This file demonstrates how to use the PropertyStatusBadge component
 * across different parts of the application.
 */

import { PropertyStatusBadge } from './PropertyStatusBadge';
import type { PropertyProStatus } from '../../types';

// Example 1: Basic usage in a property card
export function PropertyCardExample() {
  const status: PropertyProStatus = 'For Sale';
  
  return (
    <div className="bg-white rounded-lg p-4">
      <PropertyStatusBadge status={status} />
    </div>
  );
}

// Example 2: Different sizes
export function SizeVariantsExample() {
  return (
    <div className="space-y-4">
      <PropertyStatusBadge status="For Sale" size="sm" />
      <PropertyStatusBadge status="For Rent" size="md" />
      <PropertyStatusBadge status="Under Construction" size="lg" />
    </div>
  );
}

// Example 3: All status types
export function AllStatusesExample() {
  const statuses: PropertyProStatus[] = [
    'For Sale',
    'For Rent',
    'Under Construction',
    'Closed',
    'Finished',
    'Waiting for Admin Approval',
    'Rejected',
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <PropertyStatusBadge key={status} status={status} />
      ))}
    </div>
  );
}

// Example 4: In a property detail page
export function PropertyDetailExample() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Luxury Villa</h1>
        <PropertyStatusBadge status="For Sale" size="lg" />
      </div>
      <p className="text-gray-600">Beautiful property in prime location...</p>
    </div>
  );
}

// Example 5: In an admin approval queue
export function AdminQueueExample() {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Property #12345</h3>
          <p className="text-sm text-gray-600">Submitted 2 hours ago</p>
        </div>
        <PropertyStatusBadge status="Waiting for Admin Approval" size="sm" />
      </div>
    </div>
  );
}

// Example 6: Custom styling
export function CustomStyledExample() {
  return (
    <PropertyStatusBadge 
      status="For Sale" 
      className="shadow-md hover:shadow-lg transition-shadow"
    />
  );
}
