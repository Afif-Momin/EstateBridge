import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { Property } from '../../types';
import { ROUTES } from '../../constants';
import { useCurrency } from '../../hooks/useCurrency';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { formatPrice } = useCurrency();

  // Use thumbnail for property card, fallback to full image if thumbnail not available
  const thumbnailUrl = property.thumbnailUrls?.[0];
  const fullImageUrl = property.imageUrls?.[0];
  const imageUrl = thumbnailUrl || fullImageUrl || '/placeholder-property.jpg';
  const detailUrl = ROUTES.PROPERTIES.DETAIL.replace(':id', property.id);

  // Format price with currency from property, default to USD if not specified
  const currency = property.currency || 'USD';
  const formattedPrice = formatPrice(property.price, currency);

  return (
    <Link
      to={detailUrl}
      className="block bg-white rounded-card shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1 overflow-hidden group"
    >
      {/* Image Container */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        <img
          src={imageUrl}
          alt={property.title}
          className={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            setImageError(true);
            setImageLoaded(true);
            e.currentTarget.src = '/placeholder-property.jpg';
          }}
        />
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              property.status === 'available'
                ? 'bg-success-100 text-success-700'
                : property.status === 'under_offer'
                ? 'bg-warning-100 text-warning-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {property.status === 'under_offer' ? 'Under Offer' : property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors duration-200">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-600 mb-3">
          <svg
            className="h-4 w-4 mr-1 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="truncate">{property.address}</span>
        </div>

        {/* Price */}
        <p className="text-2xl font-bold text-primary-600 mb-3">
          {formattedPrice}
        </p>

        {/* Property Type and Region */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="px-2 py-1 bg-gray-100 rounded-md capitalize">
            {property.propertyType}
          </span>
          <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-md">
            {property.region}
          </span>
        </div>
      </div>
    </Link>
  );
}
