// Common types for the Estate Bridge platform

export type UserRole = 'buyer' | 'seller';

export type PropertyStatus = 'available' | 'under_offer' | 'sold';

export type PropertyType =
  | 'house'
  | 'apartment'
  | 'condo'
  | 'land'
  | 'commercial';

// Enhanced property status for admin approval workflow
export type PropertyProStatus = 
  | 'For Sale'
  | 'For Rent'
  | 'Under Construction'
  | 'Closed'
  | 'Finished'
  | 'Waiting for Admin Approval'
  | 'Rejected';

export type ReportReason = 
  | 'Spam'
  | 'Inappropriate Content'
  | 'Fake Images'
  | 'Duplicate Listing'
  | 'Other';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'declined'
  | 'cancelled';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Email verification fields
  emailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationTokenExpiry?: Date;
  
  // Location data
  buy_country?: string;
  buy_city?: string;
  buy_state?: string;
  buy_address?: string;
  buy_pincode?: string;
  
  // Currency preference
  currency?: 'USD' | 'INR';
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  region: string;
  address: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  sellerId: string;
  seller?: User;
  imageUrls: string[];
  thumbnailUrls?: string[];      // Compressed thumbnails
  createdAt: Date;
  updatedAt: Date;
  
  // Enhanced status management fields
  pro_status?: PropertyProStatus;
  added_by_broker?: boolean;
  
  // Currency field
  currency?: 'USD' | 'INR';
  
  // Spam detection fields
  flagged?: boolean;
  flaggedReason?: string;
  flaggedAt?: Date;
  reportCount?: number;
  
  // Admin approval fields
  approvedBy?: string;          // Admin user ID
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
}

export interface BuyerInterest {
  id: string;
  listingId: string;
  listing?: Property;
  buyerId: string;
  buyer?: User;
  sellerId: string;
  seller?: User;
  requestedDateTime: Date;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Qualification fields (Requirements 9.1, 9.2, 9.3)
  reason_to_buy: 'Investment' | 'Self Use';
  is_property_dealer: boolean;
  buyer_name: string;
  buyer_phone: string;
  
  // Optional qualification fields
  purchase_timeline?: '3 months' | '6 months' | 'More than 6 months';
  home_loan_interest?: boolean;
  site_visit_interest?: boolean;
  
  // Terms acceptance
  terms_accepted: boolean;
  privacy_policy_accepted: boolean;
  
  // Contact revealed tracking
  contact_revealed: boolean;
  contact_revealed_at?: Date;
}

// Legacy alias for backward compatibility
export interface Appointment extends BuyerInterest {}

export interface Feedback {
  id: string;
  listingId: string;
  listing?: Property;
  buyerId: string;
  buyer?: User;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface PropertyReport {
  id: string;
  propertyId: string;
  property?: Property;
  reporterId: string;
  reporter?: User;
  reason: ReportReason;
  additionalDetails?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

export interface Region {
  id: string;
  name: string;
  displayName: string;
  active: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchFilters {
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: PropertyType;
  keyword?: string;
  status?: PropertyStatus;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
