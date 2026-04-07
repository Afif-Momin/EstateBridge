import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import Modal from '../common/Modal';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import { Spinner } from '../common/Spinner';
import { useAppDispatch } from '../../store';
import { addToast } from '../../store/slices/uiSlice';
import type { Property, PaginatedResponse, ApiResponse, PropertyProStatus } from '../../types';

interface ApprovalModalState {
  isOpen: boolean;
  property: Property | null;
  type: 'approve' | 'reject';
}

const PropertyApprovalQueue: React.FC = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<ApprovalModalState>({
    isOpen: false,
    property: null,
    type: 'approve',
  });
  const [approvedStatus, setApprovedStatus] = useState<PropertyProStatus>('For Sale');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch pending properties
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'properties', 'pending', page],
    queryFn: () =>
      apiClient
        .get<ApiResponse<PaginatedResponse<Property>>>('/admin/properties/pending', {
          params: { page, limit: 10 },
        })
        .then((r) => r.data.data),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: ({ propertyId, status }: { propertyId: string; status: PropertyProStatus }) =>
      apiClient.post(`/admin/properties/${propertyId}/approve`, { approvedStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'properties', 'pending'] });
      dispatch(addToast({ type: 'success', message: 'Property approved successfully' }));
      closeModal();
    },
    onError: (error: any) => {
      dispatch(
        addToast({
          type: 'error',
          message: error.response?.data?.error?.message || 'Failed to approve property',
        })
      );
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ propertyId, reason }: { propertyId: string; reason: string }) =>
      apiClient.post(`/admin/properties/${propertyId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'properties', 'pending'] });
      dispatch(addToast({ type: 'success', message: 'Property rejected successfully' }));
      closeModal();
    },
    onError: (error: any) => {
      dispatch(
        addToast({
          type: 'error',
          message: error.response?.data?.error?.message || 'Failed to reject property',
        })
      );
    },
  });

  const openApproveModal = (property: Property) => {
    setModalState({ isOpen: true, property, type: 'approve' });
    setApprovedStatus('For Sale');
  };

  const openRejectModal = (property: Property) => {
    setModalState({ isOpen: true, property, type: 'reject' });
    setRejectionReason('');
  };

  const closeModal = () => {
    setModalState({ isOpen: false, property: null, type: 'approve' });
    setApprovedStatus('For Sale');
    setRejectionReason('');
  };

  const handleApprove = () => {
    if (!modalState.property) return;
    approveMutation.mutate({
      propertyId: modalState.property.id,
      status: approvedStatus,
    });
  };

  const handleReject = () => {
    if (!modalState.property || !rejectionReason.trim()) {
      dispatch(addToast({ type: 'error', message: 'Please provide a rejection reason' }));
      return;
    }
    rejectMutation.mutate({
      propertyId: modalState.property.id,
      reason: rejectionReason,
    });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price: number, currency?: 'USD' | 'INR') => {
    if (currency === 'USD') {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₹${price.toLocaleString('en-IN')}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-error-600">Failed to load pending properties</p>
      </div>
    );
  }

  const properties = data?.data || [];
  const pagination = data?.pagination;
  const pendingCount = pagination?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header with pending count badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Property Approval Queue</h2>
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold text-white bg-primary-600 rounded-full">
              {pendingCount}
            </span>
          )}
        </div>
      </div>

      {/* Properties list */}
      {properties.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending properties</h3>
            <p className="mt-1 text-sm text-gray-500">All properties have been reviewed.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => (
            <Card key={property.id} padding="md">
              <div className="flex gap-6">
                {/* Property image */}
                <div className="flex-shrink-0">
                  <img
                    src={property.thumbnailUrls?.[0] || property.imageUrls[0]}
                    alt={property.title}
                    className="w-48 h-32 object-cover rounded-lg"
                  />
                </div>

                {/* Property details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {property.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {property.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Price:</span>{' '}
                      <span className="font-semibold text-gray-900">
                        {formatPrice(property.price, property.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>{' '}
                      <span className="font-medium text-gray-900 capitalize">
                        {property.propertyType}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Region:</span>{' '}
                      <span className="font-medium text-gray-900">{property.region}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Submitted:</span>{' '}
                      <span className="font-medium text-gray-900">
                        {formatDate(property.createdAt)}
                      </span>
                    </div>
                    {property.seller && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Seller:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {property.seller.fullName} ({property.seller.email})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-4 flex gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openApproveModal(property)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openRejectModal(property)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNext}
          >
            Next
          </Button>
        </div>
      )}

      {/* Approve Modal */}
      <Modal
        isOpen={modalState.isOpen && modalState.type === 'approve'}
        onClose={closeModal}
        title="Approve Property"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select the approved status for this property:
          </p>
          <Select
            label="Approved Status"
            value={approvedStatus}
            onChange={(e) => setApprovedStatus(e.target.value as PropertyProStatus)}
            options={[
              { value: 'For Sale', label: 'For Sale' },
              { value: 'For Rent', label: 'For Rent' },
              { value: 'Under Construction', label: 'Under Construction' },
            ]}
            required
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={closeModal} disabled={approveMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              loading={approveMutation.isPending}
            >
              Approve
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={modalState.isOpen && modalState.type === 'reject'}
        onClose={closeModal}
        title="Reject Property"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Please provide a reason for rejecting this property:
          </p>
          <Textarea
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter the reason for rejection..."
            rows={4}
            required
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={closeModal} disabled={rejectMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={rejectMutation.isPending}
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PropertyApprovalQueue;
