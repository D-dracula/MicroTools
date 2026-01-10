/**
 * Color Extraction Logic
 * 
 * Implements color quantization algorithm, HEX/RGB/HSL conversion,
 * and complementary/analogous color generation.
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ExtractedColor {
  hex: string;
  rgb: RGB;
  hsl: HSL;
  percentage: number;
  count: number;
}

export interface ColorExtractionInput {
  file: File;
  colorCount?: number; // 5-10, default 6
}

export interface ColorExtractionResult {
  colors: ExtractedColor[];
  complementary: string[];
  analogous: string[];
  triadic: string[];
  dominantColor: ExtractedColor;
  totalPixels: number;
}

/**
 * Supported input formats
 */
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];

/**
 * Maximum file size (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Default number of colors to extract
 */
export const DEFAULT_COLOR_COUNT = 6;

/**
 * Validates if a file is a supported image format
 */
export function isValidImageFile(file: File): boolean {
  return SUPPORTED_FORMATS.includes(file.type);
}

/**
 * Validates file size
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Converts RGB to HEX
 * Requirement: 11.2
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Converts HEX to RGB
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error('Invalid hex color');
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Converts RGB to HSL
 * Requirement: 11.2
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

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
 * Converts HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
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
 * Converts HSL to HEX
 */
export function hslToHex(h: number, s: number, l: number): string {
  const rgb = hslToRgb(h, s, l);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}


/**
 * Color quantization using median cut algorithm
 * Requirement: 11.1
 */
interface ColorBox {
  colors: RGB[];
  counts: number[];
}

function getColorRange(box: ColorBox): { channel: 'r' | 'g' | 'b'; range: number } {
  let minR = 255, maxR = 0;
  let minG = 255, maxG = 0;
  let minB = 255, maxB = 0;

  for (const color of box.colors) {
    minR = Math.min(minR, color.r);
    maxR = Math.max(maxR, color.r);
    minG = Math.min(minG, color.g);
    maxG = Math.max(maxG, color.g);
    minB = Math.min(minB, color.b);
    maxB = Math.max(maxB, color.b);
  }

  const rangeR = maxR - minR;
  const rangeG = maxG - minG;
  const rangeB = maxB - minB;

  if (rangeR >= rangeG && rangeR >= rangeB) {
    return { channel: 'r', range: rangeR };
  } else if (rangeG >= rangeR && rangeG >= rangeB) {
    return { channel: 'g', range: rangeG };
  } else {
    return { channel: 'b', range: rangeB };
  }
}

function splitBox(box: ColorBox): [ColorBox, ColorBox] {
  const { channel } = getColorRange(box);
  
  // Sort colors by the channel with the largest range
  const indices = box.colors.map((_, i) => i);
  indices.sort((a, b) => box.colors[a][channel] - box.colors[b][channel]);
  
  const sortedColors = indices.map(i => box.colors[i]);
  const sortedCounts = indices.map(i => box.counts[i]);
  
  const mid = Math.floor(sortedColors.length / 2);
  
  return [
    { colors: sortedColors.slice(0, mid), counts: sortedCounts.slice(0, mid) },
    { colors: sortedColors.slice(mid), counts: sortedCounts.slice(mid) },
  ];
}

function getAverageColor(box: ColorBox): { rgb: RGB; count: number } {
  let totalR = 0, totalG = 0, totalB = 0;
  let totalCount = 0;

  for (let i = 0; i < box.colors.length; i++) {
    const count = box.counts[i];
    totalR += box.colors[i].r * count;
    totalG += box.colors[i].g * count;
    totalB += box.colors[i].b * count;
    totalCount += count;
  }

  return {
    rgb: {
      r: Math.round(totalR / totalCount),
      g: Math.round(totalG / totalCount),
      b: Math.round(totalB / totalCount),
    },
    count: totalCount,
  };
}

/**
 * Quantize colors using median cut algorithm
 */
function quantizeColors(pixels: Uint8ClampedArray, colorCount: number): { rgb: RGB; count: number }[] {
  // Build color histogram with quantization to reduce unique colors
  const colorMap = new Map<string, { rgb: RGB; count: number }>();
  
  for (let i = 0; i < pixels.length; i += 4) {
    // Quantize to reduce color space (divide by 8 to get 32 levels per channel)
    const r = Math.floor(pixels[i] / 8) * 8;
    const g = Math.floor(pixels[i + 1] / 8) * 8;
    const b = Math.floor(pixels[i + 2] / 8) * 8;
    const a = pixels[i + 3];
    
    // Skip transparent pixels
    if (a < 128) continue;
    
    const key = `${r},${g},${b}`;
    const existing = colorMap.get(key);
    
    if (existing) {
      existing.count++;
    } else {
      colorMap.set(key, { rgb: { r, g, b }, count: 1 });
    }
  }

  // Convert to arrays
  const colors: RGB[] = [];
  const counts: number[] = [];
  
  colorMap.forEach(({ rgb, count }) => {
    colors.push(rgb);
    counts.push(count);
  });

  if (colors.length === 0) {
    return [{ rgb: { r: 128, g: 128, b: 128 }, count: 1 }];
  }

  if (colors.length <= colorCount) {
    return colors.map((rgb, i) => ({ rgb, count: counts[i] }));
  }

  // Median cut algorithm
  const boxes: ColorBox[] = [{ colors, counts }];

  while (boxes.length < colorCount) {
    // Find the box with the largest color range
    let maxRangeIndex = 0;
    let maxRange = 0;

    for (let i = 0; i < boxes.length; i++) {
      if (boxes[i].colors.length > 1) {
        const { range } = getColorRange(boxes[i]);
        if (range > maxRange) {
          maxRange = range;
          maxRangeIndex = i;
        }
      }
    }

    // If no box can be split, break
    if (maxRange === 0 || boxes[maxRangeIndex].colors.length <= 1) {
      break;
    }

    // Split the box
    const [box1, box2] = splitBox(boxes[maxRangeIndex]);
    boxes.splice(maxRangeIndex, 1, box1, box2);
  }

  // Get average color from each box
  return boxes
    .filter(box => box.colors.length > 0)
    .map(box => getAverageColor(box));
}

/**
 * Generate complementary colors
 * Requirement: 11.4
 */
export function generateComplementary(hsl: HSL): string[] {
  const complementaryH = (hsl.h + 180) % 360;
  return [hslToHex(complementaryH, hsl.s, hsl.l)];
}

/**
 * Generate analogous colors
 * Requirement: 11.4
 */
export function generateAnalogous(hsl: HSL): string[] {
  const h1 = (hsl.h + 30) % 360;
  const h2 = (hsl.h - 30 + 360) % 360;
  return [
    hslToHex(h1, hsl.s, hsl.l),
    hslToHex(h2, hsl.s, hsl.l),
  ];
}

/**
 * Generate triadic colors
 */
export function generateTriadic(hsl: HSL): string[] {
  const h1 = (hsl.h + 120) % 360;
  const h2 = (hsl.h + 240) % 360;
  return [
    hslToHex(h1, hsl.s, hsl.l),
    hslToHex(h2, hsl.s, hsl.l),
  ];
}

/**
 * Creates an image element from a file
 */
async function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Extract colors from an image
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */
export async function extractColors(input: ColorExtractionInput): Promise<ColorExtractionResult> {
  const { file, colorCount = DEFAULT_COLOR_COUNT } = input;

  // Validate file
  if (!isValidImageFile(file)) {
    throw new Error('Unsupported image format');
  }

  if (!isValidFileSize(file)) {
    throw new Error('File size exceeds 50MB limit');
  }

  // Clamp color count between 5 and 10
  const clampedColorCount = Math.max(5, Math.min(10, colorCount));

  // Load image
  const img = await createImageFromFile(file);

  // Create canvas and scale down for performance
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Scale down large images for faster processing
  const maxDimension = 200;
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  canvas.width = Math.floor(img.width * scale);
  canvas.height = Math.floor(img.height * scale);

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(img.src);

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const totalPixels = canvas.width * canvas.height;

  // Quantize colors
  const quantizedColors = quantizeColors(pixels, clampedColorCount);

  // Calculate total count for percentages
  const totalCount = quantizedColors.reduce((sum, c) => sum + c.count, 0);

  // Convert to ExtractedColor format and sort by count
  const colors: ExtractedColor[] = quantizedColors
    .map(({ rgb, count }) => ({
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      rgb,
      hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
      percentage: Math.round((count / totalCount) * 100),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Get dominant color
  const dominantColor = colors[0];

  // Generate color suggestions based on dominant color
  const complementary = generateComplementary(dominantColor.hsl);
  const analogous = generateAnalogous(dominantColor.hsl);
  const triadic = generateTriadic(dominantColor.hsl);

  return {
    colors,
    complementary,
    analogous,
    triadic,
    dominantColor,
    totalPixels,
  };
}

/**
 * Format color as CSS variable
 */
export function formatAsCssVariable(color: ExtractedColor, index: number): string {
  return `--color-${index + 1}: ${color.hex};`;
}

/**
 * Generate CSS variables string from colors
 */
export function generateCssVariables(colors: ExtractedColor[]): string {
  const lines = [':root {'];
  colors.forEach((color, index) => {
    lines.push(`  --color-${index + 1}: ${color.hex};`);
    lines.push(`  --color-${index + 1}-rgb: ${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b};`);
  });
  lines.push('}');
  return lines.join('\n');
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get contrast color (black or white) for text on a given background
 */
export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
