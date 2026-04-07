import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { addToast } from '../store/slices/uiSlice';
import { useAppDispatch } from '../store';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { Card } from '../components/common/Card';
import type { Appointment, ApiResponse, PaginatedResponse } from '../types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

const BuyerAppointmentsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', 'buyer'],
    queryFn: () =>
      apiClient.get<ApiResponse<PaginatedResponse<Appointment>>>('/appointments/buyer/me').then((r) => r.data.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/appointments/${id}`, { status: 'cancelled' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments', 'buyer'] });
      dispatch(addToast({ type: 'success', message: 'Appointment cancelled' }));
    },
    onError: () => dispatch(addToast({ type: 'error', message: 'Failed to cancel appointment' })),
  });

  if (isLoading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  const appointments = data?.data ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">My Appointments</h1>

      {appointments.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="No appointments yet"
          description="Book appointments with sellers to view properties you're interested in."
        />
      ) : (
        <>
          {/* Mobile: Card layout */}
          <div className="lg:hidden space-y-4">
            {appointments.map((a) => (
              <Card key={a.id} className="hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">Property: {a.listingId}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize border whitespace-nowrap ${statusColors[a.status]}`}>
                      {a.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-mono">{new Date(a.requestedDateTime).toLocaleString()}</span>
                  </div>
                  {a.status === 'confirmed' && (
                    <div className="pt-2 border-t">
                      <Button
                        variant="danger"
                        size="sm"
                        loading={cancelMutation.isPending}
                        onClick={() => cancelMutation.mutate(a.id)}
                        className="w-full"
                      >
                        Cancel Appointment
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: Table layout */}
          <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.listingId}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{new Date(a.requestedDateTime).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize border ${statusColors[a.status]}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {a.status === 'confirmed' ? (
                        <Button
                          variant="danger"
                          size="sm"
                          loading={cancelMutation.isPending}
                          onClick={() => cancelMutation.mutate(a.id)}
                        >
                          Cancel
                        </Button>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default BuyerAppointmentsPage;
