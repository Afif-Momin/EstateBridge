/**
 * Example usage of useCurrency hook
 * Demonstrates how to use the currency formatting hook in React components
 */

import React from 'react';
import { useCurrency } from './useCurrency';
import type { Property } from '../types';

/**
 * Example 1: Basic usage in a component
 */
export const PropertyPriceDisplay: React.FC<{ property: Property }> = ({ property }) => {
  const { formatPrice } = useCurrency();
  
  const formattedPrice = formatPrice(
    property.price,
    property.currency || 'USD'
  );

  return (
    <div className="property-price">
      <span className="text-2xl font-bold">{formattedPrice}</span>
    </div>
  );
};

/**
 * Example 2: Using formatPrice directly (without hook)
 */
import { formatPrice } from './useCurrency';

export const PriceTag: React.FC<{ amount: number; currency: 'USD' | 'INR' }> = ({ 
  amount, 
  currency 
}) => {
  return (
    <span className="price-tag">
      {formatPrice(amount, currency)}
    </span>
  );
};

/**
 * Example 3: Formatting multiple prices
 */
export const PropertyComparison: React.FC<{ properties: Property[] }> = ({ properties }) => {
  const { formatPrice } = useCurrency();

  return (
    <div className="property-comparison">
      {properties.map((property) => (
        <div key={property.id} className="property-item">
          <h3>{property.title}</h3>
          <p className="price">
            {formatPrice(property.price, property.currency || 'USD')}
          </p>
        </div>
      ))}
    </div>
  );
};

/**
 * Example 4: Handling errors gracefully
 */
export const SafePriceDisplay: React.FC<{ 
  amount: number; 
  currency: 'USD' | 'INR' 
}> = ({ amount, currency }) => {
  const { formatPrice } = useCurrency();

  try {
    const formatted = formatPrice(amount, currency);
    return <span>{formatted}</span>;
  } catch (error) {
    console.error('Error formatting price:', error);
    return <span className="text-red-500">Invalid price</span>;
  }
};

/**
 * Example 5: Using in property cards
 */
export const PropertyCard: React.FC<{ property: Property }> = ({ property }) => {
  const { formatPrice } = useCurrency();

  return (
    <div className="property-card">
      <img src={property.thumbnailUrls?.[0] || property.imageUrls[0]} alt={property.title} />
      <div className="property-details">
        <h3>{property.title}</h3>
        <p className="text-sm text-gray-600">{property.region}</p>
        <p className="text-xl font-bold text-blue-600">
          {formatPrice(property.price, property.currency || 'USD')}
        </p>
      </div>
    </div>
  );
};

/**
 * Example 6: Price range display
 */
export const PriceRangeFilter: React.FC<{
  minPrice: number;
  maxPrice: number;
  currency: 'USD' | 'INR';
}> = ({ minPrice, maxPrice, currency }) => {
  const { formatPrice } = useCurrency();

  return (
    <div className="price-range">
      <span>Price Range:</span>
      <span className="font-semibold">
        {formatPrice(minPrice, currency)} - {formatPrice(maxPrice, currency)}
      </span>
    </div>
  );
};
