import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import { Button } from '../components/common/Button';
import { PropertyCard } from '../components/property/PropertyCard';
import { SkeletonCard } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { PROPERTY_TYPES, PAGINATION } from '../constants';
import type { Property, PaginatedResponse, ApiResponse, Region } from '../types';

const PropertyBrowsePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '');
  const [region, setRegion] = useState(searchParams.get('region') ?? '');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') ?? '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: () => apiClient.get<ApiResponse<Region[]>>('/search/regions').then((r) => r.data.data),
    staleTime: Infinity,
  });

  const filters = {
    keyword: searchParams.get('keyword') ?? undefined,
    region: searchParams.get('region') ?? undefined,
    propertyType: searchParams.get('propertyType') ?? undefined,
    minPrice: searchParams.get('minPrice') ?? undefined,
    maxPrice: searchParams.get('maxPrice') ?? undefined,
    page,
    limit: PAGINATION.DEFAULT_LIMIT,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['properties', 'search', filters],
    queryFn: () =>
      apiClient
        .get<ApiResponse<PaginatedResponse<Property>>>('/search/properties', { params: filters })
        .then((r) => r.data.data),
  });

  const applyFilters = () => {
    const params: Record<string, string> = { page: '1' };
    if (keyword) params.keyword = keyword;
    if (region) params.region = region;
    if (propertyType) params.propertyType = propertyType;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setKeyword(''); setRegion(''); setPropertyType(''); setMinPrice(''); setMaxPrice('');
    setSearchParams({});
  };

  const regionOptions = (regionsData ?? []).map((r) => ({ value: r.name, label: r.displayName }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-gray-900 mb-2">Browse Properties</h1>
        <p className="text-gray-600">Find your dream home from our listings</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input 
            placeholder="Search keyword..." 
            value={keyword} 
            onChange={(e) => setKeyword(e.target.value)} 
            aria-label="Keyword search" 
          />
          <Select 
            options={regionOptions} 
            placeholder="All regions" 
            value={region} 
            onChange={(e) => setRegion(e.target.value)} 
            aria-label="Filter by region" 
          />
          <Select 
            options={PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.label }))} 
            placeholder="All types" 
            value={propertyType} 
            onChange={(e) => setPropertyType(e.target.value)} 
            aria-label="Filter by property type" 
          />
          <Input 
            type="number" 
            placeholder="Min price" 
            value={minPrice} 
            onChange={(e) => setMinPrice(e.target.value)} 
            aria-label="Minimum price" 
          />
          <Input 
            type="number" 
            placeholder="Max price" 
            value={maxPrice} 
            onChange={(e) => setMaxPrice(e.target.value)} 
            aria-label="Maximum price" 
          />
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={applyFilters}>
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </Button>
          <Button onClick={clearFilters} variant="secondary">Clear Filters</Button>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          title="No properties found"
          description="Try adjusting your search filters to find more properties."
          action={{
            label: 'Clear Filters',
            onClick: clearFilters,
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.data.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button
                variant="secondary"
                disabled={!data.pagination.hasPrev}
                onClick={() => setSearchParams((p) => { p.set('page', String(page - 1)); return p; })}
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </Button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={!data.pagination.hasNext}
                onClick={() => setSearchParams((p) => { p.set('page', String(page + 1)); return p; })}
              >
                Next
                <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PropertyBrowsePage;
