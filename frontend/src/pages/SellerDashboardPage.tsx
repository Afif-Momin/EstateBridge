import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { Spinner } from '../components/common/Spinner';
import { StatCard } from '../components/dashboard/StatCard';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { ROUTES } from '../constants';
import type { ApiResponse } from '../types';

interface SellerDashboard {
  totalListings: number;
  activeListings: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  recentAppointments: any[];
  recentListings: any[];
}

const SellerDashboardPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'seller'],
    queryFn: () =>
      apiClient.get<ApiResponse<SellerDashboard>>('/dashboard/seller').then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasListings = (data?.totalListings ?? 0) > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-gray-900 mb-2">Seller Dashboard</h1>
        <p className="text-gray-600">Manage your property listings and appointments</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Listings"
          value={data?.totalListings ?? 0}
          color="blue"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
        />
        <StatCard
          title="Active Listings"
          value={data?.activeListings ?? 0}
          color="green"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Pending Appointments"
          value={data?.pendingAppointments ?? 0}
          color="orange"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Confirmed Appointments"
          value={data?.confirmedAppointments ?? 0}
          color="purple"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to={ROUTES.PROPERTIES.CREATE}>
            <Button variant="primary">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Listing
            </Button>
          </Link>
          <Link to={ROUTES.PROPERTIES.MY_LISTINGS}>
            <Button variant="secondary">My Listings</Button>
          </Link>
          <Link to={ROUTES.APPOINTMENTS.SELLER}>
            <Button variant="secondary">View Appointments</Button>
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {!hasListings && (
        <EmptyState
          icon={
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
          title="No listings yet"
          description="Create your first property listing to start connecting with potential buyers."
          action={{
            label: 'Create Listing',
            onClick: () => window.location.href = ROUTES.PROPERTIES.CREATE,
          }}
        />
      )}
    </div>
  );
};

export default SellerDashboardPage;
