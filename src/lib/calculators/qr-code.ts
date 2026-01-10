/**
 * QR Code Generator Logic
 * 
 * Generates QR codes with optional logo embedding and color customization.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.6
 */

import QRCode from 'qrcode';

export interface QRCodeInput {
  content: string;          // URL or text to encode
  size?: number;            // Default 256
  foregroundColor?: string; // Default #000000
  backgroundColor?: string; // Default #FFFFFF
  logo?: string;            // Base64 image data
  logoSize?: number;        // Percentage of QR code (max 30%)
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // Default 'H' for logo support
}

export interface QRCodeResult {
  dataUrl: string;          // Base64 PNG
  svgString: string;        // SVG markup
  isValid: boolean;
  logoWarning?: string;     // Warning if logo might affect scannability
  error?: string;
}

export interface LogoValidation {
  isValid: boolean;
  warning?: string;
}

// Default configuration
const DEFAULT_SIZE = 256;
const DEFAULT_FOREGROUND = '#000000';
const DEFAULT_BACKGROUND = '#FFFFFF';
const DEFAULT_ERROR_CORRECTION: 'L' | 'M' | 'Q' | 'H' = 'H';
const MAX_LOGO_SIZE_PERCENT = 30;
const RECOMMENDED_LOGO_SIZE_PERCENT = 20;

/**
 * Validates logo size to ensure QR code remains scannable.
 * Requirement: 3.6 - Warn if logo is too large
 */
export function validateLogoSize(logoSize: number): LogoValidation {
  if (logoSize <= 0) {
    return { isValid: false, warning: 'Logo size must be greater than 0' };
  }
  
  if (logoSize > MAX_LOGO_SIZE_PERCENT) {
    return { 
      isValid: false, 
      warning: `Logo size exceeds ${MAX_LOGO_SIZE_PERCENT}%. This may make the QR code unscannable.` 
    };
  }
  
  if (logoSize > RECOMMENDED_LOGO_SIZE_PERCENT) {
    return { 
      isValid: true, 
      warning: `Logo size is ${logoSize}%. Recommended maximum is ${RECOMMENDED_LOGO_SIZE_PERCENT}% for reliable scanning.` 
    };
  }
  
  return { isValid: true };
}

/**
 * Validates hex color format.
 */
export function validateColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Generates a QR code as PNG data URL.
 * Requirements: 3.1, 3.3
 */
async function generatePNGDataUrl(
  content: string,
  size: number,
  foregroundColor: string,
  backgroundColor: string,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
): Promise<string> {
  return QRCode.toDataURL(content, {
    width: size,
    margin: 2,
    color: {
      dark: foregroundColor,
      light: backgroundColor,
    },
    errorCorrectionLevel,
  });
}

/**
 * Generates a QR code as SVG string.
 * Requirement: 3.4 - Provide SVG format
 */
async function generateSVGString(
  content: string,
  size: number,
  foregroundColor: string,
  backgroundColor: string,
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
): Promise<string> {
  return QRCode.toString(content, {
    type: 'svg',
    width: size,
    margin: 2,
    color: {
      dark: foregroundColor,
      light: backgroundColor,
    },
    errorCorrectionLevel,
  });
}


/**
 * Embeds a logo in the center of a QR code PNG.
 * Requirement: 3.2 - Embed logo in center
 * Requirement: 3.5 - Maintain scannability after logo insertion
 */
async function embedLogoInPNG(
  qrDataUrl: string,
  logoDataUrl: string,
  qrSize: number,
  logoSizePercent: number
): Promise<string> {
  // This function runs in browser environment only
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return qrDataUrl; // Return original if not in browser
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    canvas.width = qrSize;
    canvas.height = qrSize;

    const qrImage = new Image();
    qrImage.onload = () => {
      // Draw QR code
      ctx.drawImage(qrImage, 0, 0, qrSize, qrSize);

      // Load and draw logo
      const logoImage = new Image();
      logoImage.onload = () => {
        const logoSize = (qrSize * logoSizePercent) / 100;
        const logoX = (qrSize - logoSize) / 2;
        const logoY = (qrSize - logoSize) / 2;

        // Draw white background for logo (improves contrast)
        const padding = logoSize * 0.1;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(
          logoX - padding,
          logoY - padding,
          logoSize + padding * 2,
          logoSize + padding * 2
        );

        // Draw logo
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);

        resolve(canvas.toDataURL('image/png'));
      };

      logoImage.onerror = () => {
        // If logo fails to load, return QR without logo
        resolve(qrDataUrl);
      };

      logoImage.src = logoDataUrl;
    };

    qrImage.onerror = () => {
      reject(new Error('Failed to load QR code image'));
    };

    qrImage.src = qrDataUrl;
  });
}

/**
 * Generates a QR code with optional logo and color customization.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export async function generateQRCode(input: QRCodeInput): Promise<QRCodeResult> {
  const {
    content,
    size = DEFAULT_SIZE,
    foregroundColor = DEFAULT_FOREGROUND,
    backgroundColor = DEFAULT_BACKGROUND,
    logo,
    logoSize = RECOMMENDED_LOGO_SIZE_PERCENT,
    errorCorrectionLevel = DEFAULT_ERROR_CORRECTION,
  } = input;

  // Validate content
  if (!content || !content.trim()) {
    return {
      dataUrl: '',
      svgString: '',
      isValid: false,
      error: 'Content is required',
    };
  }

  // Validate colors
  if (!validateColor(foregroundColor)) {
    return {
      dataUrl: '',
      svgString: '',
      isValid: false,
      error: 'Invalid foreground color format. Use hex format (e.g., #000000)',
    };
  }

  if (!validateColor(backgroundColor)) {
    return {
      dataUrl: '',
      svgString: '',
      isValid: false,
      error: 'Invalid background color format. Use hex format (e.g., #FFFFFF)',
    };
  }

  // Validate size
  if (size < 64 || size > 2048) {
    return {
      dataUrl: '',
      svgString: '',
      isValid: false,
      error: 'Size must be between 64 and 2048 pixels',
    };
  }

  let logoWarning: string | undefined;

  // Validate logo size if logo is provided
  if (logo) {
    const logoValidation = validateLogoSize(logoSize);
    if (!logoValidation.isValid) {
      return {
        dataUrl: '',
        svgString: '',
        isValid: false,
        error: logoValidation.warning,
      };
    }
    logoWarning = logoValidation.warning;
  }

  try {
    // Use high error correction when logo is present for better scannability
    const effectiveErrorCorrection = logo ? 'H' : errorCorrectionLevel;

    // Generate PNG data URL
    let dataUrl = await generatePNGDataUrl(
      content,
      size,
      foregroundColor,
      backgroundColor,
      effectiveErrorCorrection
    );

    // Embed logo if provided
    if (logo) {
      try {
        dataUrl = await embedLogoInPNG(dataUrl, logo, size, logoSize);
      } catch {
        // If logo embedding fails, continue with QR without logo
        logoWarning = 'Failed to embed logo. QR code generated without logo.';
      }
    }

    // Generate SVG string (without logo - SVG logo embedding is complex)
    const svgString = await generateSVGString(
      content,
      size,
      foregroundColor,
      backgroundColor,
      effectiveErrorCorrection
    );

    return {
      dataUrl,
      svgString,
      isValid: true,
      logoWarning,
    };
  } catch (error) {
    return {
      dataUrl: '',
      svgString: '',
      isValid: false,
      error: error instanceof Error ? error.message : 'Failed to generate QR code',
    };
  }
}

/**
 * Generates a simple QR code without logo (for use in other tools).
 * Requirement: 3.1
 */
export async function generateSimpleQRCode(
  content: string,
  size: number = DEFAULT_SIZE
): Promise<string> {
  try {
    return await generatePNGDataUrl(
      content,
      size,
      DEFAULT_FOREGROUND,
      DEFAULT_BACKGROUND,
      DEFAULT_ERROR_CORRECTION
    );
  } catch {
    return '';
  }
}
