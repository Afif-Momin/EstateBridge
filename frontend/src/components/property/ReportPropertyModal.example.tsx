/**
 * ReportPropertyModal - Usage Examples
 * 
 * This component provides a modal interface for users to report properties
 * that violate platform guidelines.
 */

import { useState } from 'react';
import ReportPropertyModal from './ReportPropertyModal';
import { Button } from '../common/Button';

/**
 * Example 1: Basic Usage
 * 
 * The most common use case - a button that opens the report modal
 */
export function BasicExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Report Property
      </Button>

      <ReportPropertyModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        propertyId="property-123"
        propertyTitle="Beautiful House in Downtown"
      />
    </>
  );
}

/**
 * Example 2: Integration with Property Detail Page
 * 
 * Shows how to integrate the report modal into a property detail page
 */
export function PropertyDetailExample() {
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Mock property data
  const property = {
    id: 'prop-456',
    title: 'Modern Apartment with City View',
    price: 450000,
    // ... other property fields
  };

  return (
    <div className="property-detail">
      <div className="property-header">
        <h1>{property.title}</h1>
        <div className="actions">
          <Button variant="outline" onClick={() => setShowReportModal(true)}>
            🚩 Report
          </Button>
        </div>
      </div>

      {/* Property content */}
      <div className="property-content">
        {/* ... property details ... */}
      </div>

      {/* Report Modal */}
      <ReportPropertyModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        propertyId={property.id}
        propertyTitle={property.title}
      />
    </div>
  );
}

/**
 * Example 3: Conditional Rendering
 * 
 * Only show report button to authenticated users who are not the property owner
 */
export function ConditionalExample() {
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Mock auth and property data
  const currentUserId = 'user-123';
  const property = {
    id: 'prop-789',
    title: 'Cozy Studio Apartment',
    sellerId: 'user-456',
  };

  const canReport = currentUserId && currentUserId !== property.sellerId;

  return (
    <div>
      {canReport && (
        <>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowReportModal(true)}
          >
            Report this listing
          </Button>

          <ReportPropertyModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            propertyId={property.id}
            propertyTitle={property.title}
          />
        </>
      )}
    </div>
  );
}

/**
 * Component Props:
 * 
 * @param isOpen - Controls modal visibility
 * @param onClose - Callback when modal should close
 * @param propertyId - ID of the property being reported
 * @param propertyTitle - Title of the property (displayed in modal)
 * 
 * Features:
 * - Required reason selection from predefined options
 * - Optional additional details textarea
 * - Loading state during submission
 * - Success/error toast notifications
 * - Handles duplicate report errors gracefully
 * - Form validation with error messages
 * - Automatic form reset on close
 * 
 * Report Reasons:
 * - Spam
 * - Inappropriate Content
 * - Fake Images
 * - Duplicate Listing
 * - Other
 */
