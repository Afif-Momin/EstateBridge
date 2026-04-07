import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PropertyCard } from '../PropertyCard';
import type { Property } from '../../../types';

describe('PropertyCard Integration Tests', () => {
  describe('Thumbnail Usage for Performance', () => {
    it('should prioritize thumbnail over full image for better performance', () => {
      const property: Property = {
        id: 'prop-1',
        title: 'Test Property',
        description: 'Test description',
        price: 300000,
        region: 'North',
        address: '123 Test St',
        propertyType: 'house',
        status: 'available',
        sellerId: 'seller-1',
        imageUrls: ['https://cdn.example.com/images/full/large-image-5mb.jpg'],
        thumbnailUrls: ['https://cdn.example.com/images/thumb/small-image-50kb.jpg'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <BrowserRouter>
          <PropertyCard property={property} />
        </BrowserRouter>
      );

      const img = screen.getByAltText('Test Property') as HTMLImageElement;
      
      // Should use the smaller thumbnail for card view
      expect(img.src).toBe('https://cdn.example.com/images/thumb/small-image-50kb.jpg');
      expect(img.src).not.toBe('https://cdn.example.com/images/full/large-image-5mb.jpg');
    });

    it('should handle properties with only full images (backward compatibility)', () => {
      const legacyProperty: Property = {
        id: 'prop-2',
        title: 'Legacy Property',
        description: 'Old property without thumbnails',
        price: 400000,
        region: 'South',
        address: '456 Old St',
        propertyType: 'apartment',
        status: 'available',
        sellerId: 'seller-2',
        imageUrls: ['https://cdn.example.com/images/legacy-image.jpg'],
        // No thumbnailUrls - simulating old data
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <BrowserRouter>
          <PropertyCard property={legacyProperty} />
        </BrowserRouter>
      );

      const img = screen.getByAltText('Legacy Property') as HTMLImageElement;
      
      // Should fallback to full image when thumbnail not available
      expect(img.src).toBe('https://cdn.example.com/images/legacy-image.jpg');
    });

    it('should handle properties with empty thumbnail array', () => {
      const property: Property = {
        id: 'prop-3',
        title: 'Empty Thumbnails Property',
        description: 'Property with empty thumbnail array',
        price: 350000,
        region: 'East',
        address: '789 Empty St',
        propertyType: 'condo',
        status: 'available',
        sellerId: 'seller-3',
        imageUrls: ['https://cdn.example.com/images/full-image.jpg'],
        thumbnailUrls: [], // Empty array
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <BrowserRouter>
          <PropertyCard property={property} />
        </BrowserRouter>
      );

      const img = screen.getByAltText('Empty Thumbnails Property') as HTMLImageElement;
      
      // Should fallback to full image when thumbnail array is empty
      expect(img.src).toBe('https://cdn.example.com/images/full-image.jpg');
    });
  });

  describe('Requirement 13.3 Validation', () => {
    it('should use 400px width thumbnails for property cards as per requirement', () => {
      // This test validates that the component uses thumbnails which are
      // generated at 400px width according to Requirement 13.3
      const property: Property = {
        id: 'prop-4',
        title: 'Requirement Test Property',
        description: 'Testing requirement compliance',
        price: 500000,
        region: 'West',
        address: '321 Req St',
        propertyType: 'house',
        status: 'available',
        sellerId: 'seller-4',
        imageUrls: ['https://cdn.example.com/prop-4/img-1_full.jpg'],
        thumbnailUrls: ['https://cdn.example.com/prop-4/img-1_thumb.jpg'], // 400px width
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      render(
        <BrowserRouter>
          <PropertyCard property={property} />
        </BrowserRouter>
      );

      const img = screen.getByAltText('Requirement Test Property') as HTMLImageElement;
      
      // Verify thumbnail URL is used (which is 400px width per requirement)
      expect(img.src).toContain('_thumb.jpg');
      expect(img.src).not.toContain('_full.jpg');
    });
  });
});
