import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PropertyCard } from '../PropertyCard';
import type { Property } from '../../../types';

const mockProperty: Property = {
  id: 'prop-123',
  title: 'Beautiful House',
  description: 'A lovely property',
  price: 500000,
  region: 'North',
  address: '123 Main St',
  propertyType: 'house',
  status: 'available',
  sellerId: 'seller-1',
  imageUrls: ['https://example.com/full-image.jpg'],
  thumbnailUrls: ['https://example.com/thumb-image.jpg'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const renderPropertyCard = (property: Property) => {
  return render(
    <BrowserRouter>
      <PropertyCard property={property} />
    </BrowserRouter>
  );
};

describe('PropertyCard', () => {
  describe('Image Display', () => {
    it('should use thumbnail URL when available', () => {
      renderPropertyCard(mockProperty);
      
      const img = screen.getByAltText('Beautiful House') as HTMLImageElement;
      expect(img.src).toBe('https://example.com/thumb-image.jpg');
    });

    it('should fallback to full image URL when thumbnail not available', () => {
      const propertyWithoutThumbnail = {
        ...mockProperty,
        thumbnailUrls: undefined,
      };
      
      renderPropertyCard(propertyWithoutThumbnail);
      
      const img = screen.getByAltText('Beautiful House') as HTMLImageElement;
      expect(img.src).toBe('https://example.com/full-image.jpg');
    });

    it('should use placeholder when no images available', () => {
      const propertyWithoutImages = {
        ...mockProperty,
        imageUrls: [],
        thumbnailUrls: undefined,
      };
      
      renderPropertyCard(propertyWithoutImages);
      
      const img = screen.getByAltText('Beautiful House') as HTMLImageElement;
      expect(img.src).toContain('placeholder-property.jpg');
    });

    it('should show loading state before image loads', () => {
      renderPropertyCard(mockProperty);
      
      // Check for loading skeleton
      const loadingSkeleton = document.querySelector('.animate-pulse');
      expect(loadingSkeleton).toBeInTheDocument();
    });

    it('should hide loading state after image loads', async () => {
      renderPropertyCard(mockProperty);
      
      const img = screen.getByAltText('Beautiful House') as HTMLImageElement;
      
      // Simulate image load
      fireEvent.load(img);
      
      await waitFor(() => {
        expect(img).toHaveClass('opacity-100');
      });
    });
  });

  describe('Property Information Display', () => {
    it('should display property title', () => {
      renderPropertyCard(mockProperty);
      expect(screen.getByText('Beautiful House')).toBeInTheDocument();
    });

    it('should display formatted price with USD currency', () => {
      renderPropertyCard(mockProperty);
      expect(screen.getByText('500,000.00 USD')).toBeInTheDocument();
    });

    it('should display formatted price with INR currency', () => {
      const propertyWithINR = {
        ...mockProperty,
        price: 50000000,
        currency: 'INR' as const,
      };
      renderPropertyCard(propertyWithINR);
      expect(screen.getByText('₹5,00,00,000 INR')).toBeInTheDocument();
    });

    it('should default to USD when currency is not specified', () => {
      const propertyWithoutCurrency = {
        ...mockProperty,
        currency: undefined,
      };
      renderPropertyCard(propertyWithoutCurrency);
      expect(screen.getByText('500,000.00 USD')).toBeInTheDocument();
    });

    it('should display property address', () => {
      renderPropertyCard(mockProperty);
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    });

    it('should display property type', () => {
      renderPropertyCard(mockProperty);
      expect(screen.getByText('house')).toBeInTheDocument();
    });

    it('should display region', () => {
      renderPropertyCard(mockProperty);
      expect(screen.getByText('North')).toBeInTheDocument();
    });
  });

  describe('Status Badge', () => {
    it('should display available status with success styling', () => {
      renderPropertyCard(mockProperty);
      const badge = screen.getByText('Available');
      expect(badge).toHaveClass('bg-success-100', 'text-success-700');
    });

    it('should display under offer status with warning styling', () => {
      const propertyUnderOffer = {
        ...mockProperty,
        status: 'under_offer' as const,
      };
      
      renderPropertyCard(propertyUnderOffer);
      const badge = screen.getByText('Under Offer');
      expect(badge).toHaveClass('bg-warning-100', 'text-warning-700');
    });

    it('should display sold status with gray styling', () => {
      const propertySold = {
        ...mockProperty,
        status: 'sold' as const,
      };
      
      renderPropertyCard(propertySold);
      const badge = screen.getByText('Sold');
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700');
    });
  });

  describe('Navigation', () => {
    it('should link to property detail page', () => {
      renderPropertyCard(mockProperty);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/properties/prop-123');
    });
  });
});
