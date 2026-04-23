import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { addToast } from '../store/slices/uiSlice';
import { useAppDispatch, useAppSelector } from '../store';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import { Button } from '../components/common/Button';
import ImageUpload from '../components/property/ImageUpload';
import { ROUTES, PROPERTY_TYPES, PROPERTY_STATUSES, VALIDATION } from '../constants';
import type { ApiResponse, Property } from '../types';

const schema = z.object({
  title: z.string().min(VALIDATION.TITLE_MIN_LENGTH).max(VALIDATION.TITLE_MAX_LENGTH),
  description: z.string().min(VALIDATION.DESCRIPTION_MIN_LENGTH).max(VALIDATION.DESCRIPTION_MAX_LENGTH),
  price: z.coerce.number().positive('Price must be positive'),
  region: z.string().min(1, 'Region is required'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  propertyType: z.enum(['house', 'apartment', 'condo', 'land', 'commercial']),
  status: z.enum(['available', 'under_offer', 'sold']).default('available'),
});

type FormData = z.infer<typeof schema>;

const PropertyCreatePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [images, setImages] = React.useState<File[]>([]);

  // Get seller's location from auth state
  const user = useAppSelector((s) => s.auth.user);
  const sellerCity = user?.buy_city ?? '';
  const sellerState = user?.buy_state ?? '';

  // Build region options from seller's location
  // The seller can only list in their own city/region
  const sellerRegion = sellerCity || sellerState || '';
  const regionOptions = sellerRegion
    ? [{ value: sellerRegion.toLowerCase(), label: sellerRegion }]
    : [];

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      status: 'available',
      region: sellerRegion.toLowerCase(),
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiClient.post<ApiResponse<Property>>('/properties', data);
      const propertyId = res.data.data.id;

      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => formData.append('images', img));
        await apiClient.post(`/properties/${propertyId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return propertyId;
    },
    onSuccess: (id) => {
      dispatch(addToast({ type: 'success', message: 'Property created successfully!' }));
      navigate(ROUTES.PROPERTIES.DETAIL.replace(':id', id));
    },
    onError: (err: any) => {
      dispatch(addToast({ type: 'error', message: err?.response?.data?.error?.message ?? 'Failed to create property' }));
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Listing</h1>

      {!sellerRegion && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Your profile doesn't have a city/region set. Please update your profile to list properties in your area.
        </div>
      )}

      <form onSubmit={handleSubmit((d) => mutation.mutate(d as FormData))} noValidate className="space-y-4">
        <Input label="Title" required error={errors.title?.message} {...register('title')} />
        <Textarea label="Description" required rows={4} error={errors.description?.message} {...register('description')} />
        <Input label="Price ($)" type="number" required error={errors.price?.message} {...register('price')} />

        {/* Region — locked to seller's city */}
        {sellerRegion ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              readOnly
              value={sellerRegion}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
            />
            <input type="hidden" {...register('region')} value={sellerRegion.toLowerCase()} />
            <p className="mt-1 text-xs text-gray-500">Region is set to your registered city/location.</p>
          </div>
        ) : (
          <Select
            label="Region"
            required
            options={regionOptions}
            placeholder="No region available — update your profile"
            error={errors.region?.message}
            {...register('region')}
          />
        )}

        <Input label="Address" required error={errors.address?.message} {...register('address')} />
        <Select
          label="Property Type"
          required
          options={PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          error={errors.propertyType?.message}
          {...register('propertyType')}
        />
        <Select
          label="Status"
          options={PROPERTY_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
          error={errors.status?.message}
          {...register('status')}
        />

        <ImageUpload images={images} onChange={setImages} />

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending} disabled={!sellerRegion}>
            Create Listing
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PropertyCreatePage;
