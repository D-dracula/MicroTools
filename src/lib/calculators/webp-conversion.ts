/**
 * WebP Conversion Logic
 * 
 * Implements Canvas-based WebP conversion with quality settings.
 * Requirements: 8.1, 8.2, 8.3
 */

export type WebPQuality = 'low' | 'medium' | 'high' | 'lossless';

export interface WebPConversionInput {
  file: File;
  quality: WebPQuality;
  preserveMetadata?: boolean;
}

export interface WebPConversionResult {
  originalSize: number;
  convertedSize: number;
  savingsPercentage: number;
  convertedBlob: Blob;
  dimensions: { width: number; height: number };
  originalFormat: string;
  filename: string;
}

export interface BatchConversionResult {
  results: WebPConversionResult[];
  totalOriginalSize: number;
  totalConvertedSize: number;
  totalSavingsPercentage: number;
}

/**
 * Quality settings mapping to Canvas quality values (0-1)
 * Requirement: 8.2
 */
export const QUALITY_SETTINGS: Record<WebPQuality, number> = {
  low: 0.6,
  medium: 0.8,
  high: 0.92,
  lossless: 1.0,
};

/**
 * Quality labels for UI display
 */
export const QUALITY_LABELS: Record<WebPQuality, { en: string; ar: string }> = {
  low: { en: 'Low (60%)', ar: 'منخفضة (60%)' },
  medium: { en: 'Medium (80%)', ar: 'متوسطة (80%)' },
  high: { en: 'High (92%)', ar: 'عالية (92%)' },
  lossless: { en: 'Lossless (100%)', ar: 'بدون فقدان (100%)' },
};

/**
 * Supported input formats
 */
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];

/**
 * Maximum file size (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

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
 * Gets the original format from file type
 */
export function getOriginalFormat(file: File): string {
  const formatMap: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/gif': 'GIF',
    'image/webp': 'WebP',
    'image/bmp': 'BMP',
  };
  return formatMap[file.type] || 'Unknown';
}

/**
 * Creates an image bitmap from a file
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
 * Converts a single image to WebP format
 * Requirements: 8.1, 8.2, 8.3
 */
export async function convertToWebP(input: WebPConversionInput): Promise<WebPConversionResult> {
  const { file, quality } = input;

  // Validate file
  if (!isValidImageFile(file)) {
    throw new Error('Unsupported image format');
  }

  if (!isValidFileSize(file)) {
    throw new Error('File size exceeds 50MB limit');
  }

  const qualityValue = QUALITY_SETTINGS[quality];

  // Create image element
  const img = await createImageFromFile(file);

  // Create canvas and draw image
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0);

  // Clean up object URL
  URL.revokeObjectURL(img.src);

  // Convert to WebP
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error('Failed to convert image to WebP'));
        }
      },
      'image/webp',
      qualityValue
    );
  });

  // Calculate savings
  const savingsPercentage = Math.round((1 - blob.size / file.size) * 100);

  // Generate filename
  const originalName = file.name.replace(/\.[^/.]+$/, '');
  const filename = `${originalName}.webp`;

  return {
    originalSize: file.size,
    convertedSize: blob.size,
    savingsPercentage: Math.max(0, savingsPercentage), // Ensure non-negative
    convertedBlob: blob,
    dimensions: { width: img.width, height: img.height },
    originalFormat: getOriginalFormat(file),
    filename,
  };
}

/**
 * Converts multiple images to WebP format (batch conversion)
 * Requirement: 8.4
 */
export async function batchConvertToWebP(
  files: File[],
  quality: WebPQuality,
  onProgress?: (completed: number, total: number) => void
): Promise<BatchConversionResult> {
  const results: WebPConversionResult[] = [];
  let totalOriginalSize = 0;
  let totalConvertedSize = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const result = await convertToWebP({ file, quality });
      results.push(result);
      totalOriginalSize += result.originalSize;
      totalConvertedSize += result.convertedSize;
    } catch (error) {
      // Skip failed conversions but log the error
      console.error(`Failed to convert ${file.name}:`, error);
    }

    onProgress?.(i + 1, files.length);
  }

  const totalSavingsPercentage = totalOriginalSize > 0
    ? Math.round((1 - totalConvertedSize / totalOriginalSize) * 100)
    : 0;

  return {
    results,
    totalOriginalSize,
    totalConvertedSize,
    totalSavingsPercentage: Math.max(0, totalSavingsPercentage),
  };
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Creates a download link for a blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Creates a ZIP file from multiple blobs (requires JSZip library)
 * Requirement: 8.10
 */
export async function createZipFromResults(results: WebPConversionResult[]): Promise<Blob> {
  // Dynamic import of JSZip
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  results.forEach((result) => {
    zip.file(result.filename, result.convertedBlob);
  });

  return zip.generateAsync({ type: 'blob' });
}
