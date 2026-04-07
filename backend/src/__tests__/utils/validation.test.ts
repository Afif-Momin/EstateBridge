import {
  isValidEmail,
  isValidPassword,
  isValidFullName,
  isValidRating,
  isValidPrice,
  isFutureDate,
  sanitizeString,
  isValidCountryCode,
  isValidPincode,
  validateLocationData,
} from '../../utils/validation';

describe('Location Validation Utilities', () => {
  describe('isValidCountryCode', () => {
    it('should accept valid ISO 3166-1 alpha-2 country codes', () => {
      expect(isValidCountryCode('US')).toBe(true);
      expect(isValidCountryCode('IN')).toBe(true);
      expect(isValidCountryCode('GB')).toBe(true);
      expect(isValidCountryCode('CA')).toBe(true);
      expect(isValidCountryCode('AU')).toBe(true);
      expect(isValidCountryCode('DE')).toBe(true);
      expect(isValidCountryCode('FR')).toBe(true);
      expect(isValidCountryCode('JP')).toBe(true);
      expect(isValidCountryCode('CN')).toBe(true);
      expect(isValidCountryCode('BR')).toBe(true);
    });

    it('should accept lowercase country codes', () => {
      expect(isValidCountryCode('us')).toBe(true);
      expect(isValidCountryCode('in')).toBe(true);
      expect(isValidCountryCode('gb')).toBe(true);
    });

    it('should reject invalid country codes', () => {
      expect(isValidCountryCode('XX')).toBe(false);
      expect(isValidCountryCode('ZZ')).toBe(false);
      expect(isValidCountryCode('USA')).toBe(false);
      expect(isValidCountryCode('IND')).toBe(false);
      expect(isValidCountryCode('123')).toBe(false);
    });

    it('should reject empty or invalid input', () => {
      expect(isValidCountryCode('')).toBe(false);
      expect(isValidCountryCode('U')).toBe(false);
      expect(isValidCountryCode('USAA')).toBe(false);
    });
  });

  describe('isValidPincode', () => {
    describe('US pincodes', () => {
      it('should accept valid 5-digit US zip codes', () => {
        expect(isValidPincode('12345', 'US')).toBe(true);
        expect(isValidPincode('90210', 'US')).toBe(true);
        expect(isValidPincode('10001', 'US')).toBe(true);
      });

      it('should reject invalid US zip codes', () => {
        expect(isValidPincode('1234', 'US')).toBe(false);
        expect(isValidPincode('123456', 'US')).toBe(false);
        expect(isValidPincode('ABCDE', 'US')).toBe(false);
        expect(isValidPincode('12-345', 'US')).toBe(false);
      });
    });

    describe('India pincodes', () => {
      it('should accept valid 6-digit Indian pincodes', () => {
        expect(isValidPincode('110001', 'IN')).toBe(true);
        expect(isValidPincode('400001', 'IN')).toBe(true);
        expect(isValidPincode('560001', 'IN')).toBe(true);
      });

      it('should reject invalid Indian pincodes', () => {
        expect(isValidPincode('12345', 'IN')).toBe(false);
        expect(isValidPincode('1234567', 'IN')).toBe(false);
        expect(isValidPincode('ABCDEF', 'IN')).toBe(false);
        expect(isValidPincode('110-001', 'IN')).toBe(false);
      });
    });

    describe('UK postcodes', () => {
      it('should accept valid UK postcodes', () => {
        expect(isValidPincode('SW1A 1AA', 'GB')).toBe(true);
        expect(isValidPincode('M1 1AE', 'GB')).toBe(true);
        expect(isValidPincode('B33 8TH', 'GB')).toBe(true);
        expect(isValidPincode('CR2 6XH', 'GB')).toBe(true);
        expect(isValidPincode('DN55 1PT', 'GB')).toBe(true);
      });

      it('should accept UK postcodes without spaces', () => {
        expect(isValidPincode('SW1A1AA', 'GB')).toBe(true);
        expect(isValidPincode('M11AE', 'GB')).toBe(true);
      });
    });

    describe('Canadian postal codes', () => {
      it('should accept valid Canadian postal codes', () => {
        expect(isValidPincode('K1A 0B1', 'CA')).toBe(true);
        expect(isValidPincode('M5W 1E6', 'CA')).toBe(true);
        expect(isValidPincode('V6B 1A1', 'CA')).toBe(true);
      });

      it('should accept Canadian postal codes without spaces', () => {
        expect(isValidPincode('K1A0B1', 'CA')).toBe(true);
        expect(isValidPincode('M5W1E6', 'CA')).toBe(true);
      });
    });

    describe('Other countries', () => {
      it('should accept valid Australian postcodes', () => {
        expect(isValidPincode('2000', 'AU')).toBe(true);
        expect(isValidPincode('3000', 'AU')).toBe(true);
      });

      it('should accept valid German postcodes', () => {
        expect(isValidPincode('10115', 'DE')).toBe(true);
        expect(isValidPincode('80331', 'DE')).toBe(true);
      });

      it('should accept valid French postcodes', () => {
        expect(isValidPincode('75001', 'FR')).toBe(true);
        expect(isValidPincode('69001', 'FR')).toBe(true);
      });

      it('should use default pattern for countries without specific rules', () => {
        // Should accept reasonable alphanumeric postal codes
        expect(isValidPincode('12345', 'XX')).toBe(true);
        expect(isValidPincode('ABC123', 'XX')).toBe(true);
        expect(isValidPincode('A1B 2C3', 'XX')).toBe(true);
      });
    });

    it('should handle case-insensitive country codes', () => {
      expect(isValidPincode('12345', 'us')).toBe(true);
      expect(isValidPincode('110001', 'in')).toBe(true);
      expect(isValidPincode('SW1A 1AA', 'gb')).toBe(true);
    });

    it('should reject empty or invalid input', () => {
      expect(isValidPincode('', 'US')).toBe(false);
      expect(isValidPincode('   ', 'US')).toBe(false);
    });
  });

  describe('validateLocationData', () => {
    it('should validate complete and correct location data', () => {
      const result = validateLocationData({
        buy_country: 'US',
        buy_city: 'New York',
        buy_state: 'New York',
        buy_address: '123 Main Street',
        buy_pincode: '10001',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate Indian location data', () => {
      const result = validateLocationData({
        buy_country: 'IN',
        buy_city: 'Mumbai',
        buy_state: 'Maharashtra',
        buy_address: 'Andheri East',
        buy_pincode: '400069',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should report missing country field', () => {
      const result = validateLocationData({
        buy_city: 'New York',
        buy_state: 'New York',
        buy_address: '123 Main Street',
        buy_pincode: '10001',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Country is required');
    });

    it('should report missing city field', () => {
      const result = validateLocationData({
        buy_country: 'US',
        buy_state: 'New York',
        buy_address: '123 Main Street',
        buy_pincode: '10001',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('City is required');
    });

    it('should report missing state field', () => {
      const result = validateLocationData({
        buy_country: 'US',
        buy_city: 'New York',
        buy_address: '123 Main Street',
        buy_pincode: '10001',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('State is required');
    });

    it('should report missing address field', () => {
      const result = validateLocationData({
        buy_country: 'US',
        buy_city: 'New York',
        buy_state: 'New York',
        buy_pincode: '10001',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Address is required');
    });

    it('should report missing pincode field', () => {
      const result = validateLocationData({
        buy_country: 'US',
        buy_city: 'New York',
        buy_state: 'New York',
        buy_address: '123 Main Street',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Pincode is required');
    });

    it('should report multiple missing fields', () => {
      const result = validateLocationData({
        buy_country: 'US',
        buy_city: 'New York',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('State is required');
      expect(result.errors).toContain('Address is required');
      expect(result.errors).toContain('Pincode is required');
    });

    it('should report invalid country code', () => {
      const result = validateLocationData({
        buy_country: 'XX',
        buy_city: 'New York',
        buy_state: 'New York',
        buy_address: '123 Main Street',
        buy_pincode: '10001',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Invalid country code. Must be a valid ISO 3166-1 alpha-2 code'
      );
    });

    it('should report invalid US pincode format', () => {
      const result = validateLocationData({
        buy_country: 'US',
        buy_city: 'New York',
        buy_state: 'New York',
        buy_address: '123 Main Street',
        buy_pincode: '1234',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Invalid pincode format for US. Expected: 5 digits (e.g., 12345)'
      );
    });

    it('should report invalid Indian pincode format', () => {
      const result = validateLocationData({
        buy_country: 'IN',
        buy_city: 'Mumbai',
        buy_state: 'Maharashtra',
        buy_address: 'Andheri East',
        buy_pincode: '12345',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Invalid pincode format for IN. Expected: 6 digits (e.g., 110001)'
      );
    });

    it('should report city too short', () => {
      const result = validateLocationData({
        buy_country: 'US',
        buy_city: 'A',
        buy_state: 'New York',
        buy_address: '123 Main Street',
        buy_pincode: '10001',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('City must be at least 2 characters');
    });

    it('should report state too short', () => {
      const result = validateLocationData({
        buy_country: 'US',
        buy_city: 'New York',
        buy_state: 'A',
        buy_address: '123 Main Street',
        buy_pincode: '10001',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('State must be at least 2 characters');
    });

    it('should report address too short', () => {
      const result = validateLocationData({
        buy_country: 'US',
        buy_city: 'New York',
        buy_state: 'New York',
        buy_address: '123',
        buy_pincode: '10001',
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Address must be at least 5 characters');
    });

    it('should report multiple validation errors', () => {
      const result = validateLocationData({
        buy_country: 'XX',
        buy_city: 'A',
        buy_state: 'B',
        buy_address: '123',
        buy_pincode: '1234',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should handle empty object', () => {
      const result = validateLocationData({});

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(5);
    });
  });
});

// Existing tests for other validation functions
describe('Email Validation', () => {
  it('should accept valid email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('invalid@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('invalid@domain')).toBe(false);
  });
});

describe('Password Validation', () => {
  it('should accept valid passwords', () => {
    expect(isValidPassword('Password123')).toBe(true);
    expect(isValidPassword('MyP@ssw0rd')).toBe(true);
  });

  it('should reject passwords without uppercase', () => {
    expect(isValidPassword('password123')).toBe(false);
  });

  it('should reject passwords without lowercase', () => {
    expect(isValidPassword('PASSWORD123')).toBe(false);
  });

  it('should reject passwords without numbers', () => {
    expect(isValidPassword('PasswordABC')).toBe(false);
  });

  it('should reject passwords that are too short', () => {
    expect(isValidPassword('Pass1')).toBe(false);
  });
});

describe('Full Name Validation', () => {
  it('should accept valid full names', () => {
    expect(isValidFullName('John Doe')).toBe(true);
    expect(isValidFullName('Mary-Jane Smith')).toBe(true);
  });

  it('should reject names that are too short', () => {
    expect(isValidFullName('A')).toBe(false);
  });

  it('should reject names with invalid characters', () => {
    expect(isValidFullName('John123')).toBe(false);
    expect(isValidFullName('John@Doe')).toBe(false);
  });
});

describe('Rating Validation', () => {
  it('should accept valid ratings', () => {
    expect(isValidRating(1)).toBe(true);
    expect(isValidRating(3)).toBe(true);
    expect(isValidRating(5)).toBe(true);
  });

  it('should reject invalid ratings', () => {
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(6)).toBe(false);
    expect(isValidRating(3.5)).toBe(false);
  });
});

describe('Price Validation', () => {
  it('should accept valid prices', () => {
    expect(isValidPrice(100)).toBe(true);
    expect(isValidPrice(0.01)).toBe(true);
    expect(isValidPrice(999999.99)).toBe(true);
  });

  it('should reject invalid prices', () => {
    expect(isValidPrice(0)).toBe(false);
    expect(isValidPrice(-100)).toBe(false);
    expect(isValidPrice(Infinity)).toBe(false);
  });
});

describe('Future Date Validation', () => {
  it('should accept future dates', () => {
    const futureDate = new Date(Date.now() + 86400000); // Tomorrow
    expect(isFutureDate(futureDate)).toBe(true);
  });

  it('should reject past dates', () => {
    const pastDate = new Date(Date.now() - 86400000); // Yesterday
    expect(isFutureDate(pastDate)).toBe(false);
  });
});

describe('String Sanitization', () => {
  it('should trim and normalize whitespace', () => {
    expect(sanitizeString('  hello  world  ')).toBe('hello world');
    expect(sanitizeString('hello\n\nworld')).toBe('hello world');
  });
});
