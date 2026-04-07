import fc from 'fast-check';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'buyer' | 'seller';
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  buy_country?: string;
  buy_city?: string;
  buy_state?: string;
  buy_address?: string;
  buy_pincode?: string;
  currency?: 'USD' | 'INR';
  emailVerified?: boolean;
}

export interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  role: 'buyer' | 'seller';
  buy_country: string;
  buy_city: string;
  buy_state: string;
  buy_address: string;
  buy_pincode: string;
  captchaToken: string;
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

export const registerDTOArbitrary = fc.record({
  email: fc.emailAddress(),
  password: fc.string({ minLength: 8, maxLength: 50 }).map((s) => s + 'A1'), // Ensure password meets requirements
  fullName: fc.string({ minLength: 2, maxLength: 100 }),
  role: fc.constantFrom('buyer' as const, 'seller' as const),
  buy_country: fc.constantFrom('US', 'IN', 'GB', 'CA'),
  buy_city: fc.string({ minLength: 2, maxLength: 50 }),
  buy_state: fc.string({ minLength: 2, maxLength: 50 }),
  buy_address: fc.string({ minLength: 5, maxLength: 200 }),
  buy_pincode: fc.string({ minLength: 5, maxLength: 10 }),
  captchaToken: fc.string({ minLength: 10, maxLength: 100 }),
});

// Factory functions for unit tests
export class UserFactory {
  static create(overrides?: Partial<User>): User {
    const timestamp = new Date();
    return {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      email: `user-${Date.now()}@example.com`,
      fullName: 'Test User',
      role: 'buyer',
      createdAt: timestamp,
      updatedAt: timestamp,
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

  static createRegisterDTO(overrides?: Partial<RegisterDTO>): RegisterDTO {
    return {
      email: `user-${Date.now()}@example.com`,
      password: 'Test1234',
      fullName: 'Test User',
      role: 'buyer',
      buy_country: 'US',
      buy_city: 'New York',
      buy_state: 'NY',
      buy_address: '123 Main St',
      buy_pincode: '10001',
      captchaToken: 'test-captcha-token',
      ...overrides,
    };
  }
}
