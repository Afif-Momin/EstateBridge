import fc from 'fast-check';

export interface Feedback {
  id: string;
  listingId: string;
  buyerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface CreateFeedbackDTO {
  listingId: string;
  rating: number;
  comment: string;
}

// Arbitrary generators for property-based testing
export const feedbackArbitrary = fc.record({
  id: fc.uuid(),
  listingId: fc.uuid(),
  buyerId: fc.uuid(),
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.string({ minLength: 10, maxLength: 500 }),
  createdAt: fc.date(),
});

export const createFeedbackDTOArbitrary = fc.record({
  listingId: fc.uuid(),
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.string({ minLength: 10, maxLength: 500 }),
});

// Factory functions for unit tests
export class FeedbackFactory {
  static create(overrides?: Partial<Feedback>): Feedback {
    return {
      id: `feedback-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      listingId: `listing-${Date.now()}`,
      buyerId: `buyer-${Date.now()}`,
      rating: 4,
      comment: 'Great property! Very satisfied with the viewing experience and the seller was professional.',
      createdAt: new Date(),
      ...overrides,
    };
  }

  static createMany(count: number, overrides?: Partial<Feedback>): Feedback[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createWithRating(rating: number, overrides?: Partial<Feedback>): Feedback {
    return this.create({ rating, ...overrides });
  }

  static createDTO(overrides?: Partial<CreateFeedbackDTO>): CreateFeedbackDTO {
    return {
      listingId: `listing-${Date.now()}`,
      rating: 4,
      comment: 'Great property! Very satisfied with the viewing experience and the seller was professional.',
      ...overrides,
    };
  }
}
