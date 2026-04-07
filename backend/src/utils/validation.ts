import { VALIDATION } from '../constants/index';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Must be at least 8 characters with uppercase, lowercase, and number
 */
export const isValidPassword = (password: string): boolean => {
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasUppercase && hasLowercase && hasNumber;
};

/**
 * Validate full name
 */
export const isValidFullName = (fullName: string): boolean => {
  const trimmed = fullName.trim();
  if (
    trimmed.length < VALIDATION.FULL_NAME_MIN_LENGTH ||
    trimmed.length > VALIDATION.FULL_NAME_MAX_LENGTH
  ) {
    return false;
  }

  // Allow letters, spaces, and hyphens only
  const nameRegex = /^[a-zA-Z\s-]+$/;
  return nameRegex.test(trimmed);
};

/**
 * Validate rating (1-5)
 */
export const isValidRating = (rating: number): boolean => {
  return (
    Number.isInteger(rating) &&
    rating >= VALIDATION.RATING_MIN &&
    rating <= VALIDATION.RATING_MAX
  );
};

/**
 * Validate price (positive number)
 */
export const isValidPrice = (price: number): boolean => {
  return typeof price === 'number' && price > 0 && Number.isFinite(price);
};

/**
 * Validate date is in the future
 */
export const isFutureDate = (date: Date): boolean => {
  return date.getTime() > Date.now();
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};

/**
 * ISO 3166-1 alpha-2 country codes
 * Comprehensive list of valid country codes
 */
const VALID_COUNTRY_CODES = new Set([
  'US', 'IN', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL',
  'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'GR',
  'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SK', 'SI', 'LT', 'LV',
  'EE', 'CY', 'MT', 'LU', 'IS', 'LI', 'MC', 'AD', 'SM', 'VA',
  'JP', 'CN', 'KR', 'TW', 'HK', 'SG', 'MY', 'TH', 'ID', 'PH',
  'VN', 'BD', 'PK', 'LK', 'NP', 'MM', 'KH', 'LA', 'BN', 'MO',
  'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY',
  'UY', 'GY', 'SR', 'GF', 'FK', 'CR', 'PA', 'NI', 'HN', 'SV',
  'GT', 'BZ', 'CU', 'DO', 'HT', 'JM', 'TT', 'BB', 'BS', 'KY',
  'ZA', 'EG', 'NG', 'KE', 'GH', 'TZ', 'UG', 'ET', 'MA', 'DZ',
  'TN', 'LY', 'SD', 'AO', 'MZ', 'ZW', 'ZM', 'MW', 'BW', 'NA',
  'RU', 'UA', 'BY', 'KZ', 'UZ', 'TM', 'KG', 'TJ', 'GE', 'AM',
  'AZ', 'TR', 'IL', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'JO',
  'LB', 'SY', 'IQ', 'IR', 'AF', 'YE', 'PS', 'NZ', 'FJ', 'PG',
  'NC', 'PF', 'WS', 'TO', 'VU', 'SB', 'KI', 'TV', 'NR', 'PW'
]);

/**
 * Pincode format patterns by country
 */
const PINCODE_PATTERNS: Record<string, RegExp> = {
  US: /^\d{5}$/,           // 5 digits for US
  IN: /^\d{6}$/,           // 6 digits for India
  GB: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i, // UK postcodes
  CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, // Canadian postal codes
  AU: /^\d{4}$/,           // 4 digits for Australia
  DE: /^\d{5}$/,           // 5 digits for Germany
  FR: /^\d{5}$/,           // 5 digits for France
  JP: /^\d{3}-?\d{4}$/,    // Japan postal codes
  CN: /^\d{6}$/,           // 6 digits for China
  BR: /^\d{5}-?\d{3}$/,    // Brazil CEP
  MX: /^\d{5}$/,           // 5 digits for Mexico
  IT: /^\d{5}$/,           // 5 digits for Italy
  ES: /^\d{5}$/,           // 5 digits for Spain
  NL: /^\d{4}\s?[A-Z]{2}$/i, // Netherlands postcodes
};

/**
 * Validate country code against ISO 3166-1 alpha-2 standard
 */
export const isValidCountryCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') {
    return false;
  }
  return VALID_COUNTRY_CODES.has(code.toUpperCase());
};

/**
 * Validate pincode format based on country
 * @param pincode - The pincode/postal code to validate
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns boolean indicating if pincode is valid for the country
 */
export const isValidPincode = (pincode: string, countryCode: string): boolean => {
  if (!pincode || typeof pincode !== 'string') {
    return false;
  }

  const normalizedCountry = countryCode.toUpperCase();
  const pattern = PINCODE_PATTERNS[normalizedCountry];

  // If we have a specific pattern for this country, use it
  if (pattern) {
    return pattern.test(pincode.trim());
  }

  // For countries without specific patterns, accept 3-10 alphanumeric characters
  // This is a reasonable default for most postal code systems
  const defaultPattern = /^[A-Z0-9\s-]{3,10}$/i;
  return defaultPattern.test(pincode.trim());
};

/**
 * Validate location data completeness and format
 * @param locationData - Object containing location fields
 * @returns Object with validation result and specific error messages
 */
export const validateLocationData = (locationData: {
  buy_country?: string;
  buy_city?: string;
  buy_state?: string;
  buy_address?: string;
  buy_pincode?: string;
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for missing required fields
  if (!locationData.buy_country) {
    errors.push('Country is required');
  }
  if (!locationData.buy_city) {
    errors.push('City is required');
  }
  if (!locationData.buy_state) {
    errors.push('State is required');
  }
  if (!locationData.buy_address) {
    errors.push('Address is required');
  }
  if (!locationData.buy_pincode) {
    errors.push('Pincode is required');
  }

  // If any required field is missing, return early
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Validate country code format
  if (!isValidCountryCode(locationData.buy_country!)) {
    errors.push('Invalid country code. Must be a valid ISO 3166-1 alpha-2 code');
  }

  // Validate pincode format for the specified country
  if (locationData.buy_country && locationData.buy_pincode) {
    if (!isValidPincode(locationData.buy_pincode, locationData.buy_country)) {
      const countryCode = locationData.buy_country.toUpperCase();
      let expectedFormat = 'valid postal code format';
      
      if (countryCode === 'US') {
        expectedFormat = '5 digits (e.g., 12345)';
      } else if (countryCode === 'IN') {
        expectedFormat = '6 digits (e.g., 110001)';
      } else if (countryCode === 'GB') {
        expectedFormat = 'UK postcode format (e.g., SW1A 1AA)';
      } else if (countryCode === 'CA') {
        expectedFormat = 'Canadian postal code format (e.g., K1A 0B1)';
      }
      
      errors.push(`Invalid pincode format for ${countryCode}. Expected: ${expectedFormat}`);
    }
  }

  // Validate field lengths
  if (locationData.buy_city && locationData.buy_city.trim().length < 2) {
    errors.push('City must be at least 2 characters');
  }
  if (locationData.buy_state && locationData.buy_state.trim().length < 2) {
    errors.push('State must be at least 2 characters');
  }
  if (locationData.buy_address && locationData.buy_address.trim().length < 5) {
    errors.push('Address must be at least 5 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
