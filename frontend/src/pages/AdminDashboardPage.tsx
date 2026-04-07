import React from 'react';
import PropertyApprovalQueue from '../components/admin/PropertyApprovalQueue';

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage property approvals and platform moderation
          </p>
        </div>

        {/* Property Approval Queue */}
        <PropertyApprovalQueue />
      </div>
    </div>
  );
};

export default AdminDashboardPage;
