// Application constants

export const APP_NAME = 'Estate Bridge';

export const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
] as const;

export const PROPERTY_STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'under_offer', label: 'Under Offer' },
  { value: 'sold', label: 'Sold' },
] as const;

export const USER_ROLES = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
] as const;

export const APPOINTMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'declined', label: 'Declined' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const IMAGE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_COUNT: 10,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const;

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  TITLE_MIN_LENGTH: 5,
  TITLE_MAX_LENGTH: 200,
  DESCRIPTION_MIN_LENGTH: 20,
  DESCRIPTION_MAX_LENGTH: 2000,
  COMMENT_MIN_LENGTH: 10,
  COMMENT_MAX_LENGTH: 500,
  RATING_MIN: 1,
  RATING_MAX: 5,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD: {
    BUYER: '/dashboard/buyer',
    SELLER: '/dashboard/seller',
  },
  PROPERTIES: {
    BROWSE: '/properties',
    DETAIL: '/properties/:id',
    CREATE: '/properties/create',
    EDIT: '/properties/:id/edit',
    MY_LISTINGS: '/properties/my-listings',
  },
  APPOINTMENTS: {
    BUYER: '/appointments/buyer',
    SELLER: '/appointments/seller',
  },
  FEEDBACK: '/feedback',
  AI_SUPPORT: '/ai-support',
  PROFILE: '/profile',
} as const;
