import feedbackService from '../../services/feedbackService';
import { ValidationError, ConflictError } from '../../middleware/errorHandler';

const mockCreate = jest.fn();
const mockFindByListing = jest.fn();
const mockCheckExisting = jest.fn();
const mockGetAverageRating = jest.fn();

jest.mock('../../repositories/feedbackRepository', () => ({
  __esModule: true,
  default: {
    create: (...a: any[]) => mockCreate(...a),
    findByListing: (...a: any[]) => mockFindByListing(...a),
    checkExisting: (...a: any[]) => mockCheckExisting(...a),
    getAverageRating: (...a: any[]) => mockGetAverageRating(...a),
  },
}));

function makeFeedback(overrides = {}) {
  return {
    id: 'fb-1',
    listingId: 'listing-1',
    buyerId: 'buyer-1',
    rating: 4,
    comment: 'Great property with nice views',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('FeedbackService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('submitFeedback', () => {
    const validData = { listingId: 'listing-1', rating: 4, comment: 'Great property with nice views' };

    it('creates feedback successfully', async () => {
      mockCheckExisting.mockResolvedValue(false);
      mockCreate.mockResolvedValue(makeFeedback());

      const result = await feedbackService.submitFeedback(validData, 'buyer-1');

      expect(result.id).toBe('fb-1');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ buyerId: 'buyer-1', rating: 4 })
      );
    });

    it('throws ValidationError for rating below 1', async () => {
      await expect(
        feedbackService.submitFeedback({ ...validData, rating: 0 }, 'buyer-1')
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for rating above 5', async () => {
      await expect(
        feedbackService.submitFeedback({ ...validData, rating: 6 }, 'buyer-1')
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for non-integer rating', async () => {
      await expect(
        feedbackService.submitFeedback({ ...validData, rating: 3.5 }, 'buyer-1')
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for comment too short', async () => {
      await expect(
        feedbackService.submitFeedback({ ...validData, comment: 'Short' }, 'buyer-1')
      ).rejects.toThrow(ValidationError);
    });

    it('throws ValidationError for comment too long', async () => {
      await expect(
        feedbackService.submitFeedback({ ...validData, comment: 'x'.repeat(501) }, 'buyer-1')
      ).rejects.toThrow(ValidationError);
    });

    it('throws ConflictError for duplicate feedback', async () => {
      mockCheckExisting.mockResolvedValue(true);

      await expect(
        feedbackService.submitFeedback(validData, 'buyer-1')
      ).rejects.toThrow(ConflictError);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('accepts boundary rating values 1 and 5', async () => {
      mockCheckExisting.mockResolvedValue(false);
      mockCreate.mockResolvedValue(makeFeedback({ rating: 1 }));

      await expect(
        feedbackService.submitFeedback({ ...validData, rating: 1 }, 'buyer-1')
      ).resolves.not.toThrow();

      mockCreate.mockResolvedValue(makeFeedback({ rating: 5 }));
      await expect(
        feedbackService.submitFeedback({ ...validData, rating: 5 }, 'buyer-1')
      ).resolves.not.toThrow();
    });
  });

  describe('getFeedbackByListing', () => {
    it('returns feedback list', async () => {
      mockFindByListing.mockResolvedValue([makeFeedback(), makeFeedback({ id: 'fb-2' })]);

      const result = await feedbackService.getFeedbackByListing('listing-1');

      expect(result).toHaveLength(2);
      expect(mockFindByListing).toHaveBeenCalledWith('listing-1');
    });

    it('returns empty array when no feedback', async () => {
      mockFindByListing.mockResolvedValue([]);

      const result = await feedbackService.getFeedbackByListing('listing-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getAverageRating', () => {
    it('returns average and count', async () => {
      mockGetAverageRating.mockResolvedValue({ average: 4.2, count: 5 });

      const result = await feedbackService.getAverageRating('listing-1');

      expect(result.average).toBe(4.2);
      expect(result.count).toBe(5);
    });

    it('returns zero average when no feedback', async () => {
      mockGetAverageRating.mockResolvedValue({ average: 0, count: 0 });

      const result = await feedbackService.getAverageRating('listing-1');

      expect(result.average).toBe(0);
      expect(result.count).toBe(0);
    });
  });
});
