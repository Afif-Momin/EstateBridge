import fc from 'fast-check';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'buyer' | 'seller';
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Arbitrary generators for property-based testing
export const userArbitrary = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  fullName: fc.string({ minLength: 2, maxLength: 100 }),
  role: fc.constantFrom('buyer' as const, 'seller' as const),
  profileImage: fc.option(fc.webUrl(), { nil: undefined }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

export const registrationDataArbitrary = fc.record({
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 50 }),
  fullName: fc.string({ minLength: 2, maxLength: 100 }),
  role: fc.constantFrom('buyer' as const, 'seller' as const),
});

// Factory functions for unit tests
export class UserFactory {
  static create(overrides?: Partial<User>): User {
    return {
      id: crypto.randomUUID(),
      email: `user${Date.now()}@example.com`,
      fullName: 'Test User',
      role: 'buyer',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createSeller(overrides?: Partial<User>): User {
    return this.create({ role: 'seller', ...overrides });
  }

  static createBuyer(overrides?: Partial<User>): User {
    return this.create({ role: 'buyer', ...overrides });
  }

  static createMany(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
