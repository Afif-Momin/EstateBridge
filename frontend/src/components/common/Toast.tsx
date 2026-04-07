import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { removeToast } from '../../store/slices/uiSlice';
import type { Toast as ToastType } from '../../store/slices/uiSlice';

const icons: Record<ToastType['type'], string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const colorClasses: Record<ToastType['type'], string> = {
  success: 'bg-success-50 border-success-400 text-success-800',
  error: 'bg-error-50 border-error-400 text-error-800',
  info: 'bg-primary-50 border-primary-400 text-primary-800',
  warning: 'bg-warning-50 border-warning-400 text-warning-800',
};

const ToastItem: React.FC<{ toast: ToastType }> = ({ toast }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(toast.id)), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-md text-sm',
        colorClasses[toast.type],
      ].join(' ')}
    >
      <span aria-hidden="true">{icons[toast.type]}</span>
      <span>{toast.message}</span>
      <button
        onClick={() => dispatch(removeToast(toast.id))}
        aria-label="Dismiss notification"
        className="ml-auto opacity-60 hover:opacity-100 focus:outline-none"
      >
        ✕
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const toasts = useAppSelector((s) => s.ui.toasts);

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
};

export default ToastContainer;
