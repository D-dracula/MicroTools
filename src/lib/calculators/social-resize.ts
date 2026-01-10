/**
 * Social Media Resize Logic
 * 
 * Implements platform-specific image resizing with crop position calculation.
 * Requirements: 10.2, 10.3, 10.4, 10.5
 */

// Platform types
export type InstagramPreset = 'instagram-feed' | 'instagram-story' | 'instagram-landscape';
export type SnapchatPreset = 'snapchat-snap' | 'snapchat-story';
export type TwitterPreset = 'twitter-post' | 'twitter-header';
export type SocialPlatform = InstagramPreset | SnapchatPreset | TwitterPreset;

export type CropPosition = 'center' | 'top' | 'bottom' | 'custom';

export interface PlatformSize {
  width: number;
  height: number;
}

export interface CustomPosition {
  x: number; // 0-1 representing percentage from left
  y: number; // 0-1 representing percentage from top
}

export interface SocialResizeInput {
  file: File;
  platforms: SocialPlatform[];
  cropPosition: CropPosition;
  customPosition?: CustomPosition;
}

export interface ResizedImage {
  platform: SocialPlatform;
  dimensions: PlatformSize;
  blob: Blob;
  filename: string;
}

export interface SocialResizeResult {
  resizedImages: ResizedImage[];
  originalDimensions: PlatformSize;
}

export interface BatchResizeResult {
  results: SocialResizeResult[];
  totalImages: number;
}

export interface CropArea {
  sx: number; // Source x
  sy: number; // Source y
  sw: number; // Source width
  sh: number; // Source height
}

/**
 * Platform sizes for social media
 * Requirements: 10.2, 10.3, 10.4
 */
export const PLATFORM_SIZES: Record<SocialPlatform, PlatformSize> = {
  // Instagram presets (Requirement 10.2)
  'instagram-feed': { width: 1080, height: 1080 },
  'instagram-story': { width: 1080, height: 1920 },
  'instagram-landscape': { width: 1080, height: 566 },
  // Snapchat presets (Requirement 10.3)
  'snapchat-snap': { width: 1080, height: 1920 },
  'snapchat-story': { width: 1080, height: 1920 },
  // Twitter/X presets (Requirement 10.4)
  'twitter-post': { width: 1200, height: 675 },
  'twitter-header': { width: 1500, height: 500 },
};

/**
 * Platform labels for UI display
 */
export const PLATFORM_LABELS: Record<SocialPlatform, { en: string; ar: string }> = {
  'instagram-feed': { en: 'Instagram Feed (1080×1080)', ar: 'إنستغرام فيد (1080×1080)' },
  'instagram-story': { en: 'Instagram Story (1080×1920)', ar: 'إنستغرام ستوري (1080×1920)' },
  'instagram-landscape': { en: 'Instagram Landscape (1080×566)', ar: 'إنستغرام أفقي (1080×566)' },
  'snapchat-snap': { en: 'Snapchat Snap (1080×1920)', ar: 'سناب شات (1080×1920)' },
  'snapchat-story': { en: 'Snapchat Story (1080×1920)', ar: 'سناب شات ستوري (1080×1920)' },
  'twitter-post': { en: 'Twitter/X Post (1200×675)', ar: 'تويتر/X منشور (1200×675)' },
  'twitter-header': { en: 'Twitter/X Header (1500×500)', ar: 'تويتر/X غلاف (1500×500)' },
};

/**
 * Crop position labels for UI display
 */
export const CROP_POSITION_LABELS: Record<CropPosition, { en: string; ar: string }> = {
  center: { en: 'Center', ar: 'وسط' },
  top: { en: 'Top', ar: 'أعلى' },
  bottom: { en: 'Bottom', ar: 'أسفل' },
  custom: { en: 'Custom', ar: 'مخصص' },
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
 * Output quality for JPEG
 */
export const OUTPUT_QUALITY = 0.92;

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
 * Calculates the crop area based on source and target dimensions and crop position
 * Requirement: 10.5
 * 
 * @param srcWidth - Source image width
 * @param srcHeight - Source image height
 * @param targetWidth - Target output width
 * @param targetHeight - Target output height
 * @param cropPosition - Position to crop from (center/top/bottom/custom)
 * @param customPosition - Custom position coordinates (0-1 range)
 * @returns CropArea with source coordinates and dimensions
 */
export function calculateCropArea(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number,
  cropPosition: CropPosition,
  customPosition?: CustomPosition
): CropArea {
  const srcAspect = srcWidth / srcHeight;
  const targetAspect = targetWidth / targetHeight;

  let sw: number;
  let sh: number;
  let sx: number;
  let sy: number;

  if (srcAspect > targetAspect) {
    // Source is wider than target - crop horizontally
    sh = srcHeight;
    sw = srcHeight * targetAspect;
  } else {
    // Source is taller than target - crop vertically
    sw = srcWidth;
    sh = srcWidth / targetAspect;
  }

  // Calculate position based on crop setting
  switch (cropPosition) {
    case 'top':
      sx = (srcWidth - sw) / 2; // Center horizontally
      sy = 0; // Align to top
      break;
    case 'bottom':
      sx = (srcWidth - sw) / 2; // Center horizontally
      sy = srcHeight - sh; // Align to bottom
      break;
    case 'custom':
      if (customPosition) {
        // Custom position: x and y are 0-1 representing percentage
        const maxSx = srcWidth - sw;
        const maxSy = srcHeight - sh;
        sx = Math.max(0, Math.min(maxSx, customPosition.x * maxSx));
        sy = Math.max(0, Math.min(maxSy, customPosition.y * maxSy));
      } else {
        // Fallback to center if no custom position provided
        sx = (srcWidth - sw) / 2;
        sy = (srcHeight - sh) / 2;
      }
      break;
    case 'center':
    default:
      sx = (srcWidth - sw) / 2;
      sy = (srcHeight - sh) / 2;
      break;
  }

  return {
    sx: Math.round(sx),
    sy: Math.round(sy),
    sw: Math.round(sw),
    sh: Math.round(sh),
  };
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
 * Generates a filename for the resized image
 */
function generateFilename(originalName: string, platform: SocialPlatform): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  return `${baseName}_${platform}.jpg`;
}

/**
 * Resizes a single image for a specific platform
 */
async function resizeForPlatform(
  img: HTMLImageElement,
  platform: SocialPlatform,
  cropPosition: CropPosition,
  customPosition?: CustomPosition,
  originalFilename?: string
): Promise<ResizedImage> {
  const targetSize = PLATFORM_SIZES[platform];
  
  const canvas = document.createElement('canvas');
  canvas.width = targetSize.width;
  canvas.height = targetSize.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Calculate crop area
  const { sx, sy, sw, sh } = calculateCropArea(
    img.width,
    img.height,
    targetSize.width,
    targetSize.height,
    cropPosition,
    customPosition
  );

  // Draw the cropped and resized image
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetSize.width, targetSize.height);

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      },
      'image/jpeg',
      OUTPUT_QUALITY
    );
  });

  return {
    platform,
    dimensions: targetSize,
    blob,
    filename: generateFilename(originalFilename || 'image', platform),
  };
}

/**
 * Resizes an image for multiple social media platforms
 * Requirements: 10.2, 10.3, 10.4, 10.5
 */
export async function resizeForSocialMedia(input: SocialResizeInput): Promise<SocialResizeResult> {
  const { file, platforms, cropPosition, customPosition } = input;

  // Validate file
  if (!isValidImageFile(file)) {
    throw new Error('Unsupported image format');
  }

  if (!isValidFileSize(file)) {
    throw new Error('File size exceeds 50MB limit');
  }

  if (platforms.length === 0) {
    throw new Error('At least one platform must be selected');
  }

  // Load image
  const img = await createImageFromFile(file);
  const originalDimensions = { width: img.width, height: img.height };

  // Resize for each platform
  const resizedImages: ResizedImage[] = [];
  
  for (const platform of platforms) {
    const resized = await resizeForPlatform(
      img,
      platform,
      cropPosition,
      customPosition,
      file.name
    );
    resizedImages.push(resized);
  }

  // Clean up object URL
  URL.revokeObjectURL(img.src);

  return {
    resizedImages,
    originalDimensions,
  };
}

/**
 * Batch resize multiple images for social media platforms
 * Requirement: 10.6
 */
export async function batchResizeForSocialMedia(
  files: File[],
  platforms: SocialPlatform[],
  cropPosition: CropPosition,
  customPosition?: CustomPosition,
  onProgress?: (completed: number, total: number) => void
): Promise<BatchResizeResult> {
  const results: SocialResizeResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const result = await resizeForSocialMedia({
        file,
        platforms,
        cropPosition,
        customPosition,
      });
      results.push(result);
    } catch (error) {
      console.error(`Failed to resize ${file.name}:`, error);
    }

    onProgress?.(i + 1, files.length);
  }

  return {
    results,
    totalImages: results.reduce((sum, r) => sum + r.resizedImages.length, 0),
  };
}

/**
 * Creates a ZIP file from resized images organized by platform
 * Requirement: 10.10
 */
export async function createZipFromResults(results: SocialResizeResult[]): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Organize by platform
  const platformFolders: Record<string, typeof zip> = {};

  for (const result of results) {
    for (const image of result.resizedImages) {
      // Create folder for platform if it doesn't exist
      if (!platformFolders[image.platform]) {
        platformFolders[image.platform] = zip.folder(image.platform)!;
      }
      
      platformFolders[image.platform].file(image.filename, image.blob);
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Downloads a single resized image
 */
export function downloadImage(image: ResizedImage): void {
  const url = URL.createObjectURL(image.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = image.filename;
  link.click();
  URL.revokeObjectURL(url);
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
 * Gets all available platforms grouped by social network
 */
export function getPlatformsByNetwork(): Record<string, SocialPlatform[]> {
  return {
    instagram: ['instagram-feed', 'instagram-story', 'instagram-landscape'],
    snapchat: ['snapchat-snap', 'snapchat-story'],
    twitter: ['twitter-post', 'twitter-header'],
  };
}

/**
 * Gets the aspect ratio string for a platform
 */
export function getAspectRatioString(platform: SocialPlatform): string {
  const size = PLATFORM_SIZES[platform];
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(size.width, size.height);
  return `${size.width / divisor}:${size.height / divisor}`;
}
