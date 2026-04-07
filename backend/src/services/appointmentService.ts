import appointmentRepository, {
  CreateAppointmentData,
} from '../repositories/appointmentRepository';
import { Appointment, AppointmentStatus, PaginatedResponse } from '../types';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
  DatabaseError,
} from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';
import { getFirebaseFirestore } from '../config/firebase';
import { COLLECTIONS } from '../constants';

/**
 * Valid status transitions per actor
 *
 * Seller can: confirm or decline a pending appointment
 * Buyer  can: cancel a pending or confirmed appointment
 */
const SELLER_TRANSITIONS: Record<string, AppointmentStatus[]> = {
  pending: ['confirmed', 'declined'],
};

const BUYER_TRANSITIONS: Record<string, AppointmentStatus[]> = {
  pending: ['cancelled'],
  confirmed: ['cancelled'],
};

class AppointmentService {
  /**
   * Create a new appointment (buyer only)
   * Requirements: 9.1, 9.2, 9.3, 9.5, 10.1
   */
  async createAppointment(
    data: Omit<CreateAppointmentData, 'buyerId'>,
    buyerId: string
  ): Promise<{ appointment: Appointment; sellerContact: { name: string; email: string; phone: string } }> {
    // Validate date is in the future
    if (data.requestedDateTime <= new Date()) {
      throw new ValidationError('Requested date/time must be in the future');
    }

    // Validate terms acceptance (Requirement 9.3)
    if (!data.terms_accepted || !data.privacy_policy_accepted) {
      throw new ValidationError('You must accept the terms and conditions and privacy policy');
    }

    // Prevent duplicate active appointments
    const isDuplicate = await appointmentRepository.checkDuplicate(
      buyerId,
      data.listingId
    );
    if (isDuplicate) {
      throw new ConflictError(
        'You already have a pending or confirmed appointment for this property',
        'DUPLICATE_APPOINTMENT'
      );
    }

    // Create appointment with contact_revealed set to true (Requirement 9.5)
    const appointment = await appointmentRepository.create({
      ...data,
      buyerId,
    });

    // Fetch seller contact information (Requirement 9.5)
    const sellerContact = await this.getSellerContact(data.sellerId);

    logWithContext('info', 'Appointment created', {
      appointmentId: appointment.id,
      buyerId,
      listingId: data.listingId,
    });

    return { appointment, sellerContact };
  }

  /**
   * Get seller contact information
   * Private helper method
   */
  private async getSellerContact(sellerId: string): Promise<{ name: string; email: string; phone: string }> {
    try {
      const db = getFirebaseFirestore();
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(sellerId).get();

      if (!userDoc.exists) {
        throw new NotFoundError('Seller not found');
      }

      const userData = userDoc.data();
      if (!userData) {
        throw new NotFoundError('Seller data not found');
      }

      return {
        name: userData.fullName || 'Unknown',
        email: userData.email || '',
        phone: userData.buyer_phone || userData.phone || '',
      };
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logWithContext('error', 'Failed to fetch seller contact', { 
        sellerId, 
        error: error.message 
      });
      throw new DatabaseError('Failed to retrieve seller contact information');
    }
  }

  /**
   * Update appointment status
   * Sellers can confirm/decline; buyers can cancel; admins can do anything
   */
  async updateAppointmentStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
    userId: string,
    userRole: 'buyer' | 'seller' | 'admin'
  ): Promise<Appointment> {
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) throw new NotFoundError('Appointment not found');

    // Admin can update any appointment
    if (userRole !== 'admin') {
      // Verify the user is a party to this appointment
      if (userRole === 'seller' && appointment.sellerId !== userId) {
        throw new AuthorizationError(
          'You are not authorized to update this appointment'
        );
      }
      if (userRole === 'buyer' && appointment.buyerId !== userId) {
        throw new AuthorizationError(
          'You are not authorized to update this appointment'
        );
      }

      // Validate transition for non-admin users
      const allowedTransitions =
        userRole === 'seller'
          ? SELLER_TRANSITIONS[appointment.status] ?? []
          : BUYER_TRANSITIONS[appointment.status] ?? [];

      if (!allowedTransitions.includes(newStatus)) {
        throw new ValidationError(
          `Cannot transition appointment from '${appointment.status}' to '${newStatus}' as ${userRole}`
        );
      }
    }

    const updated = await appointmentRepository.update(appointmentId, {
      status: newStatus,
    });

    logWithContext('info', 'Appointment status updated', {
      appointmentId,
      userId,
      userRole,
      oldStatus: appointment.status,
      newStatus,
    });

    return updated;
  }

  /**
   * Get all appointments for a buyer
   */
  async getAppointmentsByBuyer(
    buyerId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Appointment>> {
    return appointmentRepository.findByBuyer(buyerId, page, limit);
  }

  /**
   * Get all appointments for a seller
   */
  async getAppointmentsBySeller(
    sellerId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Appointment>> {
    return appointmentRepository.findBySeller(sellerId, page, limit);
  }

  /**
   * Get appointment by ID (with authorization check)
   */
  async getAppointmentById(
    appointmentId: string,
    userId: string
  ): Promise<Appointment> {
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) throw new NotFoundError('Appointment not found');

    if (appointment.buyerId !== userId && appointment.sellerId !== userId) {
      throw new AuthorizationError(
        'You are not authorized to view this appointment'
      );
    }

    return appointment;
  }
}

export default new AppointmentService();
