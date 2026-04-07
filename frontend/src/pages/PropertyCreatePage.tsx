import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { addToast } from '../store/slices/uiSlice';
import { useAppDispatch } from '../store';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import { Button } from '../components/common/Button';
import ImageUpload from '../components/property/ImageUpload';
import { ROUTES, PROPERTY_TYPES, PROPERTY_STATUSES, VALIDATION } from '../constants';
import type { ApiResponse, Property, Region } from '../types';

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

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: () => apiClient.get<ApiResponse<Region[]>>('/search/regions').then((r) => r.data.data),
    staleTime: Infinity,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { status: 'available' },
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

  const regionOptions = (regions ?? []).map((r) => ({ value: r.name, label: r.displayName }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Listing</h1>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d as FormData))} noValidate className="space-y-4">
        <Input label="Title" required error={errors.title?.message} {...register('title')} />
        <Textarea label="Description" required rows={4} error={errors.description?.message} {...register('description')} />
        <Input label="Price ($)" type="number" required error={errors.price?.message} {...register('price')} />
        <Select label="Region" required options={regionOptions} placeholder="Select region" error={errors.region?.message} {...register('region')} />
        <Input label="Address" required error={errors.address?.message} {...register('address')} />
        <Select label="Property Type" required options={PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.label }))} error={errors.propertyType?.message} {...register('propertyType')} />
        <Select label="Status" options={PROPERTY_STATUSES.map((s) => ({ value: s.value, label: s.label }))} error={errors.status?.message} {...register('status')} />

        <ImageUpload images={images} onChange={setImages} />

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending}>Create Listing</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default PropertyCreatePage;
