import { getFirebaseFirestore } from '../config/firebase';
import { PropertyReport, ReportReason } from '../types';
import { DatabaseError } from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';

/**
 * Property Report Repository
 * Handles database operations for property reports
 */

export interface CreateReportData {
  propertyId: string;
  reporterId: string;
  reason: ReportReason;
  additionalDetails?: string;
}

export interface UpdateReportData {
  status?: 'pending' | 'reviewed' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: Date;
}

class ReportRepository {
  private get collection() {
    return getFirebaseFirestore().collection('property_reports');
  }

  /**
   * Create a new property report
   */
  async create(data: CreateReportData): Promise<PropertyReport> {
    try {
      const reportData = {
        ...data,
        status: 'pending' as const,
        createdAt: new Date(),
      };

      const docRef = await this.collection.add(reportData);
      const doc = await docRef.get();

      return {
        id: doc.id,
        ...doc.data(),
      } as PropertyReport;
    } catch (error) {
      logWithContext('error', 'Error creating property report', { error, data });
      throw new DatabaseError('Failed to create property report');
    }
  }

  /**
   * Find reports by property ID
   */
  async findByProperty(propertyId: string): Promise<PropertyReport[]> {
    try {
      const snapshot = await this.collection
        .where('propertyId', '==', propertyId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PropertyReport[];
    } catch (error) {
      logWithContext('error', 'Error finding reports by property', { error, propertyId });
      throw new DatabaseError('Failed to fetch property reports');
    }
  }

  /**
   * Find reports by reporter ID
   */
  async findByReporter(reporterId: string): Promise<PropertyReport[]> {
    try {
      const snapshot = await this.collection
        .where('reporterId', '==', reporterId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PropertyReport[];
    } catch (error) {
      logWithContext('error', 'Error finding reports by reporter', { error, reporterId });
      throw new DatabaseError('Failed to fetch reporter reports');
    }
  }

  /**
   * Find a specific report by property and reporter
   */
  async findByPropertyAndReporter(
    propertyId: string,
    reporterId: string
  ): Promise<PropertyReport | null> {
    try {
      const snapshot = await this.collection
        .where('propertyId', '==', propertyId)
        .where('reporterId', '==', reporterId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as PropertyReport;
    } catch (error) {
      logWithContext('error', 'Error finding report by property and reporter', {
        error,
        propertyId,
        reporterId,
      });
      throw new DatabaseError('Failed to check existing report');
    }
  }

  /**
   * Update report status
   */
  async updateStatus(reportId: string, data: UpdateReportData): Promise<PropertyReport> {
    try {
      const docRef = this.collection.doc(reportId);
      await docRef.update(data as any);

      const doc = await docRef.get();
      return {
        id: doc.id,
        ...doc.data(),
      } as PropertyReport;
    } catch (error) {
      logWithContext('error', 'Error updating report status', { error, reportId, data });
      throw new DatabaseError('Failed to update report status');
    }
  }

  /**
   * Get all pending reports (admin)
   */
  async findPending(page: number = 1, limit: number = 20) {
    try {
      const offset = (page - 1) * limit;

      const snapshot = await this.collection
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      const countSnapshot = await this.collection
        .where('status', '==', 'pending')
        .count()
        .get();

      const total = countSnapshot.data().count;
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PropertyReport[];

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
      logWithContext('error', 'Error fetching pending reports', { error, page, limit });
      throw new DatabaseError('Failed to fetch pending reports');
    }
  }

  /**
   * Count reports for a property
   */
  async countByProperty(propertyId: string): Promise<number> {
    try {
      const snapshot = await this.collection
        .where('propertyId', '==', propertyId)
        .count()
        .get();

      return snapshot.data().count;
    } catch (error) {
      logWithContext('error', 'Error counting reports for property', { error, propertyId });
      throw new DatabaseError('Failed to count property reports');
    }
  }
}

export default new ReportRepository();
