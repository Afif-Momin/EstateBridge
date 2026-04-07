import type { PropertyProStatus } from '../../types';

export type BadgeSize = 'sm' | 'md' | 'lg';

interface PropertyStatusBadgeProps {
  status: PropertyProStatus;
  size?: BadgeSize;
  className?: string;
}

interface StatusConfig {
  color: string;
  icon: React.ReactElement;
}

const sizeClasses: Record<BadgeSize, { container: string; icon: string; text: string }> = {
  sm: {
    container: 'px-2 py-1 gap-1',
    icon: 'h-3 w-3',
    text: 'text-xs',
  },
  md: {
    container: 'px-3 py-1.5 gap-1.5',
    icon: 'h-4 w-4',
    text: 'text-sm',
  },
  lg: {
    container: 'px-4 py-2 gap-2',
    icon: 'h-5 w-5',
    text: 'text-base',
  },
};

export function PropertyStatusBadge({ 
  status, 
  size = 'md',
  className = '' 
}: PropertyStatusBadgeProps) {
  const getStatusConfig = (status: PropertyProStatus): StatusConfig => {
    switch (status) {
      case 'For Sale':
        return {
          color: 'bg-success-100 text-success-700 border-success-200',
          icon: (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        };
      case 'For Rent':
        return {
          color: 'bg-success-100 text-success-700 border-success-200',
          icon: (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          ),
        };
      case 'Under Construction':
        return {
          color: 'bg-primary-100 text-primary-700 border-primary-200',
          icon: (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          ),
        };
      case 'Waiting for Admin Approval':
        return {
          color: 'bg-warning-100 text-warning-700 border-warning-200',
          icon: (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case 'Rejected':
        return {
          color: 'bg-error-100 text-error-700 border-error-200',
          icon: (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case 'Closed':
        return {
          color: 'bg-secondary-100 text-secondary-700 border-secondary-200',
          icon: (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
        };
      case 'Finished':
        return {
          color: 'bg-secondary-100 text-secondary-700 border-secondary-200',
          icon: (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      default:
        return {
          color: 'bg-secondary-100 text-secondary-700 border-secondary-200',
          icon: (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeConfig = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${config.color} ${sizeConfig.container} ${sizeConfig.text} ${className}`.trim()}
      role="status"
      aria-label={`Property status: ${status}`}
    >
      <span className={sizeConfig.icon} aria-hidden="true">
        {config.icon}
      </span>
      <span>{status}</span>
    </span>
  );
}
