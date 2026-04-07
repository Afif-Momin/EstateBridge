import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { useAppSelector } from '../store';
import { Spinner } from '../components/common/Spinner';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import AppointmentBookingModal from '../components/property/AppointmentBookingModal';
import FeedbackSection from '../components/property/FeedbackSection';
import ReportPropertyModal from '../components/property/ReportPropertyModal';
import { BrochureDownloadButton } from '../components/property/BrochureDownloadButton';
import { useCurrency } from '../hooks/useCurrency';
import type { Property, ApiResponse, Feedback } from '../types';

const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useAppSelector((s) => s.auth);
  const { formatPrice } = useCurrency();
  const [imgIdx, setImgIdx] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () =>
      apiClient.get<ApiResponse<Property>>(`/properties/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: feedbackData } = useQuery({
    queryKey: ['feedback', id],
    queryFn: () =>
      apiClient.get<ApiResponse<Feedback[]>>(`/feedback/listing/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: ratingData } = useQuery({
    queryKey: ['rating', id],
    queryFn: () =>
      apiClient.get<ApiResponse<{ averageRating: number; count: number }>>(`/feedback/listing/${id}/rating`).then((r) => r.data.data),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;
  if (!property) return <p className="text-center p-12 text-gray-500">Property not found.</p>;

  // Use full-size images for detail page
  const images = property.imageUrls ?? [];

  const nextImage = () => setImgIdx((prev) => (prev + 1) % images.length);
  const prevImage = () => setImgIdx((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Image gallery */}
      <div className="mb-8">
        {images.length > 0 ? (
          <div>
            <div className="relative group">
              <img
                src={images[imgIdx]}
                alt={`${property.title} - image ${imgIdx + 1}`}
                className="w-full h-96 object-cover rounded-xl cursor-pointer"
                onClick={() => setLightboxOpen(true)}
                loading="lazy"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    aria-label="Previous image"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    aria-label="Next image"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {imgIdx + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${i === imgIdx ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>No images available</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-4xl font-display font-bold text-gray-900">{property.title}</h1>
            <p className="text-4xl font-bold text-primary-600 mt-3">
              {formatPrice(property.price, property.currency || 'USD')}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">{property.region}</span>
            <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium capitalize">{property.propertyType}</span>
            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${property.status === 'available' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
              {property.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-start gap-2 text-gray-600">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">{property.address}</p>
          </div>

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 leading-relaxed">{property.description}</p>
          </div>

          {ratingData && ratingData.count > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-semibold text-gray-900">{ratingData.averageRating.toFixed(1)}</span>
              </div>
              <span className="text-gray-500">({ratingData.count} {ratingData.count === 1 ? 'review' : 'reviews'})</span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-8 h-fit space-y-4">
          {role === 'buyer' && property.status === 'available' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Interested in this property?</h3>
              <p className="text-sm text-gray-600 mb-4">Schedule a viewing with the seller</p>
              <Button onClick={() => setBookingOpen(true)} className="w-full">
                Book Appointment
              </Button>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Property Brochure</h3>
            <p className="text-sm text-gray-600 mb-4">Download a detailed PDF brochure</p>
            <BrochureDownloadButton 
              propertyId={id!} 
              variant="primary"
              className="w-full"
            />
          </Card>

          {role && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Report an Issue</h3>
              <p className="text-sm text-gray-600 mb-4">Found something wrong with this listing?</p>
              <Button 
                onClick={() => setReportOpen(true)} 
                variant="secondary" 
                className="w-full"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Report Property
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Feedback */}
      <div className="mt-12">
        <FeedbackSection listingId={id!} feedback={feedbackData ?? []} />
      </div>

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close lightbox"
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative max-w-7xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[imgIdx]}
              alt={`${property.title} - image ${imgIdx + 1}`}
              className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full backdrop-blur-sm"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full">
                  {imgIdx + 1} / {images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {bookingOpen && (
        <AppointmentBookingModal
          listingId={id!}
          sellerId={property.sellerId}
          onClose={() => setBookingOpen(false)}
        />
      )}

      {reportOpen && (
        <ReportPropertyModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          propertyId={id!}
          propertyTitle={property.title}
        />
      )}
    </div>
  );
};

export default PropertyDetailPage;
