import fc from 'fast-check';
import { UserFactory, userArbitrary } from './factories/userFactory';
import { PropertyFactory, propertyArbitrary } from './factories/propertyFactory';

describe('Testing Infrastructure - Sample Tests', () => {
  describe('Unit Tests', () => {
    it('should create a user with factory', () => {
      const user = UserFactory.create();
      
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toContain('@example.com');
      expect(user.role).toMatch(/^(buyer|seller)$/);
    });

    it('should create a property with factory', () => {
      const property = PropertyFactory.create();
      
      expect(property).toBeDefined();
      expect(property.id).toBeDefined();
      expect(property.price).toBeGreaterThan(0);
      expect(property.status).toMatch(/^(available|under_offer|sold)$/);
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: estate-bridge-mern, Testing Infrastructure
     * Validates that user factory generates valid user objects
     */
    it('should generate valid users with arbitrary', () => {
      fc.assert(
        fc.property(userArbitrary, (user) => {
          expect(user.id).toBeDefined();
          expect(user.email).toContain('@');
          expect(['buyer', 'seller']).toContain(user.role);
          expect(user.fullName.length).toBeGreaterThanOrEqual(2);
          expect(user.fullName.length).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: estate-bridge-mern, Testing Infrastructure
     * Validates that property factory generates valid property objects
     */
    it('should generate valid properties with arbitrary', () => {
      fc.assert(
        fc.property(propertyArbitrary, (property) => {
          expect(property.id).toBeDefined();
          expect(property.title.length).toBeGreaterThanOrEqual(5);
          expect(property.title.length).toBeLessThanOrEqual(200);
          expect(property.description.length).toBeGreaterThanOrEqual(20);
          expect(property.description.length).toBeLessThanOrEqual(2000);
          expect(property.price).toBeGreaterThanOrEqual(10000);
          expect(property.price).toBeLessThanOrEqual(10000000);
          expect(['north', 'south', 'east', 'west', 'central']).toContain(property.region);
          expect(['house', 'apartment', 'condo', 'land', 'commercial']).toContain(property.propertyType);
          expect(['available', 'under_offer', 'sold']).toContain(property.status);
          expect(property.imageUrls.length).toBeLessThanOrEqual(10);
        }),
        { numRuns: 100 }
      );
    });
  });
});
