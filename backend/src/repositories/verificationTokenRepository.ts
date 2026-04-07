import { getFirebaseFirestore } from '../config/firebase';
import { VerificationToken, VerificationTokenType } from '../types';
import { DatabaseError, NotFoundError } from '../middleware/errorHandler';
import { logWithContext } from '../utils/logger';
import { COLLECTIONS } from '../constants';

export interface CreateVerificationTokenData {
  userId: string;
  token: string;
  type: VerificationTokenType;
  expiresAt: Date;
}

class VerificationTokenRepository {
  private collectionName = COLLECTIONS.VERIFICATION_TOKENS;

  /**
   * Create a new verification token
   */
  async create(data: CreateVerificationTokenData): Promise<VerificationToken> {
    try {
      const db = getFirebaseFirestore();
      const ref = db.collection(this.collectionName).doc();
      const now = new Date();

      const tokenData = {
        ...data,
        used: false,
        createdAt: now,
      };

      await ref.set(tokenData);

      logWithContext('info', 'Verification token created', { 
        tokenId: ref.id, 
        userId: data.userId,
        type: data.type 
      });

      return { id: ref.id, ...tokenData };
    } catch (error) {
      logWithContext('error', 'Error creating verification token', { error });
      throw new DatabaseError('Failed to create verification token');
    }
  }

  /**
   * Find a verification token by token string
   */
  async findByToken(token: string): Promise<VerificationToken | null> {
    try {
      const db = getFirebaseFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('token', '==', token)
        .limit(1)
        .get();

      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        expiresAt: data.expiresAt?.toDate(),
        usedAt: data.usedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
      } as VerificationToken;
    } catch (error) {
      logWithContext('error', 'Error finding verification token', { error });
      throw new DatabaseError('Failed to retrieve verification token');
    }
  }

  /**
   * Mark a verification token as used
   */
  async markAsUsed(tokenId: string): Promise<VerificationToken> {
    try {
      const db = getFirebaseFirestore();
      const ref = db.collection(this.collectionName).doc(tokenId);

      const doc = await ref.get();
      if (!doc.exists) {
        throw new NotFoundError('Verification token not found');
      }

      const now = new Date();
      const updateData = {
        used: true,
        usedAt: now,
      };

      await ref.update(updateData);

      const updated = await ref.get();
      const updatedData = updated.data()!;

      logWithContext('info', 'Verification token marked as used', { tokenId });

      return {
        id: updated.id,
        ...updatedData,
        expiresAt: updatedData.expiresAt?.toDate(),
        usedAt: updatedData.usedAt?.toDate(),
        createdAt: updatedData.createdAt?.toDate(),
      } as VerificationToken;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logWithContext('error', 'Error marking token as used', { error, tokenId });
      throw new DatabaseError('Failed to mark token as used');
    }
  }

  /**
   * Delete expired verification tokens
   * Returns the count of deleted tokens
   */
  async deleteExpired(): Promise<number> {
    try {
      const db = getFirebaseFirestore();
      const now = new Date();

      const snapshot = await db
        .collection(this.collectionName)
        .where('expiresAt', '<', now)
        .where('used', '==', false)
        .get();

      if (snapshot.empty) {
        logWithContext('info', 'No expired tokens to delete');
        return 0;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      const deletedCount = snapshot.size;
      logWithContext('info', 'Expired tokens deleted', { count: deletedCount });

      return deletedCount;
    } catch (error) {
      logWithContext('error', 'Error deleting expired tokens', { error });
      throw new DatabaseError('Failed to delete expired tokens');
    }
  }

  /**
   * Find all tokens for a specific user (useful for debugging/admin)
   */
  async findByUserId(userId: string): Promise<VerificationToken[]> {
    try {
      const db = getFirebaseFirestore();
      const snapshot = await db
        .collection(this.collectionName)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          expiresAt: data.expiresAt?.toDate(),
          usedAt: data.usedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
        } as VerificationToken;
      });
    } catch (error) {
      logWithContext('error', 'Error finding tokens by user', { error, userId });
      throw new DatabaseError('Failed to retrieve user tokens');
    }
  }

  /**
   * Delete a specific token by ID
   */
  async deleteById(tokenId: string): Promise<void> {
    try {
      const db = getFirebaseFirestore();
      const ref = db.collection(this.collectionName).doc(tokenId);

      const doc = await ref.get();
      if (!doc.exists) {
        throw new NotFoundError('Verification token not found');
      }

      await ref.delete();

      logWithContext('info', 'Verification token deleted', { tokenId });
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      logWithContext('error', 'Error deleting token', { error, tokenId });
      throw new DatabaseError('Failed to delete token');
    }
  }
}

export default new VerificationTokenRepository();
