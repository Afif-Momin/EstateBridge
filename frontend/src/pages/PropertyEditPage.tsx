import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { addToast } from '../store/slices/uiSlice';
import { useAppDispatch } from '../store';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Textarea from '../components/common/Textarea';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { ROUTES, PROPERTY_TYPES, PROPERTY_STATUSES, VALIDATION } from '../constants';
import type { ApiResponse, Property, Region } from '../types';

const schema = z.object({
  title: z.string().min(VALIDATION.TITLE_MIN_LENGTH).max(VALIDATION.TITLE_MAX_LENGTH),
  description: z.string().min(VALIDATION.DESCRIPTION_MIN_LENGTH).max(VALIDATION.DESCRIPTION_MAX_LENGTH),
  price: z.coerce.number().positive(),
  region: z.string().min(1),
  address: z.string().min(10),
  propertyType: z.enum(['house', 'apartment', 'condo', 'land', 'commercial']),
  status: z.enum(['available', 'under_offer', 'sold']),
});

type FormData = z.infer<typeof schema>;

const PropertyEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => apiClient.get<ApiResponse<Property>>(`/properties/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: regions } = useQuery({
    queryKey: ['regions'],
    queryFn: () => apiClient.get<ApiResponse<Region[]>>('/search/regions').then((r) => r.data.data),
    staleTime: Infinity,
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
  });

  React.useEffect(() => {
    if (property) reset(property as any);
  }, [property, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      apiClient.put<ApiResponse<Property>>(`/properties/${id}`, data).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['property', id] });
      dispatch(addToast({ type: 'success', message: 'Property updated!' }));
      navigate(ROUTES.PROPERTIES.DETAIL.replace(':id', id!));
    },
    onError: (err: any) => {
      dispatch(addToast({ type: 'error', message: err?.response?.data?.error?.message ?? 'Update failed' }));
    },
  });

  if (isLoading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  const regionOptions = (regions ?? []).map((r) => ({ value: r.name, label: r.displayName }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Listing</h1>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d as FormData))} noValidate className="space-y-4">
        <Input label="Title" required error={errors.title?.message} {...register('title')} />
        <Textarea label="Description" required rows={4} error={errors.description?.message} {...register('description')} />
        <Input label="Price ($)" type="number" required error={errors.price?.message} {...register('price')} />
        <Select label="Region" required options={regionOptions} placeholder="Select region" error={errors.region?.message} {...register('region')} />
        <Input label="Address" required error={errors.address?.message} {...register('address')} />
        <Select label="Property Type" required options={PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.label }))} error={errors.propertyType?.message} {...register('propertyType')} />
        <Select label="Status" options={PROPERTY_STATUSES.map((s) => ({ value: s.value, label: s.label }))} error={errors.status?.message} {...register('status')} />

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={mutation.isPending}>Save Changes</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default PropertyEditPage;
