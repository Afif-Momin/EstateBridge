import { getFirebaseFirestore } from '../config/firebase';
import { Property, PropertyProStatus } from '../types';
import { NotFoundError, ValidationError, DatabaseError } from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';

/**
 * Property Status Service
 * Handles admin approval/rejection workflow for properties
 */

class PropertyStatusService {
  /**
   * Approve a property and set it to the seller's intended status
   */
  async approveProperty(
    propertyId: string,
    adminId: string,
    approvedStatus: PropertyProStatus
  ): Promise<Property> {
    try {
      // Validate approved status
      const validApprovedStatuses: PropertyProStatus[] = [
        'For Sale',
        'For Rent',
        'Under Construction',
      ];

      if (!validApprovedStatuses.includes(approvedStatus)) {
        throw new ValidationError(
          'Invalid approved status. Must be For Sale, For Rent, or Under Construction'
        );
      }

      // Verify property exists
      const propertyRef = getFirebaseFirestore().collection('properties').doc(propertyId);
      const propertyDoc = await propertyRef.get();

      if (!propertyDoc.exists) {
        throw new NotFoundError('Property not found');
      }

      // Update property with approval data
      await propertyRef.update({
        pro_status: approvedStatus,
        approvedBy: adminId,
        approvedAt: new Date(),
        // Clear rejection fields if previously rejected
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null,
      });

      // Fetch updated property
      const updatedDoc = await propertyRef.get();
      const property = {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as Property;

      logWithContext('info', 'Property approved', {
        propertyId,
        adminId,
        approvedStatus,
      });

      return property;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      logWithContext('error', 'Error approving property', {
        error,
        propertyId,
        adminId,
      });
      throw new DatabaseError('Failed to approve property');
    }
  }

  /**
   * Reject a property with a reason
   */
  async rejectProperty(
    propertyId: string,
    adminId: string,
    reason: string
  ): Promise<Property> {
    try {
      // Validate reason
      if (!reason || reason.trim().length === 0) {
        throw new ValidationError('Rejection reason is required');
      }

      if (reason.length > 500) {
        throw new ValidationError('Rejection reason must be 500 characters or less');
      }

      // Verify property exists
      const propertyRef = getFirebaseFirestore().collection('properties').doc(propertyId);
      const propertyDoc = await propertyRef.get();

      if (!propertyDoc.exists) {
        throw new NotFoundError('Property not found');
      }

      // Update property with rejection data
      await propertyRef.update({
        pro_status: 'Rejected',
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason,
        // Clear approval fields if previously approved
        approvedBy: null,
        approvedAt: null,
      });

      // Fetch updated property
      const updatedDoc = await propertyRef.get();
      const property = {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as Property;

      logWithContext('info', 'Property rejected', {
        propertyId,
        adminId,
        reason,
      });

      return property;
    } catch (error) {
      if (
        error instanceof NotFoundError ||
        error instanceof ValidationError
      ) {
        throw error;
      }
      logWithContext('error', 'Error rejecting property', {
        error,
        propertyId,
        adminId,
      });
      throw new DatabaseError('Failed to reject property');
    }
  }

  /**
   * Get all pending properties (waiting for admin approval)
   */
  async getPendingProperties(page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;

      const snapshot = await getFirebaseFirestore()
        .collection('properties')
        .where('pro_status', '==', 'Waiting for Admin Approval')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      const countSnapshot = await getFirebaseFirestore()
        .collection('properties')
        .where('pro_status', '==', 'Waiting for Admin Approval')
        .count()
        .get();

      const total = countSnapshot.data().count;
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Property[];

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logWithContext('error', 'Error fetching pending properties', { error, page, limit });
      throw new DatabaseError('Failed to fetch pending properties');
    }
  }

  /**
   * Get count of pending properties
   */
  async getPendingCount(): Promise<number> {
    try {
      const snapshot = await getFirebaseFirestore()
        .collection('properties')
        .where('pro_status', '==', 'Waiting for Admin Approval')
        .count()
        .get();

      return snapshot.data().count;
    } catch (error) {
      logWithContext('error', 'Error getting pending count', { error });
      return 0;
    }
  }
}

export default new PropertyStatusService();
