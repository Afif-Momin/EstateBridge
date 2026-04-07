import fc from 'fast-check';

export interface Appointment {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  requestedDateTime: Date;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  
  // Qualification fields
  reason_to_buy: 'Investment' | 'Self Use';
  is_property_dealer: boolean;
  buyer_name: string;
  buyer_phone: string;
  
  // Optional qualification fields
  purchase_timeline?: '3 months' | '6 months' | 'More than 6 months';
  home_loan_interest?: boolean;
  site_visit_interest?: boolean;
  
  // Terms acceptance
  terms_accepted: boolean;
  privacy_policy_accepted: boolean;
  
  // Contact revealed tracking
  contact_revealed: boolean;
  contact_revealed_at?: Date;
}

// Arbitrary generators for property-based testing
export const appointmentArbitrary = fc.record({
  id: fc.uuid(),
  listingId: fc.uuid(),
  buyerId: fc.uuid(),
  sellerId: fc.uuid(),
  requestedDateTime: fc.date({ min: new Date() }),
  status: fc.constantFrom(
    'pending' as const,
    'confirmed' as const,
    'declined' as const,
    'cancelled' as const
  ),
  createdAt: fc.date(),
  updatedAt: fc.date(),
  reason_to_buy: fc.constantFrom('Investment' as const, 'Self Use' as const),
  is_property_dealer: fc.boolean(),
  buyer_name: fc.string({ minLength: 2, maxLength: 100 }),
  buyer_phone: fc.string({ minLength: 10, maxLength: 15 }),
  purchase_timeline: fc.option(fc.constantFrom('3 months' as const, '6 months' as const, 'More than 6 months' as const)),
  home_loan_interest: fc.option(fc.boolean()),
  site_visit_interest: fc.option(fc.boolean()),
  terms_accepted: fc.constant(true),
  privacy_policy_accepted: fc.constant(true),
  contact_revealed: fc.boolean(),
  contact_revealed_at: fc.option(fc.date()),
});

export const createAppointmentDataArbitrary = fc.record({
  listingId: fc.uuid(),
  sellerId: fc.uuid(),
  requestedDateTime: fc.date({ min: new Date() }),
  reason_to_buy: fc.constantFrom('Investment' as const, 'Self Use' as const),
  is_property_dealer: fc.boolean(),
  buyer_name: fc.string({ minLength: 2, maxLength: 100 }),
  buyer_phone: fc.string({ minLength: 10, maxLength: 15 }),
  purchase_timeline: fc.option(fc.constantFrom('3 months' as const, '6 months' as const, 'More than 6 months' as const)),
  home_loan_interest: fc.option(fc.boolean()),
  site_visit_interest: fc.option(fc.boolean()),
  terms_accepted: fc.constant(true),
  privacy_policy_accepted: fc.constant(true),
});

// Factory functions for unit tests
export class AppointmentFactory {
  static create(overrides?: Partial<Appointment>): Appointment {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    return {
      id: crypto.randomUUID(),
      listingId: crypto.randomUUID(),
      buyerId: crypto.randomUUID(),
      sellerId: crypto.randomUUID(),
      requestedDateTime: futureDate,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
      reason_to_buy: 'Self Use',
      is_property_dealer: false,
      buyer_name: 'Test Buyer',
      buyer_phone: '+1234567890',
      terms_accepted: true,
      privacy_policy_accepted: true,
      contact_revealed: false,
      ...overrides,
    };
  }

  static createPending(overrides?: Partial<Appointment>): Appointment {
    return this.create({ status: 'pending', ...overrides });
  }

  static createConfirmed(overrides?: Partial<Appointment>): Appointment {
    return this.create({ status: 'confirmed', ...overrides });
  }

  static createMany(count: number, overrides?: Partial<Appointment>): Appointment[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }
}
