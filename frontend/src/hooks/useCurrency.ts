/**
 * Currency Hook
 * Provides currency formatting utilities for the frontend
 * Matches backend currency service logic for consistent display
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4
 */

export type Currency = 'USD' | 'INR';

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

    return `${withCommas}.${decimalPart} USD`;
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
 * Custom hook for currency formatting
 * Provides formatPrice function for use in React components
 * 
 * @returns Object with formatPrice function
 */
export const useCurrency = () => {
  return {
    formatPrice,
  };
};

export default useCurrency;
