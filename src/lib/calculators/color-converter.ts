/**
 * Color Code Converter Logic
 * 
 * Converts colors between HEX, RGB, and HSL formats.
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7
 */

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface ColorConvertResult {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  isValid: boolean;
  error?: string;
}

/**
 * Normalizes a HEX color code.
 * Handles 3-digit and 6-digit codes, with or without # prefix.
 * Requirements: 4.6, 4.7
 */
export function normalizeHex(hex: string): string {
  // Remove # if present
  let normalized = hex.replace(/^#/, '').trim();
  
  // Convert 3-digit to 6-digit
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map(char => char + char)
      .join('');
  }
  
  return normalized.toUpperCase();
}

/**
 * Validates a HEX color code.
 */
export function isValidHex(hex: string): boolean {
  const normalized = normalizeHex(hex);
  return /^[0-9A-F]{6}$/i.test(normalized);
}

/**
 * Converts HEX to RGB.
 * Requirements: 4.1
 */
export function hexToRgb(hex: string): RGB | null {
  const normalized = normalizeHex(hex);
  
  if (!isValidHex(normalized)) {
    return null;
  }
  
  const r = parseInt(normalized.substring(0, 2), 16);
  const g = parseInt(normalized.substring(2, 4), 16);
  const b = parseInt(normalized.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Converts RGB to HEX.
 * Requirements: 4.2
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number): string => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    return clamped.toString(16).padStart(2, '0').toUpperCase();
  };
  
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Converts RGB to HSL.
 * Requirements: 4.2
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  let h = 0;
  let s = 0;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts HSL to RGB.
 * Requirements: 4.3
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;
  
  let r: number, g: number, b: number;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Parses RGB string format like "rgb(255, 128, 0)" or "255, 128, 0".
 */
function parseRgbString(input: string): RGB | null {
  // Match rgb(r, g, b) or r, g, b format
  const match = input.match(/^(?:rgb\s*\(\s*)?(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)?$/i);
  
  if (!match) return null;
  
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  
  if (r > 255 || g > 255 || b > 255) return null;
  
  return { r, g, b };
}

/**
 * Parses HSL string format like "hsl(360, 100%, 50%)" or "360, 100, 50".
 */
function parseHslString(input: string): HSL | null {
  // Match hsl(h, s%, l%) or h, s, l format
  const match = input.match(/^(?:hsl\s*\(\s*)?(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)?$/i);
  
  if (!match) return null;
  
  const h = parseInt(match[1], 10);
  const s = parseInt(match[2], 10);
  const l = parseInt(match[3], 10);
  
  if (h > 360 || s > 100 || l > 100) return null;
  
  return { h, s, l };
}

/**
 * Parses any color input and returns all formats.
 * Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7
 */
export function parseColor(input: string): ColorConvertResult {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      hex: '',
      rgb: { r: 0, g: 0, b: 0 },
      hsl: { h: 0, s: 0, l: 0 },
      isValid: false,
      error: 'Please enter a color value',
    };
  }
  
  // Try HEX format
  if (/^#?[0-9A-Fa-f]{3}$|^#?[0-9A-Fa-f]{6}$/.test(trimmed)) {
    const rgb = hexToRgb(trimmed);
    if (rgb) {
      const hsl = rgbToHsl(rgb);
      return {
        hex: '#' + normalizeHex(trimmed),
        rgb,
        hsl,
        isValid: true,
      };
    }
  }
  
  // Try RGB format
  const rgb = parseRgbString(trimmed);
  if (rgb) {
    const hsl = rgbToHsl(rgb);
    return {
      hex: rgbToHex(rgb),
      rgb,
      hsl,
      isValid: true,
    };
  }
  
  // Try HSL format
  const hsl = parseHslString(trimmed);
  if (hsl) {
    const rgbFromHsl = hslToRgb(hsl);
    return {
      hex: rgbToHex(rgbFromHsl),
      rgb: rgbFromHsl,
      hsl,
      isValid: true,
    };
  }
  
  return {
    hex: '',
    rgb: { r: 0, g: 0, b: 0 },
    hsl: { h: 0, s: 0, l: 0 },
    isValid: false,
    error: 'Invalid color format. Use HEX (#FF0000), RGB (255, 0, 0), or HSL (0, 100, 50)',
  };
}

/**
 * Formats RGB as string.
 */
export function formatRgb(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * Formats HSL as string.
 */
export function formatHsl(hsl: HSL): string {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}
