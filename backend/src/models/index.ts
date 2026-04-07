// DTOs (Data Transfer Objects) for API requests

// Auth DTOs
export interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  role: 'buyer' | 'seller';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'buyer' | 'seller';
    profileImage?: string;
  };
  token: string;
}

// Property DTOs
export interface CreatePropertyDTO {
  title: string;
  description: string;
  price: number;
  region: string;
  address: string;
  propertyType: 'house' | 'apartment' | 'condo' | 'land' | 'commercial';
  status?: 'available' | 'under_offer' | 'sold';
}

export interface UpdatePropertyDTO {
  title?: string;
  description?: string;
  price?: number;
  region?: string;
  address?: string;
  propertyType?: 'house' | 'apartment' | 'condo' | 'land' | 'commercial';
  status?: 'available' | 'under_offer' | 'sold';
}

// Appointment DTOs
export interface CreateAppointmentDTO {
  listingId: string;
  sellerId: string;
  requestedDateTime: Date | string;
}

export interface UpdateAppointmentStatusDTO {
  status: 'confirmed' | 'declined' | 'cancelled';
}

// Feedback DTOs
export interface CreateFeedbackDTO {
  listingId: string;
  rating: number;
  comment: string;
}

// AI Support DTOs
export interface SendMessageDTO {
  message: string;
  conversationId?: string;
}

// Search DTOs
export interface SearchPropertiesDTO {
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  keyword?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
