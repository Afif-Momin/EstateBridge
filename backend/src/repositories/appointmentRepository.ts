import { getFirebaseFirestore } from '../config/firebase';
import { Appointment, AppointmentStatus, PaginatedResponse } from '../types';
import { DatabaseError, NotFoundError } from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';
import { COLLECTIONS } from '../constants';

export interface CreateAppointmentData {
  listingId: string;
  buyerId: string;
  sellerId: string;
  requestedDateTime: Date;
  reason_to_buy: 'Investment' | 'Self Use';
  is_property_dealer: boolean;
  buyer_name: string;
  buyer_phone: string;
  purchase_timeline?: '3 months' | '6 months' | 'More than 6 months';
  home_loan_interest?: boolean;
  site_visit_interest?: boolean;
  terms_accepted: boolean;
  privacy_policy_accepted: boolean;
}

export interface UpdateAppointmentData {
  status: AppointmentStatus;
}

class AppointmentRepository {
  private collectionName = COLLECTIONS.APPOINTMENTS;

  /**
   * Create a new appointment
   */
  async create(data: CreateAppointmentData): Promise<Appointment> {
    try {
      const db = getFirebaseFirestore();
      const ref = db.collection(this.collectionName).doc();
      const now = new Date();

      const appointmentData = {
        ...data,
        status: 'pending' as AppointmentStatus,
        contact_revealed: true,           // Requirement 9.5
        contact_revealed_at: now,         // Requirement 9.5
        createdAt: now,
        updatedAt: now,
      };

      await ref.set(appointmentData);

      logWithContext('info', 'Appointment created', { appointmentId: ref.id });

      return { id: ref.id, ...appointmentData };
    } catch (error) {
      logWithContext('error', 'Error creating appointment', { error });
      throw new DatabaseError('Failed to create appointment');
    }
  }

  /**
   * Find appointment by ID
   */
  async findById(id: string): Promise<Appointment | null> {
    try {
      const db = getFirebaseFirestore();
      const doc = await db.collection(this.collectionName).doc(id).get();

      if (!doc.exists) return null;

      const data = doc.data()!;
      return {
        id: doc.id,
        ...data,
        requestedDateTime: data.requestedDateTime?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Appointment;
    } catch (error) {
      logWithContext('error', 'Error finding appointment', { error, id });
      throw new DatabaseError('Failed to retrieve appointment');
    }
  }

  /**
   * Find all appointments for a buyer
   */
  async findByBuyer(
    buyerId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Appointment>> {
    return this._paginatedQuery('buyerId', buyerId, page, limit);
  }

  /**
   * Find all appointments for a seller
   */
  async findBySeller(
    sellerId: string,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Appointment>> {
    return this._paginatedQuery('sellerId', sellerId, page, limit);
  }

  /**
   * Update appointment status
   */
  async update(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    try {
      const db = getFirebaseFirestore();
      const ref = db.collection(this.collectionName).doc(id);

      const doc = await ref.get();
      if (!doc.exists) throw new NotFoundError('Appointment not found');

      const updateData = { ...data, updatedAt: new Date() };
      await ref.update(updateData);

      const updated = await ref.get();
      const updatedData = updated.data()!;

      return {
        id: updated.id,
        ...updatedData,
        requestedDateTime: updatedData.requestedDateTime?.toDate(),
        createdAt: updatedData.createdAt?.toDate(),
        updatedAt: updatedData.updatedAt?.toDate(),
      } as Appointment;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logWithContext('error', 'Error updating appointment', { error, id });
      throw new DatabaseError('Failed to update appointment');
    }
  }

  /**
   * Check if a duplicate appointment exists (same buyer + listing + pending/confirmed)
   */
  async checkDuplicate(buyerId: string, listingId: string): Promise<boolean> {
    try {
      const db = getFirebaseFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('buyerId', '==', buyerId)
        .where('listingId', '==', listingId)
        .where('status', 'in', ['pending', 'confirmed'])
        .get();

      return !snapshot.empty;
    } catch (error) {
      logWithContext('error', 'Error checking duplicate appointment', { error });
      throw new DatabaseError('Failed to check duplicate appointment');
    }
  }

  /**
   * Shared paginated query helper
   */
  private async _paginatedQuery(
    field: string,
    value: string,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<Appointment>> {
    try {
      const db = getFirebaseFirestore();

      const countSnap = await db
        .collection(this.collectionName)
        .where(field, '==', value)
        .get();
      const total = countSnap.size;

      const offset = (page - 1) * limit;
      const snapshot = await db
        .collection(this.collectionName)
        .where(field, '==', value)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      const appointments: Appointment[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          requestedDateTime: data.requestedDateTime?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Appointment;
      });

      const totalPages = Math.ceil(total / limit);
      return {
        data: appointments,
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
      logWithContext('error', 'Error querying appointments', { error, field, value });
      throw new DatabaseError('Failed to retrieve appointments');
    }
  }
}

export default new AppointmentRepository();
