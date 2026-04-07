import propertyRepository, {
  CreatePropertyData,
  UpdatePropertyData,
} from '../repositories/propertyRepository';
import imageService from './imageService';
import { Property, PropertyStatus } from '../types';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
} from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';
import { isValidPrice } from '../utils/validation';

/**
 * Property Service
 * Handles business logic for property management
 */

class PropertyService {
  /**
   * Create a new property
   */
  async createProperty(
    data: CreatePropertyData,
    sellerId: string
  ): Promise<Property> {
    try {
      // Validate price
      if (!isValidPrice(data.price)) {
        throw new ValidationError('Price must be a positive number');
      }

      // Validate title length
      if (data.title.length < 5 || data.title.length > 200) {
        throw new ValidationError('Title must be between 5 and 200 characters');
      }

      // Validate description length
      if (data.description.length < 20 || data.description.length > 2000) {
        throw new ValidationError(
          'Description must be between 20 and 2000 characters'
        );
      }

      // Validate address length
      if (data.address.length < 10 || data.address.length > 500) {
        throw new ValidationError(
          'Address must be between 10 and 500 characters'
        );
      }

      // Fetch user to get currency preference
      const { getFirebaseFirestore } = await import('../config/firebase');
      const db = getFirebaseFirestore();
      const userDoc = await db.collection('users').doc(sellerId).get();
      const userData = userDoc.data();
      const currency = userData?.currency || 'INR'; // Default to INR if not set

      // Create property with seller ID and currency
      const propertyData: CreatePropertyData = {
        ...data,
        sellerId,
        currency,
        // Initialize spam detection fields
        flagged: false,
        reportCount: 0,
      };

      const property = await propertyRepository.create(propertyData);

      logWithContext('info', 'Property created', {
        propertyId: property.id,
        sellerId,
        currency,
        pro_status: property.pro_status,
      });

      return property;
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof NotFoundError
      ) {
        throw error;
      }
      logWithContext('error', 'Error creating property', { error, sellerId });
      throw error;
    }
  }

  /**
   * Update an existing property
   */
  async updateProperty(
    propertyId: string,
    data: UpdatePropertyData,
    sellerId: string
  ): Promise<Property> {
    try {
      // Verify property exists and ownership
      const existingProperty = await propertyRepository.findById(propertyId);

      if (!existingProperty) {
        throw new NotFoundError('Property not found');
      }

      if (existingProperty.sellerId !== sellerId) {
        throw new AuthorizationError(
          'You are not authorized to update this property'
        );
      }

      // Validate price if provided
      if (data.price !== undefined && !isValidPrice(data.price)) {
        throw new ValidationError('Price must be a positive number');
      }

      // Validate title length if provided
      if (
        data.title !== undefined &&
        (data.title.length < 5 || data.title.length > 200)
      ) {
        throw new ValidationError('Title must be between 5 and 200 characters');
      }

      // Validate description length if provided
      if (
        data.description !== undefined &&
        (data.description.length < 20 || data.description.length > 2000)
      ) {
        throw new ValidationError(
          'Description must be between 20 and 2000 characters'
        );
      }

      // Validate address length if provided
      if (
        data.address !== undefined &&
        (data.address.length < 10 || data.address.length > 500)
      ) {
        throw new ValidationError(
          'Address must be between 10 and 500 characters'
        );
      }

      const updatedProperty = await propertyRepository.update(propertyId, data);

      logWithContext('info', 'Property updated', {
        propertyId,
        sellerId,
      });

      return updatedProperty;
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof AuthorizationError
      ) {
        throw error;
      }
      logWithContext('error', 'Error updating property', {
        error,
        propertyId,
        sellerId,
      });
      throw error;
    }
  }

  /**
   * Delete a property
   */
  async deleteProperty(propertyId: string, sellerId: string): Promise<void> {
    try {
      // Verify property exists and ownership
      const existingProperty = await propertyRepository.findById(propertyId);

      if (!existingProperty) {
        throw new NotFoundError('Property not found');
      }

      if (existingProperty.sellerId !== sellerId) {
        throw new AuthorizationError(
          'You are not authorized to delete this property'
        );
      }

      // Delete all images from Firebase Storage
      await imageService.deletePropertyImages(propertyId);

      // Delete property document
      await propertyRepository.delete(propertyId);

      logWithContext('info', 'Property deleted', {
        propertyId,
        sellerId,
      });
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof AuthorizationError
      ) {
        throw error;
      }
      logWithContext('error', 'Error deleting property', {
        error,
        propertyId,
        sellerId,
      });
      throw error;
    }
  }

  /**
   * Get property by ID
   */
  async getPropertyById(propertyId: string): Promise<Property> {
    try {
      const property = await propertyRepository.findById(propertyId);

      if (!property) {
        throw new NotFoundError('Property not found');
      }

      return property;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logWithContext('error', 'Error fetching property', {
        error,
        propertyId,
      });
      throw error;
    }
  }

  /**
   * Get all properties by seller
   */
  async getPropertiesBySeller(
    sellerId: string,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      const result = await propertyRepository.findBySellerId(
        sellerId,
        page,
        limit
      );

      logWithContext('info', 'Fetched seller properties', {
        sellerId,
        count: result.data.length,
      });

      return result;
    } catch (error) {
      logWithContext('error', 'Error fetching seller properties', {
        error,
        sellerId,
      });
      throw error;
    }
  }

  /**
   * Update property status
   */
  async updatePropertyStatus(
    propertyId: string,
    status: PropertyStatus,
    sellerId: string
  ): Promise<Property> {
    try {
      // Verify property exists and ownership
      const existingProperty = await propertyRepository.findById(propertyId);

      if (!existingProperty) {
        throw new NotFoundError('Property not found');
      }

      if (existingProperty.sellerId !== sellerId) {
        throw new AuthorizationError(
          'You are not authorized to update this property status'
        );
      }

      // Validate status transition
      const validStatuses: PropertyStatus[] = [
        'available',
        'under_offer',
        'sold',
      ];
      if (!validStatuses.includes(status)) {
        throw new ValidationError('Invalid property status');
      }

      const updatedProperty = await propertyRepository.update(propertyId, {
        status,
      });

      logWithContext('info', 'Property status updated', {
        propertyId,
        sellerId,
        newStatus: status,
      });

      return updatedProperty;
    } catch (error) {
      if (
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof AuthorizationError
      ) {
        throw error;
      }
      logWithContext('error', 'Error updating property status', {
        error,
        propertyId,
        sellerId,
      });
      throw error;
    }
  }
}

export default new PropertyService();
