import { getFirebaseFirestore } from '../config/firebase';
import { COLLECTIONS, PROPERTY_STATUS, APPOINTMENT_STATUS } from '../constants';
import { SellerDashboard, BuyerDashboard, Appointment, Property } from '../types';
import { DatabaseError } from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';

const RECENT_LIMIT = 5;

function toDate(val: any): Date {
  if (!val) return new Date(0);
  if (val.toDate) return val.toDate();
  return new Date(val);
}

function mapAppointment(doc: FirebaseFirestore.QueryDocumentSnapshot): Appointment {
  const d = doc.data();
  return {
    id: doc.id,
    ...d,
    requestedDateTime: toDate(d.requestedDateTime),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  } as Appointment;
}

function mapProperty(doc: FirebaseFirestore.QueryDocumentSnapshot): Property {
  const d = doc.data();
  return {
    id: doc.id,
    ...d,
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  } as Property;
}

export const dashboardService = {
  async getSellerDashboard(sellerId: string): Promise<SellerDashboard> {
    try {
      const db = getFirebaseFirestore();

      // Run all queries in parallel
      const [
        allListingsSnap,
        activeListingsSnap,
        pendingApptsSnap,
        confirmedApptsSnap,
        recentApptsSnap,
        recentListingsSnap,
      ] = await Promise.all([
        db.collection(COLLECTIONS.PROPERTIES).where('sellerId', '==', sellerId).get(),
        db
          .collection(COLLECTIONS.PROPERTIES)
          .where('sellerId', '==', sellerId)
          .where('status', '==', PROPERTY_STATUS.AVAILABLE)
          .get(),
        db
          .collection(COLLECTIONS.APPOINTMENTS)
          .where('sellerId', '==', sellerId)
          .where('status', '==', APPOINTMENT_STATUS.PENDING)
          .get(),
        db
          .collection(COLLECTIONS.APPOINTMENTS)
          .where('sellerId', '==', sellerId)
          .where('status', '==', APPOINTMENT_STATUS.CONFIRMED)
          .get(),
        db
          .collection(COLLECTIONS.APPOINTMENTS)
          .where('sellerId', '==', sellerId)
          .orderBy('createdAt', 'desc')
          .limit(RECENT_LIMIT)
          .get(),
        db
          .collection(COLLECTIONS.PROPERTIES)
          .where('sellerId', '==', sellerId)
          .orderBy('createdAt', 'desc')
          .limit(RECENT_LIMIT)
          .get(),
      ]);

      return {
        totalListings: allListingsSnap.size,
        activeListings: activeListingsSnap.size,
        pendingAppointments: pendingApptsSnap.size,
        confirmedAppointments: confirmedApptsSnap.size,
        recentAppointments: recentApptsSnap.docs.map(mapAppointment),
        recentListings: recentListingsSnap.docs.map(mapProperty),
      };
    } catch (error) {
      logWithContext('error', 'Error fetching seller dashboard', { error, sellerId });
      throw new DatabaseError('Failed to fetch seller dashboard');
    }
  },

  async getBuyerDashboard(buyerId: string): Promise<BuyerDashboard> {
    try {
      const db = getFirebaseFirestore();

      const [
        allApptsSnap,
        pendingApptsSnap,
        confirmedApptsSnap,
        recentApptsSnap,
        feedbackSnap,
      ] = await Promise.all([
        db.collection(COLLECTIONS.APPOINTMENTS).where('buyerId', '==', buyerId).get(),
        db
          .collection(COLLECTIONS.APPOINTMENTS)
          .where('buyerId', '==', buyerId)
          .where('status', '==', APPOINTMENT_STATUS.PENDING)
          .get(),
        db
          .collection(COLLECTIONS.APPOINTMENTS)
          .where('buyerId', '==', buyerId)
          .where('status', '==', APPOINTMENT_STATUS.CONFIRMED)
          .get(),
        db
          .collection(COLLECTIONS.APPOINTMENTS)
          .where('buyerId', '==', buyerId)
          .orderBy('createdAt', 'desc')
          .limit(RECENT_LIMIT)
          .get(),
        db.collection(COLLECTIONS.FEEDBACK).where('buyerId', '==', buyerId).get(),
      ]);

      return {
        totalAppointments: allApptsSnap.size,
        pendingAppointments: pendingApptsSnap.size,
        confirmedAppointments: confirmedApptsSnap.size,
        recentAppointments: recentApptsSnap.docs.map(mapAppointment),
        submittedFeedback: feedbackSnap.size,
      };
    } catch (error) {
      logWithContext('error', 'Error fetching buyer dashboard', { error, buyerId });
      throw new DatabaseError('Failed to fetch buyer dashboard');
    }
  },
};
