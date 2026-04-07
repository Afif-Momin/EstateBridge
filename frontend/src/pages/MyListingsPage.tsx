import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { addToast } from '../store/slices/uiSlice';
import { useAppDispatch } from '../store';
import { Button } from '../components/common/Button';
import { PropertyCard } from '../components/property/PropertyCard';
import { EmptyState } from '../components/common/EmptyState';
import { Spinner } from '../components/common/Spinner';
import Modal from '../components/common/Modal';
import { ROUTES } from '../constants';
import type { Property, ApiResponse, PaginatedResponse } from '../types';

const MyListingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['properties', 'seller'],
    queryFn: () =>
      apiClient.get<ApiResponse<PaginatedResponse<Property>>>('/properties/seller/me').then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/properties/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['properties', 'seller'] });
      dispatch(addToast({ type: 'success', message: 'Property deleted successfully' }));
      setDeleteId(null);
    },
    onError: () => dispatch(addToast({ type: 'error', message: 'Failed to delete property' })),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const properties = data?.data ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-gray-900 mb-2">My Listings</h1>
          <p className="text-gray-600">Manage your property listings</p>
        </div>
        <Link to={ROUTES.PROPERTIES.CREATE}>
          <Button>
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Listing
          </Button>
        </Link>
      </div>

      {/* Listings Grid */}
      {properties.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => (
            <div key={p.id} className="relative">
              <PropertyCard property={p} />
              {/* Action Buttons Overlay */}
              <div className="absolute top-3 left-3 flex gap-2">
                <Link to={ROUTES.PROPERTIES.EDIT.replace(':id', p.id)}>
                  <button className="px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-colors duration-200">
                    Edit
                  </button>
                </Link>
                <button 
                  onClick={() => setDeleteId(p.id)} 
                  className="px-3 py-1.5 bg-white text-error-600 text-sm font-medium rounded-lg shadow-sm hover:bg-error-50 transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Property" size="sm">
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this property? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            loading={deleteMutation.isPending} 
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
          >
            Delete Property
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MyListingsPage;
