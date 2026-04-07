import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PropertyStatusBadge } from '../PropertyStatusBadge';
import type { PropertyProStatus } from '../../../types';

describe('PropertyStatusBadge', () => {
  describe('Status Display', () => {
    it('renders For Sale status with success styling', () => {
      render(<PropertyStatusBadge status="For Sale" />);
      const badge = screen.getByRole('status');
      
      expect(badge).toHaveTextContent('For Sale');
      expect(badge).toHaveClass('bg-success-100', 'text-success-700');
    });

    it('renders For Rent status with success styling', () => {
      render(<PropertyStatusBadge status="For Rent" />);
      const badge = screen.getByRole('status');
      
      expect(badge).toHaveTextContent('For Rent');
      expect(badge).toHaveClass('bg-success-100', 'text-success-700');
    });

    it('renders Under Construction status with info styling', () => {
      render(<PropertyStatusBadge status="Under Construction" />);
      const badge = screen.getByRole('status');
      
      expect(badge).toHaveTextContent('Under Construction');
      expect(badge).toHaveClass('bg-primary-100', 'text-primary-700');
    });

    it('renders Waiting for Admin Approval status with warning styling', () => {
      render(<PropertyStatusBadge status="Waiting for Admin Approval" />);
      const badge = screen.getByRole('status');
      
      expect(badge).toHaveTextContent('Waiting for Admin Approval');
      expect(badge).toHaveClass('bg-warning-100', 'text-warning-700');
    });

    it('renders Rejected status with error styling', () => {
      render(<PropertyStatusBadge status="Rejected" />);
      const badge = screen.getByRole('status');
      
      expect(badge).toHaveTextContent('Rejected');
      expect(badge).toHaveClass('bg-error-100', 'text-error-700');
    });

    it('renders Closed status with neutral styling', () => {
      render(<PropertyStatusBadge status="Closed" />);
      const badge = screen.getByRole('status');
      
      expect(badge).toHaveTextContent('Closed');
      expect(badge).toHaveClass('bg-secondary-100', 'text-secondary-700');
    });

    it('renders Finished status with neutral styling', () => {
      render(<PropertyStatusBadge status="Finished" />);
      const badge = screen.getByRole('status');
      
      expect(badge).toHaveTextContent('Finished');
      expect(badge).toHaveClass('bg-secondary-100', 'text-secondary-700');
    });
  });

  describe('Size Variants', () => {
    it('renders small size correctly', () => {
      render(<PropertyStatusBadge status="For Sale" size="sm" />);
      const badge = screen.getByRole('status');
      
      expect(badge).toHaveClass('px-2', 'py-1', 'text-xs');
    });

    it('renders medium size by default', () => {
      render(<PropertyStatusBadge status="For Sale" />);
      const badge = screen.getByRole('status');
      
      expect(badge).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('renders large size correctly', () => {
      render(<PropertyStatusBadge status="For Sale" size="lg" />);
      const badge = screen.getByRole('status');
      
      expect(badge).toHaveClass('px-4', 'py-2', 'text-base');
    });
  });

  describe('Icons', () => {
    it('renders an icon for each status', () => {
      const statuses: PropertyProStatus[] = [
        'For Sale',
        'For Rent',
        'Under Construction',
        'Closed',
        'Finished',
        'Waiting for Admin Approval',
        'Rejected',
      ];

      statuses.forEach((status) => {
        const { container } = render(<PropertyStatusBadge status={status} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper role attribute', () => {
      render(<PropertyStatusBadge status="For Sale" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has proper aria-label', () => {
      render(<PropertyStatusBadge status="For Sale" />);
      const badge = screen.getByRole('status');
      
      expect(badge).toHaveAttribute('aria-label', 'Property status: For Sale');
    });

    it('marks icon as decorative with aria-hidden', () => {
      const { container } = render(<PropertyStatusBadge status="For Sale" />);
      const iconSpan = container.querySelector('span[aria-hidden="true"]');
      
      expect(iconSpan).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      render(<PropertyStatusBadge status="For Sale" className="custom-class" />);
      const badge = screen.getByRole('status');
      
      expect(badge).toHaveClass('custom-class');
    });

    it('preserves base classes when custom className is provided', () => {
      render(<PropertyStatusBadge status="For Sale" className="custom-class" />);
      const badge = screen.getByRole('status');
      
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full');
    });
  });
});
