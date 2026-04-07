import fc from 'fast-check';

export interface Feedback {
  id: string;
  listingId: string;
  buyerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
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

export const createFeedbackDataArbitrary = fc.record({
  listingId: fc.uuid(),
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.string({ minLength: 10, maxLength: 500 }),
});

// Factory functions for unit tests
export class FeedbackFactory {
  static create(overrides?: Partial<Feedback>): Feedback {
    return {
      id: crypto.randomUUID(),
      listingId: crypto.randomUUID(),
      buyerId: crypto.randomUUID(),
      rating: 4,
      comment: 'Great property! Very satisfied with the viewing experience.',
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
}
