import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';
import { addToast } from '../../store/slices/uiSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import { Button } from '../common/Button';
import Textarea from '../common/Textarea';
import type { Feedback, ApiResponse } from '../../types';
import { VALIDATION } from '../../constants';

interface Props {
  listingId: string;
  feedback: Feedback[];
}

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(VALIDATION.COMMENT_MIN_LENGTH).max(VALIDATION.COMMENT_MAX_LENGTH),
});

type FormData = z.infer<typeof schema>;

const StarRating: React.FC<{ value: number; onChange?: (v: number) => void; readonly?: boolean }> = ({
  value, onChange, readonly = false,
}) => (
  <div className="flex gap-1" role={readonly ? undefined : 'radiogroup'} aria-label="Rating">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={readonly}
        onClick={() => onChange?.(star)}
        aria-label={readonly ? undefined : `Rate ${star} star${star > 1 ? 's' : ''}`}
        className={`text-2xl ${star <= value ? 'text-yellow-400' : 'text-gray-300'} ${!readonly ? 'hover:text-yellow-400 cursor-pointer' : 'cursor-default'}`}
      >
        ★
      </button>
    ))}
  </div>
);

const FeedbackSection: React.FC<Props> = ({ listingId, feedback }) => {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const { role, user } = useAppSelector((s) => s.auth);
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const alreadySubmitted = feedback.some((f) => f.buyerId === user?.id);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rating: 5 },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      apiClient.post<ApiResponse<Feedback>>('/feedback', { listingId, ...data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback', listingId] });
      dispatch(addToast({ type: 'success', message: 'Feedback submitted!' }));
      setSubmitted(true);
      reset();
    },
    onError: (err: any) => {
      dispatch(addToast({ type: 'error', message: err?.response?.data?.error?.message ?? 'Failed to submit feedback' }));
    },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviews ({feedback.length})</h2>

      {/* Submit form — buyers only, not already submitted */}
      {role === 'buyer' && !alreadySubmitted && !submitted && (
        <form onSubmit={handleSubmit((d) => mutation.mutate({ rating, comment: d.comment }))} noValidate className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <p className="text-sm font-medium text-gray-700">Leave a review</p>
          <StarRating value={rating} onChange={setRating} />
          <Textarea
            label="Comment"
            rows={3}
            required
            error={errors.comment?.message}
            helperText={`${VALIDATION.COMMENT_MIN_LENGTH}–${VALIDATION.COMMENT_MAX_LENGTH} characters`}
            {...register('comment')}
          />
          <Button type="submit" size="sm" loading={mutation.isPending}>Submit Review</Button>
        </form>
      )}

      {/* Feedback list */}
      {feedback.length === 0 ? (
        <p className="text-gray-500 text-sm">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {feedback.map((f) => (
            <div key={f.id} className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <StarRating value={f.rating} readonly />
                <span className="text-xs text-gray-400">{new Date(f.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-700">{f.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackSection;
