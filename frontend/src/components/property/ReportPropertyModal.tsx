import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';
import { addToast } from '../../store/slices/uiSlice';
import { useAppDispatch } from '../../store';
import Modal from '../common/Modal';
import Select from '../common/Select';
import Textarea from '../common/Textarea';
import { Button } from '../common/Button';
import type { ApiResponse, PropertyReport, ReportReason } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'Spam', label: 'Spam' },
  { value: 'Inappropriate Content', label: 'Inappropriate Content' },
  { value: 'Fake Images', label: 'Fake Images' },
  { value: 'Duplicate Listing', label: 'Duplicate Listing' },
  { value: 'Other', label: 'Other' },
];

const schema = z.object({
  reason: z.string().min(1, 'Please select a reason'),
  additionalDetails: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const ReportPropertyModal: React.FC<Props> = ({ isOpen, onClose, propertyId, propertyTitle }) => {
  const dispatch = useAppDispatch();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      reason: '',
      additionalDetails: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      apiClient.post<ApiResponse<PropertyReport>>(`/properties/${propertyId}/report`, {
        reason: data.reason,
        additionalDetails: data.additionalDetails || undefined,
      }),
    onSuccess: () => {
      dispatch(addToast({ type: 'success', message: 'Property reported successfully' }));
      reset();
      onClose();
    },
    onError: (err: any) => {
      const errorCode = err?.response?.data?.error?.code;
      const errorMessage = err?.response?.data?.error?.message;
      
      if (errorCode === 'DUPLICATE_REPORT') {
        dispatch(addToast({ type: 'info', message: 'You have already reported this property' }));
        onClose();
      } else {
        dispatch(addToast({ type: 'error', message: errorMessage || 'Failed to report property' }));
      }
    },
  });

  const handleClose = () => {
    if (!mutation.isPending) {
      reset();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Report Property" size="md">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} noValidate className="space-y-4">
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            You are reporting: <span className="font-semibold text-gray-900">{propertyTitle}</span>
          </p>
        </div>

        <Select
          label="Reason"
          placeholder="Select a reason"
          options={REPORT_REASONS}
          required
          error={errors.reason?.message}
          disabled={mutation.isPending}
          {...register('reason')}
        />

        <Textarea
          label="Additional Details"
          placeholder="Provide any additional information (optional)"
          rows={4}
          helperText="Optional: Add more context about why you're reporting this property"
          error={errors.additionalDetails?.message}
          disabled={mutation.isPending}
          {...register('additionalDetails')}
        />

        <div className="flex gap-3 justify-end pt-2">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="danger"
            loading={mutation.isPending}
          >
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReportPropertyModal;
