import {
  getFirebaseFirestore,
} from '../config/firebase';
import {
  Property,
  PropertyStatus,
  PropertyType,
  PropertyProStatus,
  SearchFilters,
  PaginatedResponse,
} from '../types';
import { DatabaseError, NotFoundError } from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';

/**
 * Property Repository
 * Handles all Firestore operations for the properties collection
 */

export interface CreatePropertyData {
  title: string;
  description: string;
  price: number;
  region: string;
  address: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  sellerId: string;
  imageUrls?: string[];
  pro_status?: PropertyProStatus;
  currency?: 'USD' | 'INR';
  flagged?: boolean;
  reportCount?: number;
}

export interface UpdatePropertyData {
  title?: string;
  description?: string;
  price?: number;
  region?: string;
  address?: string;
  propertyType?: PropertyType;
  status?: PropertyStatus;
  imageUrls?: string[];
  thumbnailUrls?: string[];
  pro_status?: PropertyProStatus;
  currency?: 'USD' | 'INR';
  reportCount?: number;
}

class PropertyRepository {
  private collectionName = 'properties';

  /**
   * Create a new property in Firestore
   */
  async create(data: CreatePropertyData): Promise<Property> {
    try {
      const db = getFirebaseFirestore();
      const propertyRef = db.collection(this.collectionName).doc();

      const now = new Date();
      const propertyData = {
        ...data,
        imageUrls: data.imageUrls || [],
        createdAt: now,
        updatedAt: now,
      };

      await propertyRef.set(propertyData);

      logWithContext('info', 'Property created successfully', {
        propertyId: propertyRef.id,
        sellerId: data.sellerId,
      });

      return {
        id: propertyRef.id,
        ...propertyData,
      };
    } catch (error) {
      logWithContext('error', 'Error creating property', { error });
      throw new DatabaseError('Failed to create property');
    }
  }

  /**
   * Find a property by ID
   */
  async findById(id: string): Promise<Property | null> {
    try {
      const db = getFirebaseFirestore();
      const propertyDoc = await db
        .collection(this.collectionName)
        .doc(id)
        .get();

      if (!propertyDoc.exists) {
        return null;
      }

      const data = propertyDoc.data();
      return {
        id: propertyDoc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        updatedAt: data?.updatedAt?.toDate(),
      } as Property;
    } catch (error) {
      logWithContext('error', 'Error finding property by ID', { error, propertyId: id });
      throw new DatabaseError('Failed to retrieve property');
    }
  }

  /**
   * Find all properties by seller ID
   */
  async findBySellerId(
    sellerId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Property>> {
    try {
      const db = getFirebaseFirestore();

      // Get total count
      const countSnapshot = await db
        .collection(this.collectionName)
        .where('sellerId', '==', sellerId)
        .get();
      const total = countSnapshot.size;

      // Get paginated results
      const offset = (page - 1) * limit;
      const snapshot = await db
        .collection(this.collectionName)
        .where('sellerId', '==', sellerId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      const properties: Property[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Property;
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: properties,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logWithContext('error', 'Error finding properties by seller ID', {
        error,
        sellerId,
      });
      throw new DatabaseError('Failed to retrieve seller properties');
    }
  }

  /**
   * Update a property by ID
   */
  async update(id: string, data: UpdatePropertyData): Promise<Property> {
    try {
      const db = getFirebaseFirestore();
      const propertyRef = db.collection(this.collectionName).doc(id);

      // Check if property exists
      const propertyDoc = await propertyRef.get();
      if (!propertyDoc.exists) {
        throw new NotFoundError('Property not found');
      }

      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      await propertyRef.update(updateData);

      logWithContext('info', 'Property updated successfully', { propertyId: id });

      // Fetch and return updated property
      const updatedDoc = await propertyRef.get();
      const updatedData = updatedDoc.data();

      return {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData?.createdAt?.toDate(),
        updatedAt: updatedData?.updatedAt?.toDate(),
      } as Property;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logWithContext('error', 'Error updating property', { error, propertyId: id });
      throw new DatabaseError('Failed to update property');
    }
  }

  /**
   * Delete a property by ID
   */
  async delete(id: string): Promise<void> {
    try {
      const db = getFirebaseFirestore();
      const propertyRef = db.collection(this.collectionName).doc(id);

      // Check if property exists
      const propertyDoc = await propertyRef.get();
      if (!propertyDoc.exists) {
        throw new NotFoundError('Property not found');
      }

      await propertyRef.delete();

      logWithContext('info', 'Property deleted successfully', { propertyId: id });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logWithContext('error', 'Error deleting property', { error, propertyId: id });
      throw new DatabaseError('Failed to delete property');
    }
  }

  /**
   * Search properties with filters
   */
  async search(filters: SearchFilters, userId?: string): Promise<PaginatedResponse<Property>> {
    try {
      const db = getFirebaseFirestore();
      const {
        region,
        minPrice,
        maxPrice,
        propertyType,
        status,
        keyword,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      let query: FirebaseFirestore.Query = db.collection(this.collectionName);

      // Apply filters
      if (status) {
        query = query.where('status', '==', status);
      }

      if (region) {
        query = query.where('region', '==', region);
      }

      if (propertyType) {
        query = query.where('propertyType', '==', propertyType);
      }

      // Price range filtering (done in-memory due to Firestore limitations)
      // Firestore doesn't support multiple range queries on different fields
      const snapshot = await query.get();

      let properties: Property[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Property;
      });

      // Filter out pending properties from public search
      // Allow property owner to see their own pending properties
      properties = properties.filter((p) => {
        // If property is pending approval
        if (p.pro_status === 'Waiting for Admin Approval') {
          // Only show to the owner
          return userId && p.sellerId === userId;
        }
        // Show all other properties
        return true;
      });

      // Apply price range filter
      if (minPrice !== undefined) {
        properties = properties.filter((p) => p.price >= minPrice);
      }
      if (maxPrice !== undefined) {
        properties = properties.filter((p) => p.price <= maxPrice);
      }

      // Apply keyword search (case-insensitive)
      if (keyword) {
        const lowerKeyword = keyword.toLowerCase();
        properties = properties.filter(
          (p) =>
            p.title.toLowerCase().includes(lowerKeyword) ||
            p.description.toLowerCase().includes(lowerKeyword)
        );
      }

      // Sort properties
      properties.sort((a, b) => {
        const aValue = sortBy === 'price' ? a.price : a.createdAt.getTime();
        const bValue = sortBy === 'price' ? b.price : b.createdAt.getTime();

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const total = properties.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedProperties = properties.slice(offset, offset + limit);

      return {
        data: paginatedProperties,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logWithContext('error', 'Error searching properties', { error, filters });
      throw new DatabaseError('Failed to search properties');
    }
  }

  /**
   * Get all available properties (status = 'available')
   */
  async getAvailableProperties(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Property>> {
    return this.search({
      status: 'available',
      page,
      limit,
    });
  }
}

export default new PropertyRepository();

