import fc from 'fast-check';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  region: string;
  address: string;
  propertyType: 'house' | 'apartment' | 'condo' | 'land' | 'commercial';
  status: 'available' | 'under_offer' | 'sold';
  sellerId: string;
  imageUrls: string[];
  thumbnailUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Arbitrary generators for property-based testing
export const propertyArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 200 }),
  description: fc.string({ minLength: 20, maxLength: 2000 }),
  price: fc.integer({ min: 10000, max: 10000000 }),
  region: fc.constantFrom('north', 'south', 'east', 'west', 'central'),
  address: fc.string({ minLength: 10, maxLength: 500 }),
  propertyType: fc.constantFrom(
    'house' as const,
    'apartment' as const,
    'condo' as const,
    'land' as const,
    'commercial' as const
  ),
  status: fc.constantFrom('available' as const, 'under_offer' as const, 'sold' as const),
  sellerId: fc.uuid(),
  imageUrls: fc.array(fc.webUrl(), { minLength: 0, maxLength: 10 }),
  thumbnailUrls: fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 10 }), { nil: undefined }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
});

export const createPropertyDataArbitrary = fc.record({
  title: fc.string({ minLength: 5, maxLength: 200 }),
  description: fc.string({ minLength: 20, maxLength: 2000 }),
  price: fc.integer({ min: 10000, max: 10000000 }),
  region: fc.constantFrom('north', 'south', 'east', 'west', 'central'),
  address: fc.string({ minLength: 10, maxLength: 500 }),
  propertyType: fc.constantFrom('house', 'apartment', 'condo', 'land', 'commercial'),
  status: fc.constantFrom('available', 'under_offer', 'sold'),
});

// Factory functions for unit tests
export class PropertyFactory {
  static create(overrides?: Partial<Property>): Property {
    return {
      id: crypto.randomUUID(),
      title: 'Beautiful Property',
      description: 'A wonderful property in a great location with amazing features.',
      price: 500000,
      region: 'north',
      address: '123 Main Street, City',
      propertyType: 'house',
      status: 'available',
      sellerId: crypto.randomUUID(),
      imageUrls: ['https://example.com/image1.jpg'],
      thumbnailUrls: ['https://example.com/image1_thumb.jpg'],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createAvailable(overrides?: Partial<Property>): Property {
    return this.create({ status: 'available', ...overrides });
  }

  static createSold(overrides?: Partial<Property>): Property {
    return this.create({ status: 'sold', ...overrides });
  }

  static createMany(count: number, overrides?: Partial<Property>): Property[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
