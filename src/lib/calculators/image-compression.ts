/**
 * Image Compression Logic
 * 
 * Implements smart compression with quality analysis and target size mode.
 * Requirements: 9.1, 9.2, 9.5
 */

export type CompressionMode = 'quality' | 'target-size';

export interface ImageCompressionInput {
  file: File;
  mode: CompressionMode;
  quality?: number; // 0-100, used when mode is 'quality'
  targetSize?: number; // in KB, used when mode is 'target-size'
  preserveTransparency?: boolean;
}

export interface ImageCompressionResult {
  originalSize: number;
  compressedSize: number;
  savingsPercentage: number;
  compressedBlob: Blob;
  dimensions: { width: number; height: number };
  qualityUsed: number;
  qualityWarning: boolean;
  format: string;
  filename: string;
}

export interface BatchCompressionResult {
  results: ImageCompressionResult[];
  totalOriginalSize: number;
  totalCompressedSize: number;
  totalSavingsPercentage: number;
  failedCount: number;
}

export interface QualityAnalysis {
  suggestedQuality: number;
  estimatedSize: number;
  category: 'simple' | 'moderate' | 'complex';
  recommendation: string;
}

/**
 * Quality presets for quick selection
 */
export const QUALITY_PRESETS = {
  low: 50,
  medium: 70,
  high: 85,
  maximum: 95,
} as const;

/**
 * Quality labels for UI display
 */
export const QUALITY_LABELS: Record<keyof typeof QUALITY_PRESETS, { en: string; ar: string }> = {
  low: { en: 'Low (50%)', ar: 'منخفضة (50%)' },
  medium: { en: 'Medium (70%)', ar: 'متوسطة (70%)' },
  high: { en: 'High (85%)', ar: 'عالية (85%)' },
  maximum: { en: 'Maximum (95%)', ar: 'قصوى (95%)' },
};

/**
 * Supported input formats
 */
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];

/**
 * Maximum file size (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Quality threshold below which a warning is shown
 * Requirement: 9.5
 */
export const QUALITY_WARNING_THRESHOLD = 40;

/**
 * Optimal file size range for e-commerce (in KB)
 */
export const OPTIMAL_SIZE_RANGE = {
  min: 50,
  max: 150,
};

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
 * Analyzes image complexity to suggest optimal compression level
 * Requirement: 9.1
 */
export async function analyzeImageQuality(file: File): Promise<QualityAnalysis> {
  const img = await createImageFromFile(file);
  
  // Create a small canvas for analysis
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, 100 / Math.max(img.width, img.height));
  canvas.width = Math.floor(img.width * scale);
  canvas.height = Math.floor(img.height * scale);
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(img.src);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  
  // Calculate color variance to estimate complexity
  let totalVariance = 0;
  const uniqueColors = new Set<string>();
  
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    // Track unique colors (quantized to reduce memory)
    const colorKey = `${Math.floor(r / 16)}-${Math.floor(g / 16)}-${Math.floor(b / 16)}`;
    uniqueColors.add(colorKey);
    
    // Calculate local variance with neighbors
    if (i > 4) {
      const prevR = pixels[i - 4];
      const prevG = pixels[i - 3];
      const prevB = pixels[i - 2];
      totalVariance += Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
    }
  }
  
  const pixelCount = pixels.length / 4;
  const avgVariance = totalVariance / pixelCount;
  const colorDiversity = uniqueColors.size / (16 * 16 * 16); // Normalized 0-1
  
  // Determine complexity category
  let category: 'simple' | 'moderate' | 'complex';
  let suggestedQuality: number;
  let recommendation: string;
  
  if (avgVariance < 10 && colorDiversity < 0.1) {
    category = 'simple';
    suggestedQuality = 60;
    recommendation = 'Simple image with few colors. Can be compressed heavily.';
  } else if (avgVariance < 30 && colorDiversity < 0.3) {
    category = 'moderate';
    suggestedQuality = 75;
    recommendation = 'Moderate complexity. Balanced compression recommended.';
  } else {
    category = 'complex';
    suggestedQuality = 85;
    recommendation = 'Complex image with many details. Use higher quality.';
  }
  
  // Estimate compressed size based on original size and suggested quality
  const compressionRatio = 0.3 + (suggestedQuality / 100) * 0.5;
  const estimatedSize = Math.round((file.size * compressionRatio) / 1024);
  
  return {
    suggestedQuality,
    estimatedSize,
    category,
    recommendation,
  };
}

/**
 * Compresses an image to a target file size using binary search
 * Requirement: 9.2
 */
async function compressToTargetSize(
  img: HTMLImageElement,
  targetSizeKB: number,
  preserveTransparency: boolean,
  originalFormat: string
): Promise<{ blob: Blob; qualityUsed: number }> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Determine output format
  const hasTransparency = preserveTransparency && (originalFormat === 'image/png' || originalFormat === 'image/webp');
  const outputFormat = hasTransparency ? 'image/png' : 'image/jpeg';
  
  // For PNG with transparency, we can't use quality parameter effectively
  // So we'll use WebP if available, or just return the PNG
  if (hasTransparency) {
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
        'image/webp',
        0.8
      );
    });
    return { blob, qualityUsed: 80 };
  }
  
  // Fill with white background for JPEG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  
  const targetSizeBytes = targetSizeKB * 1024;
  
  // Binary search for optimal quality
  let minQuality = 10;
  let maxQuality = 100;
  let bestBlob: Blob | null = null;
  let bestQuality = 70;
  
  // Maximum iterations for binary search
  const maxIterations = 10;
  
  for (let i = 0; i < maxIterations; i++) {
    const quality = Math.floor((minQuality + maxQuality) / 2);
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
        outputFormat,
        quality / 100
      );
    });
    
    if (blob.size <= targetSizeBytes) {
      bestBlob = blob;
      bestQuality = quality;
      minQuality = quality + 1;
    } else {
      maxQuality = quality - 1;
    }
    
    // If we're close enough, stop
    if (Math.abs(blob.size - targetSizeBytes) < targetSizeBytes * 0.05) {
      bestBlob = blob;
      bestQuality = quality;
      break;
    }
  }
  
  // If no blob found within target, use lowest quality
  if (!bestBlob) {
    bestBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
        outputFormat,
        minQuality / 100
      );
    });
    bestQuality = minQuality;
  }
  
  return { blob: bestBlob, qualityUsed: bestQuality };
}

/**
 * Compresses an image with a specific quality level
 */
async function compressWithQuality(
  img: HTMLImageElement,
  quality: number,
  preserveTransparency: boolean,
  originalFormat: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Determine output format based on transparency needs
  // Requirement: 9.6 - Preserve transparency for PNG images
  const hasTransparency = preserveTransparency && (originalFormat === 'image/png' || originalFormat === 'image/webp');
  
  if (hasTransparency) {
    // Use WebP for transparent images (better compression than PNG)
    ctx.drawImage(img, 0, 0);
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
        'image/webp',
        quality / 100
      );
    });
  }
  
  // For non-transparent images, use JPEG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
      'image/jpeg',
      quality / 100
    );
  });
}

/**
 * Compresses a single image
 * Requirements: 9.1, 9.2, 9.5
 */
export async function compressImage(input: ImageCompressionInput): Promise<ImageCompressionResult> {
  const { file, mode, quality = 75, targetSize, preserveTransparency = true } = input;
  
  // Validate file
  if (!isValidImageFile(file)) {
    throw new Error('Unsupported image format');
  }
  
  if (!isValidFileSize(file)) {
    throw new Error('File size exceeds 50MB limit');
  }
  
  // Create image element
  const img = await createImageFromFile(file);
  
  let compressedBlob: Blob;
  let qualityUsed: number;
  
  if (mode === 'target-size' && targetSize) {
    // Compress to target size
    const result = await compressToTargetSize(img, targetSize, preserveTransparency, file.type);
    compressedBlob = result.blob;
    qualityUsed = result.qualityUsed;
  } else {
    // Compress with specified quality
    compressedBlob = await compressWithQuality(img, quality, preserveTransparency, file.type);
    qualityUsed = quality;
  }
  
  // Clean up
  URL.revokeObjectURL(img.src);
  
  // Calculate savings
  const savingsPercentage = Math.round((1 - compressedBlob.size / file.size) * 100);
  
  // Determine if quality warning should be shown
  // Requirement: 9.5
  const qualityWarning = qualityUsed < QUALITY_WARNING_THRESHOLD;
  
  // Determine output format
  const format = compressedBlob.type === 'image/webp' ? 'webp' : 'jpeg';
  
  // Generate filename
  const originalName = file.name.replace(/\.[^/.]+$/, '');
  const filename = `${originalName}_compressed.${format}`;
  
  return {
    originalSize: file.size,
    compressedSize: compressedBlob.size,
    savingsPercentage: Math.max(0, savingsPercentage),
    compressedBlob,
    dimensions: { width: img.width, height: img.height },
    qualityUsed,
    qualityWarning,
    format,
    filename,
  };
}

/**
 * Compresses multiple images (batch compression)
 * Requirement: 9.4
 */
export async function batchCompressImages(
  files: File[],
  mode: CompressionMode,
  options: { quality?: number; targetSize?: number; preserveTransparency?: boolean },
  onProgress?: (completed: number, total: number) => void
): Promise<BatchCompressionResult> {
  const results: ImageCompressionResult[] = [];
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;
  let failedCount = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const result = await compressImage({
        file,
        mode,
        quality: options.quality,
        targetSize: options.targetSize,
        preserveTransparency: options.preserveTransparency,
      });
      
      results.push(result);
      totalOriginalSize += result.originalSize;
      totalCompressedSize += result.compressedSize;
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error);
      failedCount++;
    }
    
    onProgress?.(i + 1, files.length);
  }
  
  const totalSavingsPercentage = totalOriginalSize > 0
    ? Math.round((1 - totalCompressedSize / totalOriginalSize) * 100)
    : 0;
  
  return {
    results,
    totalOriginalSize,
    totalCompressedSize,
    totalSavingsPercentage: Math.max(0, totalSavingsPercentage),
    failedCount,
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
 * Downloads a compressed image
 */
export function downloadCompressedImage(result: ImageCompressionResult): void {
  const url = URL.createObjectURL(result.compressedBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Creates a ZIP file from batch compression results
 */
export async function createZipFromResults(results: ImageCompressionResult[]): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  
  results.forEach((result) => {
    zip.file(result.filename, result.compressedBlob);
  });
  
  return zip.generateAsync({ type: 'blob' });
}

/**
 * Checks if file size is within optimal range for e-commerce
 */
export function isOptimalSize(sizeInBytes: number): boolean {
  const sizeInKB = sizeInBytes / 1024;
  return sizeInKB >= OPTIMAL_SIZE_RANGE.min && sizeInKB <= OPTIMAL_SIZE_RANGE.max;
}

/**
 * Gets size recommendation based on current file size
 */
export function getSizeRecommendation(sizeInBytes: number): { status: 'optimal' | 'too-small' | 'too-large'; message: string } {
  const sizeInKB = sizeInBytes / 1024;
  
  if (sizeInKB < OPTIMAL_SIZE_RANGE.min) {
    return {
      status: 'too-small',
      message: `File is smaller than recommended (${OPTIMAL_SIZE_RANGE.min}KB). Quality may be too low.`,
    };
  }
  
  if (sizeInKB > OPTIMAL_SIZE_RANGE.max) {
    return {
      status: 'too-large',
      message: `File is larger than recommended (${OPTIMAL_SIZE_RANGE.max}KB). Consider more compression.`,
    };
  }
  
  return {
    status: 'optimal',
    message: `File size is optimal for e-commerce (${OPTIMAL_SIZE_RANGE.min}-${OPTIMAL_SIZE_RANGE.max}KB).`,
  };
}
