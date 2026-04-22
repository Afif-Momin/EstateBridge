import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';
import { addToast } from '../../store/slices/uiSlice';
import { useAppDispatch } from '../../store';
import Input from '../common/Input';
import Select from '../common/Select';
import { Button } from '../common/Button';
import type { ApiResponse, BuyerInterest } from '../../types';

interface Props {
  listingId: string;
  sellerId: string;
  onSuccess?: () => void;
}

const schema = z.object({
  reason_to_buy: z.enum(['Investment', 'Self Use'] as const, {
    message: 'Please select a reason to buy',
  }),
  is_property_dealer: z.boolean(),
  buyer_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  buyer_phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number is too long'),
  purchase_timeline: z.enum(['3 months', '6 months', 'More than 6 months'] as const).optional(),
  home_loan_interest: z.boolean().optional(),
  site_visit_interest: z.boolean().optional(),
  terms_accepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
  privacy_policy_accepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the privacy policy',
  }),
  requestedDateTime: z
    .string()
    .min(1, 'Date and time is required')
    .refine((v) => new Date(v) > new Date(), 'Appointment must be in the future'),
});

type FormData = z.infer<typeof schema>;

interface AppointmentResponse {
  appointment: BuyerInterest;
  sellerContact: {
    name: string;
    email: string;
    phone: string;
  };
}

const BuyerQualificationForm: React.FC<Props> = ({ listingId, sellerId, onSuccess }) => {
  const dispatch = useAppDispatch();
  const [sellerContact, setSellerContact] = useState<AppointmentResponse['sellerContact'] | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      is_property_dealer: false,
      home_loan_interest: false,
      site_visit_interest: false,
      terms_accepted: false,
      privacy_policy_accepted: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      apiClient.post<ApiResponse<AppointmentResponse>>('/appointments', {
        listingId,
        sellerId,
        requestedDateTime: new Date(data.requestedDateTime).toISOString(),
        reason_to_buy: data.reason_to_buy,
        is_property_dealer: data.is_property_dealer,
        buyer_name: data.buyer_name,
        buyer_phone: data.buyer_phone,
        purchase_timeline: data.purchase_timeline ?? undefined,
        home_loan_interest: data.home_loan_interest,
        site_visit_interest: data.site_visit_interest,
        terms_accepted: data.terms_accepted,
        privacy_policy_accepted: data.privacy_policy_accepted,
      }),
    onSuccess: (response) => {
      const { sellerContact: contact } = response.data.data;
      setSellerContact(contact);
      dispatch(addToast({ type: 'success', message: 'Appointment requested successfully!' }));
      onSuccess?.();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? 'Failed to submit appointment request';
      dispatch(addToast({ type: 'error', message: msg }));
    },
  });

  // Min datetime: now + 1 hour
  const minDateTime = new Date(Date.now() + 3600_000).toISOString().slice(0, 16);

  // If seller contact is revealed, show it
  if (sellerContact) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Appointment Request Submitted!</h3>
          <p className="text-sm text-green-700 mb-4">
            Your appointment request has been sent to the seller. Here are the seller's contact details:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Name:</span>
              <span className="text-gray-900">{sellerContact.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Email:</span>
              <a href={`mailto:${sellerContact.email}`} className="text-primary-600 hover:underline">
                {sellerContact.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Phone:</span>
              <a href={`tel:${sellerContact.phone}`} className="text-primary-600 hover:underline">
                {sellerContact.phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="space-y-6">
      {/* Reason to Buy */}
      <div className="flex flex-col">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reason to Buy <span className="text-error-500 ml-1">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="Investment"
              {...register('reason_to_buy')}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-900">Investment</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="Self Use"
              {...register('reason_to_buy')}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-gray-900">Self Use</span>
          </label>
        </div>
        {errors.reason_to_buy && (
          <p className="mt-1.5 text-sm text-error-600">{errors.reason_to_buy.message}</p>
        )}
      </div>

      {/* Is Property Dealer */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="is_property_dealer"
          {...register('is_property_dealer')}
          className="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
        />
        <label htmlFor="is_property_dealer" className="text-sm text-gray-900 cursor-pointer">
          I am a property dealer
        </label>
      </div>

      {/* Buyer Name */}
      <Input
        label="Your Name"
        type="text"
        required
        error={errors.buyer_name?.message}
        {...register('buyer_name')}
      />

      {/* Buyer Phone */}
      <Input
        label="Your Phone Number"
        type="tel"
        required
        error={errors.buyer_phone?.message}
        {...register('buyer_phone')}
      />

      {/* Preferred Date & Time */}
      <Input
        label="Preferred Date & Time"
        type="datetime-local"
        min={minDateTime}
        required
        error={errors.requestedDateTime?.message}
        {...register('requestedDateTime')}
      />

      {/* Purchase Timeline (Optional) */}
      <Select
        label="Purchase Timeline (Optional)"
        options={[
          { value: '3 months', label: 'Within 3 months' },
          { value: '6 months', label: 'Within 6 months' },
          { value: 'More than 6 months', label: 'More than 6 months' },
        ]}
        placeholder="Select timeline"
        error={errors.purchase_timeline?.message}
        {...register('purchase_timeline')}
      />

      {/* Home Loan Interest (Optional) */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="home_loan_interest"
          {...register('home_loan_interest')}
          className="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
        />
        <label htmlFor="home_loan_interest" className="text-sm text-gray-900 cursor-pointer">
          I am interested in home loan assistance
        </label>
      </div>

      {/* Site Visit Interest (Optional) */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="site_visit_interest"
          {...register('site_visit_interest')}
          className="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
        />
        <label htmlFor="site_visit_interest" className="text-sm text-gray-900 cursor-pointer">
          I am interested in a site visit
        </label>
      </div>

      {/* Terms and Conditions */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="terms_accepted"
          {...register('terms_accepted')}
          className="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
        />
        <label htmlFor="terms_accepted" className="text-sm text-gray-900 cursor-pointer">
          I accept the{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
            terms and conditions
          </a>{' '}
          <span className="text-error-500">*</span>
        </label>
      </div>
      {errors.terms_accepted && (
        <p className="text-sm text-error-600">{errors.terms_accepted.message}</p>
      )}

      {/* Privacy Policy */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          id="privacy_policy_accepted"
          {...register('privacy_policy_accepted')}
          className="mt-1 w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
        />
        <label htmlFor="privacy_policy_accepted" className="text-sm text-gray-900 cursor-pointer">
          I accept the{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
            privacy policy
          </a>{' '}
          <span className="text-error-500">*</span>
        </label>
      </div>
      {errors.privacy_policy_accepted && (
        <p className="text-sm text-error-600">{errors.privacy_policy_accepted.message}</p>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" loading={mutation.isPending} fullWidth>
          Submit Appointment Request
        </Button>
      </div>
    </form>
  );
};

export default BuyerQualificationForm;
