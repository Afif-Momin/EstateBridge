import { getFirebaseFirestore } from '../config/firebase';
import { logWithContext } from '../utils/logger';
import { DatabaseError } from '../middleware/errorHandler';

/**
 * Spam Detection Service
 * Detects duplicate content and suspicious patterns in property listings
 */

class SpamDetectionService {
  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  /**
   * Check for duplicate content by comparing description with existing properties
   */
  async checkDuplicateContent(
    description: string,
    excludePropertyId?: string
  ): Promise<{
    isDuplicate: boolean;
    similarPropertyId?: string;
    similarity: number;
  }> {
    try {
      const normalizedDescription = this.normalizeText(description);
      const threshold = 0.9; // 90% similarity threshold

      // Fetch recent properties (last 1000) for comparison
      let query = getFirebaseFirestore().collection('properties')
        .orderBy('createdAt', 'desc')
        .limit(1000);

      const snapshot = await query.get();

      let maxSimilarity = 0;
      let similarPropertyId: string | undefined;

      for (const doc of snapshot.docs) {
        // Skip the property being checked
        if (doc.id === excludePropertyId) {
          continue;
        }

        const propertyData = doc.data();
        const existingDescription = propertyData.description || '';
        const normalizedExisting = this.normalizeText(existingDescription);

        const similarity = this.calculateSimilarity(
          normalizedDescription,
          normalizedExisting
        );

        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          similarPropertyId = doc.id;
        }

        // Early exit if we found a very similar match
        if (similarity >= threshold) {
          break;
        }
      }

      return {
        isDuplicate: maxSimilarity >= threshold,
        similarPropertyId: maxSimilarity >= threshold ? similarPropertyId : undefined,
        similarity: maxSimilarity,
      };
    } catch (error) {
      logWithContext('error', 'Error checking duplicate content', { error, description });
      // Don't throw - return safe default
      return {
        isDuplicate: false,
        similarity: 0,
      };
    }
  }

  /**
   * Simple image hash for duplicate detection
   * Note: This is a simplified version. Production should use perceptual hashing libraries
   */
  private simpleImageHash(url: string): string {
    // Extract filename/path as a simple hash
    // In production, use actual image hashing (pHash, dHash, etc.)
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('?')[0]; // Remove query params
  }

  /**
   * Check for duplicate images
   */
  async checkDuplicateImages(
    imageUrls: string[],
    excludePropertyId?: string
  ): Promise<{
    hasDuplicates: boolean;
    matchingPropertyIds: string[];
  }> {
    try {
      if (!imageUrls || imageUrls.length === 0) {
        return {
          hasDuplicates: false,
          matchingPropertyIds: [],
        };
      }

      // Create hashes for input images
      const inputHashes = imageUrls.map(url => this.simpleImageHash(url));

      // Fetch recent properties for comparison
      let query = getFirebaseFirestore().collection('properties')
        .orderBy('createdAt', 'desc')
        .limit(500);

      const snapshot = await query.get();
      const matchingPropertyIds: Set<string> = new Set();

      for (const doc of snapshot.docs) {
        if (doc.id === excludePropertyId) {
          continue;
        }

        const propertyData = doc.data();
        const existingImages = propertyData.imageUrls || [];

        // Check if any images match
        for (const existingUrl of existingImages) {
          const existingHash = this.simpleImageHash(existingUrl);
          if (inputHashes.includes(existingHash)) {
            matchingPropertyIds.add(doc.id);
            break;
          }
        }
      }

      return {
        hasDuplicates: matchingPropertyIds.size > 0,
        matchingPropertyIds: Array.from(matchingPropertyIds),
      };
    } catch (error) {
      logWithContext('error', 'Error checking duplicate images', { error, imageUrls });
      // Don't throw - return safe default
      return {
        hasDuplicates: false,
        matchingPropertyIds: [],
      };
    }
  }

  /**
   * Flag a property as suspicious
   */
  async flagProperty(propertyId: string, reason: string): Promise<void> {
    try {
      await getFirebaseFirestore().collection('properties').doc(propertyId).update({
        flagged: true,
        flaggedReason: reason,
        flaggedAt: new Date(),
      });

      logWithContext('info', 'Property flagged', { propertyId, reason });
    } catch (error) {
      logWithContext('error', 'Error flagging property', { error, propertyId, reason });
      throw new DatabaseError('Failed to flag property');
    }
  }

  /**
   * Check if property should be auto-flagged based on report threshold
   */
  async checkReportThreshold(propertyId: string): Promise<{
    shouldFlag: boolean;
    reportCount: number;
  }> {
    try {
      const threshold = 3; // Auto-flag at 3 reports

      // Count reports for this property
      const reportsSnapshot = await getFirebaseFirestore()
        .collection('property_reports')
        .where('propertyId', '==', propertyId)
        .count()
        .get();

      const reportCount = reportsSnapshot.data().count;
      const shouldFlag = reportCount >= threshold;

      if (shouldFlag) {
        // Check if already flagged
        const propertyDoc = await getFirebaseFirestore().collection('properties').doc(propertyId).get();
        const propertyData = propertyDoc.data();

        if (!propertyData?.flagged) {
          await this.flagProperty(
            propertyId,
            `Auto-flagged: ${reportCount} user reports received`
          );
        }
      }

      return {
        shouldFlag,
        reportCount,
      };
    } catch (error) {
      logWithContext('error', 'Error checking report threshold', { error, propertyId });
      return {
        shouldFlag: false,
        reportCount: 0,
      };
    }
  }

  /**
   * Clear flag from a property (admin action)
   */
  async clearFlag(propertyId: string): Promise<void> {
    try {
      await getFirebaseFirestore().collection('properties').doc(propertyId).update({
        flagged: false,
        flaggedReason: null,
        flaggedAt: null,
      });

      logWithContext('info', 'Property flag cleared', { propertyId });
    } catch (error) {
      logWithContext('error', 'Error clearing property flag', { error, propertyId });
      throw new DatabaseError('Failed to clear property flag');
    }
  }
}

export default new SpamDetectionService();
