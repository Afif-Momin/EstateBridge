/**
 * Tests for useCurrency hook
 * Validates currency formatting logic matches backend implementation
 */

import { describe, it, expect } from 'vitest';
import { formatPrice, useCurrency } from '../useCurrency';

describe('useCurrency', () => {
  describe('formatPrice', () => {
    describe('USD formatting', () => {
      it('should format USD with $ symbol, commas, and 2 decimal places', () => {
        expect(formatPrice(1234.56, 'USD')).toBe('1,234.56 USD');
      });

      it('should format small USD amounts correctly', () => {
        expect(formatPrice(5.99, 'USD')).toBe('5.99 USD');
      });

      it('should format large USD amounts with proper comma separators', () => {
        expect(formatPrice(1234567.89, 'USD')).toBe('1,234,567.89 USD');
      });

      it('should round USD to 2 decimal places', () => {
        expect(formatPrice(100.999, 'USD')).toBe('101.00 USD');
        expect(formatPrice(100.001, 'USD')).toBe('100.00 USD');
      });

      it('should format zero USD correctly', () => {
        expect(formatPrice(0, 'USD')).toBe('0.00 USD');
      });

      it('should format USD amounts without decimals', () => {
        expect(formatPrice(1000, 'USD')).toBe('1,000.00 USD');
      });

      it('should handle very large USD amounts', () => {
        expect(formatPrice(10000000, 'USD')).toBe('10,000,000.00 USD');
      });
    });

    describe('INR formatting', () => {
      it('should format INR with ₹ symbol and Indian numbering system', () => {
        expect(formatPrice(123456, 'INR')).toBe('₹1,23,456 INR');
      });

      it('should format small INR amounts correctly', () => {
        expect(formatPrice(999, 'INR')).toBe('₹999 INR');
      });

      it('should format large INR amounts with proper comma separators', () => {
        expect(formatPrice(12345678, 'INR')).toBe('₹1,23,45,678 INR');
      });

      it('should round INR to 0 decimal places', () => {
        expect(formatPrice(1234.56, 'INR')).toBe('₹1,235 INR');
        expect(formatPrice(1234.49, 'INR')).toBe('₹1,234 INR');
      });

      it('should format zero INR correctly', () => {
        expect(formatPrice(0, 'INR')).toBe('₹0 INR');
      });

      it('should handle very large INR amounts', () => {
        expect(formatPrice(100000000, 'INR')).toBe('₹10,00,00,000 INR');
      });

      it('should format INR with first group of 3, then groups of 2', () => {
        expect(formatPrice(1000, 'INR')).toBe('₹1,000 INR');
        expect(formatPrice(10000, 'INR')).toBe('₹10,000 INR');
        expect(formatPrice(100000, 'INR')).toBe('₹1,00,000 INR');
        expect(formatPrice(1000000, 'INR')).toBe('₹10,00,000 INR');
      });
    });

    describe('error handling', () => {
      it('should throw error for non-number amounts', () => {
        expect(() => formatPrice('1234' as any, 'USD')).toThrow('Invalid amount: must be a finite number');
        expect(() => formatPrice(null as any, 'USD')).toThrow('Invalid amount: must be a finite number');
        expect(() => formatPrice(undefined as any, 'USD')).toThrow('Invalid amount: must be a finite number');
      });

      it('should throw error for infinite amounts', () => {
        expect(() => formatPrice(Infinity, 'USD')).toThrow('Invalid amount: must be a finite number');
        expect(() => formatPrice(-Infinity, 'USD')).toThrow('Invalid amount: must be a finite number');
      });

      it('should throw error for NaN amounts', () => {
        expect(() => formatPrice(NaN, 'USD')).toThrow('Invalid amount: must be a finite number');
      });

      it('should throw error for negative amounts', () => {
        expect(() => formatPrice(-100, 'USD')).toThrow('Invalid amount: must be non-negative');
        expect(() => formatPrice(-0.01, 'INR')).toThrow('Invalid amount: must be non-negative');
      });
    });

    describe('edge cases', () => {
      it('should handle very small positive amounts', () => {
        expect(formatPrice(0.01, 'USD')).toBe('0.01 USD');
        expect(formatPrice(0.001, 'INR')).toBe('₹0 INR');
      });

      it('should handle amounts with many decimal places', () => {
        expect(formatPrice(123.456789, 'USD')).toBe('123.46 USD');
        expect(formatPrice(123.456789, 'INR')).toBe('₹123 INR');
      });
    });
  });

  describe('useCurrency hook', () => {
    it('should return formatPrice function', () => {
      const { formatPrice: hookFormatPrice } = useCurrency();
      expect(typeof hookFormatPrice).toBe('function');
    });

    it('should format prices correctly when called from hook', () => {
      const { formatPrice: hookFormatPrice } = useCurrency();
      expect(hookFormatPrice(1234.56, 'USD')).toBe('1,234.56 USD');
      expect(hookFormatPrice(123456, 'INR')).toBe('₹1,23,456 INR');
    });
  });
});
