/**
 * Color Converter Property Tests
 * Feature: content-technical-tools
 * Tests Properties 7, 8, 9 from design document
 */

import * as fc from 'fast-check';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  normalizeHex,
  type RGB,
} from './color-converter';

const rgbArbitrary = fc.record({
  r: fc.integer({ min: 0, max: 255 }),
  g: fc.integer({ min: 0, max: 255 }),
  b: fc.integer({ min: 0, max: 255 }),
});

const hexArbitrary = fc.array(
  fc.constantFrom(...'0123456789ABCDEF'.split('')),
  { minLength: 6, maxLength: 6 }
).map(arr => arr.join(''));

const hex3Arbitrary = fc.array(
  fc.constantFrom(...'0123456789ABCDEF'.split('')),
  { minLength: 3, maxLength: 3 }
).map(arr => arr.join(''));

describe('Color Converter Properties', () => {
  describe('Property 7: HEX round-trip', () => {
    it('HEX to RGB to HEX produces equivalent color', () => {
      fc.assert(
        fc.property(hexArbitrary, (hex: string) => {
          const rgb = hexToRgb(hex);
          if (!rgb) return false;
          const backToHex = rgbToHex(rgb);
          return normalizeHex(hex) === normalizeHex(backToHex);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: RGB-HSL round-trip', () => {
    it('RGB to HSL to RGB within tolerance', () => {
      fc.assert(
        fc.property(rgbArbitrary, (rgb: RGB) => {
          const hsl = rgbToHsl(rgb);
          const back = hslToRgb(hsl);
          const rDiff = Math.abs(rgb.r - back.r);
          const gDiff = Math.abs(rgb.g - back.g);
          const bDiff = Math.abs(rgb.b - back.b);
          return rDiff <= 3 && gDiff <= 3 && bDiff <= 3;
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: 3-digit HEX normalization', () => {
    it('3-digit HEX expands correctly', () => {
      fc.assert(
        fc.property(hex3Arbitrary, (hex3: string) => {
          const expanded = hex3.split('').map(c => c + c).join('');
          const rgb3 = hexToRgb(hex3);
          const rgb6 = hexToRgb(expanded);
          if (!rgb3 || !rgb6) return false;
          return rgb3.r === rgb6.r && rgb3.g === rgb6.g && rgb3.b === rgb6.b;
        }),
        { numRuns: 100 }
      );
    });
  });
});
