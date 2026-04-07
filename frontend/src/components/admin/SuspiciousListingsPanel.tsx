import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import Modal from '../common/Modal';
import { Spinner } from '../common/Spinner';
import { PropertyStatusBadge } from '../property/PropertyStatusBadge';
import { useAppDispatch } from '../../store';
import { addToast } from '../../store/slices/uiSlice';
import type { Property, PaginatedResponse, ApiResponse } from '../../types';

interface ClearFlagModalState {
  isOpen: boolean;
  property: Property | null;
}

const SuspiciousListingsPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<ClearFlagModalState>({
    isOpen: false,
    property: null,
  });

  // Fetch flagged properties
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'properties', 'flagged', page],
    queryFn: () =>
      apiClient
        .get<ApiResponse<PaginatedResponse<Property>>>('/admin/properties/flagged', {
          params: { page, limit: 10 },
        })
        .then((r) => r.data.data),
  });

  // Clear flag mutation
  const clearFlagMutation = useMutation({
    mutationFn: (propertyId: string) =>
      apiClient.post(`/admin/properties/${propertyId}/clear-flag`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'properties', 'flagged'] });
      dispatch(addToast({ type: 'success', message: 'Flag cleared successfully' }));
      closeModal();
    },
    onError: (error: any) => {
      dispatch(
        addToast({
          type: 'error',
          message: error.response?.data?.error?.message || 'Failed to clear flag',
        })
      );
    },
  });

  const openClearFlagModal = (property: Property) => {
    setModalState({ isOpen: true, property });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, property: null });
  };

  const handleClearFlag = () => {
    if (!modalState.property) return;
    clearFlagMutation.mutate(modalState.property.id);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        <p className="text-error-600">Failed to load flagged properties</p>
      </div>
    );
  }

  const properties = data?.data || [];
  const pagination = data?.pagination;
  const flaggedCount = pagination?.total || 0;

  return (
    <div className="space-y-6">
      {/* Header with flagged count badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">Suspicious Listings</h2>
          {flaggedCount > 0 && (
            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold text-white bg-error-600 rounded-full">
              {flaggedCount}
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No flagged properties</h3>
            <p className="mt-1 text-sm text-gray-500">All properties are clean.</p>
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
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {property.title}
                        </h3>
                        {property.pro_status && (
                          <PropertyStatusBadge status={property.pro_status} size="sm" />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {property.description}
                      </p>
                    </div>
                  </div>

                  {/* Flagged reason badge */}
                  {property.flaggedReason && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-error-700 bg-error-100 border border-error-200 rounded-full">
                        <svg
                          className="w-4 h-4 mr-1.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        {property.flaggedReason}
                      </span>
                    </div>
                  )}

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
                      <span className="text-gray-500">Flagged:</span>{' '}
                      <span className="font-medium text-gray-900">
                        {property.flaggedAt ? formatDate(property.flaggedAt) : 'N/A'}
                      </span>
                    </div>
                    {property.reportCount !== undefined && property.reportCount > 0 && (
                      <div>
                        <span className="text-gray-500">Reports:</span>{' '}
                        <span className="font-semibold text-error-600">
                          {property.reportCount}
                        </span>
                      </div>
                    )}
                    {property.seller && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Seller:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {property.seller.fullName} ({property.seller.email})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openClearFlagModal(property)}
                      disabled={clearFlagMutation.isPending}
                    >
                      Clear Flag
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

      {/* Clear Flag Confirmation Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title="Clear Flag"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to clear the flag from this property?
          </p>
          {modalState.property && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-gray-900">{modalState.property.title}</p>
              {modalState.property.flaggedReason && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Reason:</span> {modalState.property.flaggedReason}
                </p>
              )}
            </div>
          )}
          <p className="text-sm text-gray-500">
            This will remove the flag and the property will no longer appear in this list.
          </p>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={closeModal} disabled={clearFlagMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleClearFlag}
              loading={clearFlagMutation.isPending}
            >
              Clear Flag
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SuspiciousListingsPanel;
