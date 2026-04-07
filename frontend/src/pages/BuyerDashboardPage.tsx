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

interface BuyerDashboard {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  recentAppointments: any[];
  submittedFeedback: number;
}

const BuyerDashboardPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'buyer'],
    queryFn: () =>
      apiClient.get<ApiResponse<BuyerDashboard>>('/dashboard/buyer').then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasAppointments = (data?.totalAppointments ?? 0) > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-gray-900 mb-2">Buyer Dashboard</h1>
        <p className="text-gray-600">Track your property viewings and appointments</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Appointments"
          value={data?.totalAppointments ?? 0}
          color="blue"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          title="Pending"
          value={data?.pendingAppointments ?? 0}
          color="orange"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Confirmed"
          value={data?.confirmedAppointments ?? 0}
          color="green"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Feedback Submitted"
          value={data?.submittedFeedback ?? 0}
          color="purple"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to={ROUTES.PROPERTIES.BROWSE}>
            <Button variant="primary">
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Properties
            </Button>
          </Link>
          <Link to={ROUTES.APPOINTMENTS.BUYER}>
            <Button variant="secondary">My Appointments</Button>
          </Link>
          <Link to={ROUTES.AI_SUPPORT}>
            <Button variant="secondary">AI Support</Button>
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {!hasAppointments && (
        <EmptyState
          icon={
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="No appointments yet"
          description="Start browsing properties and book appointments to view homes you're interested in."
          action={{
            label: 'Browse Properties',
            onClick: () => window.location.href = ROUTES.PROPERTIES.BROWSE,
          }}
        />
      )}
    </div>
  );
};

export default BuyerDashboardPage;
