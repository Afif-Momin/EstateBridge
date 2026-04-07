import { isValidCountryCode, isValidPincode } from '../utils/validation';

/**
 * Currency Service
 * Handles currency determination, price formatting, and location validation
 * for multi-currency support (USD/INR) based on user location
 */

export type Currency = 'USD' | 'INR';

/**
 * Determine currency based on country code
 * US users get USD, all other countries get INR
 * 
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Currency code (USD or INR)
 * 
 * Requirements: 2.1, 2.2
 */
export const determineCurrency = (countryCode: string): Currency => {
  if (!countryCode || typeof countryCode !== 'string') {
    return 'INR'; // Default to INR for invalid input
  }
  
  const normalizedCode = countryCode.trim().toUpperCase();
  return normalizedCode === 'US' ? 'USD' : 'INR';
};

/**
 * Format price with proper currency symbol and formatting rules
 * USD: $X,XXX.XX with 2 decimal places
 * INR: ₹X,XX,XXX with 0 decimal places (Indian numbering system)
 * 
 * @param amount - Price amount to format
 * @param currency - Currency code (USD or INR)
 * @returns Formatted price string with currency symbol and code
 * 
 * Requirements: 2.4, 18.1, 18.2, 18.3, 18.4
 */
export const formatPrice = (amount: number, currency: Currency): string => {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new Error('Invalid amount: must be a finite number');
  }

  if (amount < 0) {
    throw new Error('Invalid amount: must be non-negative');
  }

  if (currency === 'USD') {
    // USD formatting: $X,XXX.XX with 2 decimal places
    const rounded = amount.toFixed(2);
    const parts = rounded.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];

    // Add comma thousand separators
    const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return `$${withCommas}.${decimalPart} USD`;
  } else {
    // INR formatting: ₹X,XX,XXX with 0 decimal places (Indian numbering system)
    const rounded = Math.round(amount);
    const amountStr = rounded.toString();

    // Indian numbering system: first group of 3 from right, then groups of 2
    let formatted = '';
    let count = 0;

    for (let i = amountStr.length - 1; i >= 0; i--) {
      if (count === 3 || (count > 3 && (count - 3) % 2 === 0)) {
        formatted = ',' + formatted;
      }
      formatted = amountStr[i] + formatted;
      count++;
    }

    return `₹${formatted} INR`;
  }
};

/**
 * Validate country code
 * Wrapper around validation utility for consistency
 * 
 * @param countryCode - Country code to validate
 * @returns Boolean indicating if country code is valid
 */
export const validateCountryCode = (countryCode: string): boolean => {
  return isValidCountryCode(countryCode);
};

/**
 * Validate pincode format for a given country
 * Wrapper around validation utility for consistency
 * 
 * @param pincode - Pincode/postal code to validate
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Boolean indicating if pincode is valid for the country
 */
export const validatePincode = (pincode: string, countryCode: string): boolean => {
  return isValidPincode(pincode, countryCode);
};

/**
 * Currency Service Interface
 * Provides all currency-related operations
 */
export const currencyService = {
  determineCurrency,
  formatPrice,
  validateCountryCode,
  validatePincode,
};

export default currencyService;
