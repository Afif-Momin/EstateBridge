import {
  determineCurrency,
  formatPrice,
  validateCountryCode,
  validatePincode,
  currencyService,
} from '../../services/currencyService';

describe('Currency Service', () => {
  describe('determineCurrency', () => {
    it('should return USD for US country code', () => {
      expect(determineCurrency('US')).toBe('USD');
    });

    it('should return USD for lowercase us', () => {
      expect(determineCurrency('us')).toBe('USD');
    });

    it('should return USD for US with whitespace', () => {
      expect(determineCurrency(' US ')).toBe('USD');
    });

    it('should return INR for India', () => {
      expect(determineCurrency('IN')).toBe('INR');
    });

    it('should return INR for UK', () => {
      expect(determineCurrency('GB')).toBe('INR');
    });

    it('should return INR for Canada', () => {
      expect(determineCurrency('CA')).toBe('INR');
    });

    it('should return INR for any non-US country', () => {
      const countries = ['IN', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'CN', 'BR', 'MX'];
      countries.forEach((country) => {
        expect(determineCurrency(country)).toBe('INR');
      });
    });

    it('should return INR for empty string', () => {
      expect(determineCurrency('')).toBe('INR');
    });

    it('should return INR for invalid input', () => {
      expect(determineCurrency(null as any)).toBe('INR');
      expect(determineCurrency(undefined as any)).toBe('INR');
    });

    it('should return INR for invalid country code', () => {
      expect(determineCurrency('XX')).toBe('INR');
      expect(determineCurrency('INVALID')).toBe('INR');
    });
  });

  describe('formatPrice - USD', () => {
    it('should format USD with $ symbol and 2 decimal places', () => {
      expect(formatPrice(1000, 'USD')).toBe('$1,000.00 USD');
    });

    it('should format small USD amounts', () => {
      expect(formatPrice(50, 'USD')).toBe('$50.00 USD');
      expect(formatPrice(99.99, 'USD')).toBe('$99.99 USD');
    });

    it('should format large USD amounts with commas', () => {
      expect(formatPrice(1000000, 'USD')).toBe('$1,000,000.00 USD');
      expect(formatPrice(500000, 'USD')).toBe('$500,000.00 USD');
      expect(formatPrice(1234567.89, 'USD')).toBe('$1,234,567.89 USD');
    });

    it('should round USD to 2 decimal places', () => {
      expect(formatPrice(99.999, 'USD')).toBe('$100.00 USD');
      expect(formatPrice(99.994, 'USD')).toBe('$99.99 USD');
      expect(formatPrice(123.456, 'USD')).toBe('$123.46 USD');
    });

    it('should format zero USD', () => {
      expect(formatPrice(0, 'USD')).toBe('$0.00 USD');
    });

    it('should format USD amounts less than 1000 without commas', () => {
      expect(formatPrice(999, 'USD')).toBe('$999.00 USD');
      expect(formatPrice(100, 'USD')).toBe('$100.00 USD');
    });

    it('should format USD amounts at 1000 boundary with comma', () => {
      expect(formatPrice(1000, 'USD')).toBe('$1,000.00 USD');
      expect(formatPrice(10000, 'USD')).toBe('$10,000.00 USD');
      expect(formatPrice(100000, 'USD')).toBe('$100,000.00 USD');
    });
  });

  describe('formatPrice - INR', () => {
    it('should format INR with ₹ symbol and 0 decimal places', () => {
      expect(formatPrice(1000, 'INR')).toBe('₹1,000 INR');
    });

    it('should format small INR amounts', () => {
      expect(formatPrice(50, 'INR')).toBe('₹50 INR');
      expect(formatPrice(999, 'INR')).toBe('₹999 INR');
    });

    it('should format INR with Indian numbering system', () => {
      // Indian system: first comma after 3 digits from right, then every 2 digits
      expect(formatPrice(100000, 'INR')).toBe('₹1,00,000 INR');
      expect(formatPrice(1000000, 'INR')).toBe('₹10,00,000 INR');
      expect(formatPrice(10000000, 'INR')).toBe('₹1,00,00,000 INR');
    });

    it('should round INR to 0 decimal places', () => {
      expect(formatPrice(99.4, 'INR')).toBe('₹99 INR');
      expect(formatPrice(99.5, 'INR')).toBe('₹100 INR');
      expect(formatPrice(99.9, 'INR')).toBe('₹100 INR');
      expect(formatPrice(1234.56, 'INR')).toBe('₹1,235 INR');
    });

    it('should format zero INR', () => {
      expect(formatPrice(0, 'INR')).toBe('₹0 INR');
    });

    it('should format typical Indian property prices', () => {
      expect(formatPrice(5000000, 'INR')).toBe('₹50,00,000 INR'); // 50 lakhs
      expect(formatPrice(10000000, 'INR')).toBe('₹1,00,00,000 INR'); // 1 crore
      expect(formatPrice(25000000, 'INR')).toBe('₹2,50,00,000 INR'); // 2.5 crores
    });

    it('should format INR amounts less than 1000 without commas', () => {
      expect(formatPrice(999, 'INR')).toBe('₹999 INR');
      expect(formatPrice(100, 'INR')).toBe('₹100 INR');
    });
  });

  describe('formatPrice - Error Handling', () => {
    it('should throw error for invalid amount types', () => {
      expect(() => formatPrice(NaN, 'USD')).toThrow('Invalid amount: must be a finite number');
      expect(() => formatPrice(Infinity, 'USD')).toThrow('Invalid amount: must be a finite number');
      expect(() => formatPrice(-Infinity, 'USD')).toThrow('Invalid amount: must be a finite number');
    });

    it('should throw error for negative amounts', () => {
      expect(() => formatPrice(-100, 'USD')).toThrow('Invalid amount: must be non-negative');
      expect(() => formatPrice(-0.01, 'INR')).toThrow('Invalid amount: must be non-negative');
    });

    it('should throw error for non-number amounts', () => {
      expect(() => formatPrice('100' as any, 'USD')).toThrow('Invalid amount: must be a finite number');
      expect(() => formatPrice(null as any, 'USD')).toThrow('Invalid amount: must be a finite number');
      expect(() => formatPrice(undefined as any, 'USD')).toThrow('Invalid amount: must be a finite number');
    });
  });

  describe('validateCountryCode', () => {
    it('should validate common country codes', () => {
      expect(validateCountryCode('US')).toBe(true);
      expect(validateCountryCode('IN')).toBe(true);
      expect(validateCountryCode('GB')).toBe(true);
      expect(validateCountryCode('CA')).toBe(true);
      expect(validateCountryCode('AU')).toBe(true);
      expect(validateCountryCode('DE')).toBe(true);
      expect(validateCountryCode('FR')).toBe(true);
      expect(validateCountryCode('JP')).toBe(true);
      expect(validateCountryCode('CN')).toBe(true);
    });

    it('should accept lowercase country codes', () => {
      expect(validateCountryCode('us')).toBe(true);
      expect(validateCountryCode('in')).toBe(true);
      expect(validateCountryCode('gb')).toBe(true);
    });

    it('should reject invalid country codes', () => {
      expect(validateCountryCode('XX')).toBe(false);
      expect(validateCountryCode('ZZ')).toBe(false);
      expect(validateCountryCode('INVALID')).toBe(false);
      expect(validateCountryCode('123')).toBe(false);
    });

    it('should reject empty or invalid input', () => {
      expect(validateCountryCode('')).toBe(false);
      expect(validateCountryCode(null as any)).toBe(false);
      expect(validateCountryCode(undefined as any)).toBe(false);
    });
  });

  describe('validatePincode', () => {
    it('should validate US pincodes (5 digits)', () => {
      expect(validatePincode('12345', 'US')).toBe(true);
      expect(validatePincode('90210', 'US')).toBe(true);
      expect(validatePincode('10001', 'US')).toBe(true);
    });

    it('should reject invalid US pincodes', () => {
      expect(validatePincode('1234', 'US')).toBe(false); // Too short
      expect(validatePincode('123456', 'US')).toBe(false); // Too long
      expect(validatePincode('ABCDE', 'US')).toBe(false); // Not digits
      expect(validatePincode('12-345', 'US')).toBe(false); // Invalid format
    });

    it('should validate Indian pincodes (6 digits)', () => {
      expect(validatePincode('110001', 'IN')).toBe(true);
      expect(validatePincode('400001', 'IN')).toBe(true);
      expect(validatePincode('560001', 'IN')).toBe(true);
    });

    it('should reject invalid Indian pincodes', () => {
      expect(validatePincode('12345', 'IN')).toBe(false); // Too short
      expect(validatePincode('1234567', 'IN')).toBe(false); // Too long
      expect(validatePincode('ABCDEF', 'IN')).toBe(false); // Not digits
    });

    it('should validate UK postcodes', () => {
      expect(validatePincode('SW1A 1AA', 'GB')).toBe(true);
      expect(validatePincode('M1 1AE', 'GB')).toBe(true);
      expect(validatePincode('B33 8TH', 'GB')).toBe(true);
    });

    it('should validate Canadian postal codes', () => {
      expect(validatePincode('K1A 0B1', 'CA')).toBe(true);
      expect(validatePincode('M5W 1E6', 'CA')).toBe(true);
      expect(validatePincode('V6B 1A1', 'CA')).toBe(true);
    });

    it('should use default pattern for countries without specific patterns', () => {
      // Should accept 3-10 alphanumeric characters for countries without specific patterns
      expect(validatePincode('12345', 'FR')).toBe(true);
      expect(validatePincode('ABC123', 'XX')).toBe(true);
    });

    it('should reject empty or invalid input', () => {
      expect(validatePincode('', 'US')).toBe(false);
      expect(validatePincode(null as any, 'US')).toBe(false);
      expect(validatePincode(undefined as any, 'US')).toBe(false);
    });
  });

  describe('currencyService object', () => {
    it('should export all methods', () => {
      expect(currencyService.determineCurrency).toBeDefined();
      expect(currencyService.formatPrice).toBeDefined();
      expect(currencyService.validateCountryCode).toBeDefined();
      expect(currencyService.validatePincode).toBeDefined();
    });

    it('should have working methods', () => {
      expect(currencyService.determineCurrency('US')).toBe('USD');
      expect(currencyService.formatPrice(1000, 'USD')).toBe('$1,000.00 USD');
      expect(currencyService.validateCountryCode('US')).toBe(true);
      expect(currencyService.validatePincode('12345', 'US')).toBe(true);
    });
  });
});
