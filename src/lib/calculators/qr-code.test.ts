/**
 * Property-Based Tests for QR Code Generator
 * 
 * Feature: marketing-content-tools, Property 3: QR Code Round-Trip
 * Validates: Requirements 3.1
 * 
 * For any input string (URL or text), generating a QR code and then 
 * decoding it SHALL return the original input string.
 */

import fc from 'fast-check';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';

/**
 * Helper function to decode a QR code from a data URL
 * Returns the decoded content or null if decoding fails
 */
async function decodeQRCodeFromDataUrl(dataUrl: string): Promise<string | null> {
  // Extract base64 data from data URL
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Parse PNG
  const png = PNG.sync.read(buffer);
  
  // Decode QR code
  const code = jsQR(
    new Uint8ClampedArray(png.data),
    png.width,
    png.height
  );
  
  return code ? code.data : null;
}

/**
 * Generate a QR code data URL directly using the qrcode library
 * This bypasses the component logic to test the core round-trip property
 */
async function generateQRCodeDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, {
    width: 256,
    margin: 2,
    errorCorrectionLevel: 'H',
  });
}

/**
 * Custom arbitrary for alphanumeric characters
 */
function alphanumericChar(): fc.Arbitrary<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return fc.integer({ min: 0, max: chars.length - 1 }).map((n) => chars[n]);
}

/**
 * Custom arbitrary for common text characters (including spaces and punctuation)
 */
function textChar(): fc.Arbitrary<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .-_@#$%&*()+=';
  return fc.integer({ min: 0, max: chars.length - 1 }).map((n) => chars[n]);
}

describe('QR Code Generator Properties', () => {
  /**
   * Property 3: QR Code Round-Trip
   * 
   * For any input string (URL or text), generating a QR code and then 
   * decoding it SHALL return the original input string.
   * 
   * Validates: Requirements 3.1
   */
  it('Property 3: QR Code Round-Trip - encoding then decoding returns original content', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate non-empty strings that are valid for QR codes
        fc.oneof(
          // URLs
          fc.webUrl(),
          // Simple alphanumeric strings
          fc.string({ unit: alphanumericChar(), minLength: 1, maxLength: 50 }),
          // Text with common characters
          fc.string({ unit: textChar(), minLength: 1, maxLength: 50 })
        ),
        async (content) => {
          // Generate QR code
          const dataUrl = await generateQRCodeDataUrl(content);
          
          // Decode QR code
          const decoded = await decodeQRCodeFromDataUrl(dataUrl);
          
          // Verify round-trip: decoded content should match original
          expect(decoded).toBe(content);
          return true;
        }
      ),
      { numRuns: 50 } // Reduced for performance while still providing good coverage
    );
  }, 300000); // 5 minute timeout for property-based test
});
