/**
 * CSV Parser Tests
 * 
 * Property-based tests using fast-check to validate CSV parsing correctness.
 * 
 * Feature: advanced-merchant-calculators
 * Validates: Requirements 1.1, 1.4, 6.4
 */

import fc from 'fast-check';
import { parseAdCSV, parseCSVString, parseNumericValue, detectPlatform } from './csv-parser';

// Configure minimum 100 iterations for property tests
const testConfig = { numRuns: 100 };

describe('CSV Parser', () => {
  describe('parseCSVString', () => {
    it('should parse simple CSV correctly', () => {
      const csv = 'Campaign,Cost\nCampaign 1,100\nCampaign 2,200';
      const result = parseCSVString(csv);
      expect(result).toEqual([
        ['Campaign', 'Cost'],
        ['Campaign 1', '100'],
        ['Campaign 2', '200'],
      ]);
    });

    it('should handle quoted values with commas', () => {
      const csv = 'Campaign,Cost\n"Campaign, with comma",100';
      const result = parseCSVString(csv);
      expect(result).toEqual([
        ['Campaign', 'Cost'],
        ['Campaign, with comma', '100'],
      ]);
    });

    it('should handle empty lines', () => {
      const csv = 'Campaign,Cost\n\nCampaign 1,100\n';
      const result = parseCSVString(csv);
      expect(result).toEqual([
        ['Campaign', 'Cost'],
        ['Campaign 1', '100'],
      ]);
    });
  });

  describe('parseNumericValue', () => {
    it('should parse plain numbers', () => {
      expect(parseNumericValue('100')).toBe(100);
      expect(parseNumericValue('100.50')).toBe(100.5);
    });

    it('should handle currency symbols', () => {
      expect(parseNumericValue('$100')).toBe(100);
      expect(parseNumericValue('SAR 100')).toBe(100);
      expect(parseNumericValue('100 SAR')).toBe(100);
    });

    it('should handle commas in numbers', () => {
      expect(parseNumericValue('1,000')).toBe(1000);
      expect(parseNumericValue('1,000.50')).toBe(1000.5);
    });

    it('should return 0 for empty or invalid values', () => {
      expect(parseNumericValue('')).toBe(0);
      expect(parseNumericValue('   ')).toBe(0);
    });
  });

  describe('detectPlatform', () => {
    it('should detect Facebook from Amount spent column', () => {
      expect(detectPlatform(['Campaign name', 'Amount spent (SAR)', 'Impressions'])).toBe('facebook');
      expect(detectPlatform(['Campaign', 'Amount spent', 'Clicks'])).toBe('facebook');
    });

    it('should detect Google from impr. column', () => {
      expect(detectPlatform(['Campaign', 'Cost', 'Impr.', 'Clicks'])).toBe('google');
    });

    it('should return other for unrecognized formats', () => {
      expect(detectPlatform(['Name', 'Value', 'Count'])).toBe('other');
    });
  });


  /**
   * Property 1: CSV Parsing Extracts Correct Ad Spend Totals
   * 
   * For any valid CSV file containing ad spend data with numeric spend values,
   * parsing the file SHALL return a total spend equal to the sum of all
   * individual spend values in the file.
   * 
   * Feature: advanced-merchant-calculators, Property 1: CSV Parsing Extracts Correct Ad Spend Totals
   * Validates: Requirements 1.1
   */
  describe('Property 1: CSV Parsing Extracts Correct Ad Spend Totals', () => {
    it('should return totalSpend equal to sum of all spend values', () => {
      fc.assert(
        fc.property(
          // Generate array of spend values (positive numbers)
          fc.array(fc.float({ min: 0, max: 100000, noNaN: true }), { minLength: 1, maxLength: 20 }),
          (spendValues) => {
            // Build a valid CSV with the generated spend values
            const header = 'Campaign,Cost';
            const rows = spendValues.map((spend, i) => `Campaign ${i + 1},${spend.toFixed(2)}`);
            const csvContent = [header, ...rows].join('\n');

            const result = parseAdCSV(csvContent);

            // Calculate expected total
            const expectedTotal = spendValues.reduce((sum, val) => sum + val, 0);

            // Verify success and total matches (with floating point tolerance)
            expect(result.success).toBe(true);
            expect(result.totalSpend).toBeCloseTo(expectedTotal, 1);
            expect(result.rowCount).toBe(spendValues.length);
          }
        ),
        testConfig
      );
    });

    it('should correctly sum spend values from Facebook format CSV', () => {
      fc.assert(
        fc.property(
          fc.array(fc.float({ min: 0, max: 50000, noNaN: true }), { minLength: 1, maxLength: 15 }),
          (spendValues) => {
            const header = 'Campaign name,Amount spent (SAR),Impressions,Link clicks';
            const rows = spendValues.map((spend, i) => 
              `Campaign ${i + 1},${spend.toFixed(2)},${Math.floor(spend * 10)},${Math.floor(spend)}`
            );
            const csvContent = [header, ...rows].join('\n');

            const result = parseAdCSV(csvContent);
            const expectedTotal = spendValues.reduce((sum, val) => sum + val, 0);

            expect(result.success).toBe(true);
            expect(result.platform).toBe('facebook');
            expect(result.totalSpend).toBeCloseTo(expectedTotal, 1);
          }
        ),
        testConfig
      );
    });

    it('should correctly sum spend values with currency formatting', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 10000 }), { minLength: 1, maxLength: 10 }),
          (spendValues) => {
            const header = 'Campaign,Cost';
            // Format with SAR currency symbol
            const rows = spendValues.map((spend, i) => `Campaign ${i + 1},SAR ${spend}`);
            const csvContent = [header, ...rows].join('\n');

            const result = parseAdCSV(csvContent);
            const expectedTotal = spendValues.reduce((sum, val) => sum + val, 0);

            expect(result.success).toBe(true);
            expect(result.totalSpend).toBe(expectedTotal);
          }
        ),
        testConfig
      );
    });
  });

  /**
   * Property 3: Invalid CSV Returns Appropriate Errors
   * 
   * For any CSV file that does not conform to supported formats (missing required
   * columns, non-numeric spend values, or malformed structure), the parser SHALL
   * return success=false with a descriptive error message.
   * 
   * Feature: advanced-merchant-calculators, Property 3: Invalid CSV Returns Appropriate Errors
   * Validates: Requirements 1.4, 6.4
   */
  describe('Property 3: Invalid CSV Returns Appropriate Errors', () => {
    it('should return error for empty content', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '   ', '\n', '\n\n', '\t'),
          (emptyContent) => {
            const result = parseAdCSV(emptyContent);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error!.length).toBeGreaterThan(0);
          }
        ),
        testConfig
      );
    });

    it('should return error for CSV without spend column', () => {
      fc.assert(
        fc.property(
          // Generate random column names that don't include spend-related terms
          fc.array(
            fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{2,15}$/).filter(
              s => !['cost', 'spend', 'amount'].some(term => s.toLowerCase().includes(term))
            ),
            { minLength: 2, maxLength: 5 }
          ),
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
          (headers, dataValues) => {
            // Ensure we have unique headers
            const uniqueHeaders = [...new Set(headers)];
            if (uniqueHeaders.length < 2) return true; // Skip if not enough unique headers

            const header = uniqueHeaders.join(',');
            const row = dataValues.slice(0, uniqueHeaders.length).join(',');
            const csvContent = `${header}\n${row}`;

            const result = parseAdCSV(csvContent);
            
            // Should fail because no spend column
            expect(result.success).toBe(false);
            expect(result.error).toContain('Missing required column');
            return true;
          }
        ),
        testConfig
      );
    });

    it('should return error for header-only CSV', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'Campaign,Cost',
            'Campaign name,Amount spent (SAR)',
            'Campaign,Cost,Impressions'
          ),
          (headerOnly) => {
            const result = parseAdCSV(headerOnly);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        testConfig
      );
    });

    it('should handle CSV with all empty data rows gracefully', () => {
      const csvContent = 'Campaign,Cost\n,\n,\n,';
      const result = parseAdCSV(csvContent);
      // Should either fail or return 0 total spend
      if (result.success) {
        expect(result.totalSpend).toBe(0);
      } else {
        expect(result.error).toBeDefined();
      }
    });
  });

  // Unit tests for specific edge cases
  describe('Unit Tests - Edge Cases', () => {
    it('should parse a typical Facebook Ads export', () => {
      const csv = `Campaign name,Amount spent (SAR),Impressions,Link clicks
Summer Sale,1500.50,25000,500
Winter Promo,2300.75,35000,750
Flash Deal,800.00,12000,200`;

      const result = parseAdCSV(csv);
      
      expect(result.success).toBe(true);
      expect(result.platform).toBe('facebook');
      expect(result.totalSpend).toBeCloseTo(4601.25, 2);
      expect(result.rowCount).toBe(3);
      expect(result.data).toHaveLength(3);
    });

    it('should parse a typical TikTok Ads export', () => {
      const csv = `Campaign,Cost,Impressions,Clicks
Brand Awareness,500,10000,100
Product Launch,1200,25000,300`;

      const result = parseAdCSV(csv);
      
      expect(result.success).toBe(true);
      expect(result.totalSpend).toBe(1700);
      expect(result.rowCount).toBe(2);
    });

    it('should handle zero spend values', () => {
      const csv = `Campaign,Cost
Paused Campaign,0
Active Campaign,100`;

      const result = parseAdCSV(csv);
      
      expect(result.success).toBe(true);
      expect(result.totalSpend).toBe(100);
      expect(result.rowCount).toBe(2);
    });

    it('should handle large numbers', () => {
      const csv = `Campaign,Cost
Big Campaign,1000000.99`;

      const result = parseAdCSV(csv);
      
      expect(result.success).toBe(true);
      expect(result.totalSpend).toBeCloseTo(1000000.99, 2);
    });
  });
});
