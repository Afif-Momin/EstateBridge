// API configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://estatebridge-backend.onrender.com/api/v1';

export const API_TIMEOUT = 30000; // 30 seconds

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  // Property endpoints
  PROPERTIES: {
    BASE: '/properties',
    BY_ID: (id: string) => `/properties/${id}`,
    BY_SELLER: '/properties/seller/me',
    IMAGES: (id: string) => `/properties/${id}/images`,
  },
  // Search endpoints
  SEARCH: {
    PROPERTIES: '/search/properties',
    REGIONS: '/search/regions',
  },
  // Appointment endpoints
  APPOINTMENTS: {
    BASE: '/appointments',
    BY_ID: (id: string) => `/appointments/${id}`,
    BUYER: '/appointments/buyer/me',
    SELLER: '/appointments/seller/me',
  },
  // Feedback endpoints
  FEEDBACK: {
    BASE: '/feedback',
    BY_LISTING: (id: string) => `/feedback/listing/${id}`,
    RATING: (id: string) => `/feedback/listing/${id}/rating`,
  },
  // AI Support endpoints
  AI_SUPPORT: {
    MESSAGE: '/ai-support/message',
    CONVERSATION: '/ai-support/conversation',
    BY_ID: (id: string) => `/ai-support/conversation/${id}`,
  },
  // Dashboard endpoints
  DASHBOARD: {
    SELLER: '/dashboard/seller',
    BUYER: '/dashboard/buyer',
  },
};
