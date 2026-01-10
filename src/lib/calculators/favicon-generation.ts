/**
 * Favicon Generation Logic
 * 
 * Implements multi-size favicon generation, ICO file creation, and HTML snippet generation.
 * Requirements: 13.1, 13.2, 13.3, 13.6
 */

export interface FaviconSize {
  size: number;
  name: string;
  description: string;
}

export interface GeneratedFavicon {
  size: number;
  blob: Blob;
  format: 'png' | 'ico';
  filename: string;
}

export interface FaviconInput {
  file: File;
  backgroundColor?: string; // For transparent images
}

export interface FaviconResult {
  favicons: GeneratedFavicon[];
  appleTouchIcon: Blob;
  htmlSnippet: string;
  originalDimensions: { width: number; height: number };
}

/**
 * Standard favicon sizes
 * Requirement: 13.1
 */
export const FAVICON_SIZES: FaviconSize[] = [
  { size: 16, name: 'favicon-16x16.png', description: 'Browser tab (standard)' },
  { size: 32, name: 'favicon-32x32.png', description: 'Browser tab (retina)' },
  { size: 48, name: 'favicon-48x48.png', description: 'Windows site icon' },
  { size: 64, name: 'favicon-64x64.png', description: 'Windows site icon (large)' },
  { size: 128, name: 'favicon-128x128.png', description: 'Chrome Web Store' },
  { size: 256, name: 'favicon-256x256.png', description: 'Opera Speed Dial' },
];

/**
 * Apple Touch Icon size
 * Requirement: 13.5
 */
export const APPLE_TOUCH_ICON_SIZE = 180;

/**
 * Supported input formats
 */
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

/**
 * Maximum file size (10MB for favicons)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
 * Resize image to specific size
 */
async function resizeImage(
  img: HTMLImageElement,
  size: number,
  backgroundColor?: string
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Fill background if specified (for transparent images)
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);
  }

  // Calculate scaling to fit image in square while maintaining aspect ratio
  const scale = Math.min(size / img.width, size / img.height);
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;
  const x = (size - scaledWidth) / 2;
  const y = (size - scaledHeight) / 2;

  // Enable image smoothing for better quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw image centered
  ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create favicon blob'));
        }
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Create ICO file from multiple PNG blobs
 * Requirement: 13.2
 * 
 * ICO format structure:
 * - Header (6 bytes)
 * - Directory entries (16 bytes each)
 * - Image data (PNG format)
 */
async function createIcoFile(pngBlobs: { size: number; blob: Blob }[]): Promise<Blob> {
  // Sort by size (smallest first for ICO format)
  const sortedBlobs = [...pngBlobs].sort((a, b) => a.size - b.size);
  
  // Read all PNG data
  const pngDataArray: ArrayBuffer[] = [];
  for (const { blob } of sortedBlobs) {
    pngDataArray.push(await blob.arrayBuffer());
  }

  // Calculate total size
  const headerSize = 6;
  const directorySize = 16 * sortedBlobs.length;
  const totalImageSize = pngDataArray.reduce((sum, data) => sum + data.byteLength, 0);
  const totalSize = headerSize + directorySize + totalImageSize;

  // Create buffer
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // Write ICO header
  view.setUint16(0, 0, true); // Reserved (must be 0)
  view.setUint16(2, 1, true); // Image type (1 = ICO)
  view.setUint16(4, sortedBlobs.length, true); // Number of images

  // Write directory entries and image data
  let imageOffset = headerSize + directorySize;
  
  for (let i = 0; i < sortedBlobs.length; i++) {
    const { size } = sortedBlobs[i];
    const pngData = pngDataArray[i];
    const directoryOffset = headerSize + (i * 16);

    // Directory entry
    view.setUint8(directoryOffset + 0, size < 256 ? size : 0); // Width (0 = 256)
    view.setUint8(directoryOffset + 1, size < 256 ? size : 0); // Height (0 = 256)
    view.setUint8(directoryOffset + 2, 0); // Color palette (0 = no palette)
    view.setUint8(directoryOffset + 3, 0); // Reserved
    view.setUint16(directoryOffset + 4, 1, true); // Color planes
    view.setUint16(directoryOffset + 6, 32, true); // Bits per pixel
    view.setUint32(directoryOffset + 8, pngData.byteLength, true); // Image size
    view.setUint32(directoryOffset + 12, imageOffset, true); // Image offset

    // Copy PNG data
    uint8.set(new Uint8Array(pngData), imageOffset);
    imageOffset += pngData.byteLength;
  }

  return new Blob([buffer], { type: 'image/x-icon' });
}

/**
 * Generate HTML snippet for favicon implementation
 * Requirement: 13.6
 */
export function generateHtmlSnippet(): string {
  return `<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- For Android Chrome -->
<link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png">

<!-- Web App Manifest (optional) -->
<link rel="manifest" href="/site.webmanifest">

<!-- Theme Color -->
<meta name="theme-color" content="#ffffff">`;
}

/**
 * Generate all favicon sizes
 * Requirements: 13.1, 13.2, 13.3, 13.5
 */
export async function generateFavicons(input: FaviconInput): Promise<FaviconResult> {
  const { file, backgroundColor } = input;

  // Validate file
  if (!isValidImageFile(file)) {
    throw new Error('Unsupported image format. Please use PNG, JPG, GIF, WebP, or SVG.');
  }

  if (!isValidFileSize(file)) {
    throw new Error('File size exceeds 10MB limit');
  }

  // Load image
  const img = await createImageFromFile(file);
  const originalDimensions = { width: img.width, height: img.height };

  // Generate all PNG favicons
  const favicons: GeneratedFavicon[] = [];
  const icoSizes: { size: number; blob: Blob }[] = [];

  for (const { size, name } of FAVICON_SIZES) {
    const blob = await resizeImage(img, size, backgroundColor);
    favicons.push({
      size,
      blob,
      format: 'png',
      filename: name,
    });

    // Collect sizes for ICO file (16, 32, 48)
    if (size <= 48) {
      icoSizes.push({ size, blob });
    }
  }

  // Generate ICO file
  const icoBlob = await createIcoFile(icoSizes);
  favicons.unshift({
    size: 0, // ICO contains multiple sizes
    blob: icoBlob,
    format: 'ico',
    filename: 'favicon.ico',
  });

  // Generate Apple Touch Icon (180x180)
  const appleTouchIcon = await resizeImage(img, APPLE_TOUCH_ICON_SIZE, backgroundColor);
  favicons.push({
    size: APPLE_TOUCH_ICON_SIZE,
    blob: appleTouchIcon,
    format: 'png',
    filename: 'apple-touch-icon.png',
  });

  // Generate Android Chrome icons
  const androidSizes = [192, 512];
  for (const size of androidSizes) {
    const blob = await resizeImage(img, size, backgroundColor);
    favicons.push({
      size,
      blob,
      format: 'png',
      filename: `android-chrome-${size}x${size}.png`,
    });
  }

  // Clean up
  URL.revokeObjectURL(img.src);

  // Generate HTML snippet
  const htmlSnippet = generateHtmlSnippet();

  return {
    favicons,
    appleTouchIcon,
    htmlSnippet,
    originalDimensions,
  };
}

/**
 * Creates a ZIP file from all generated favicons
 */
export async function createZipFromFavicons(result: FaviconResult): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Add all favicons
  for (const favicon of result.favicons) {
    zip.file(favicon.filename, favicon.blob);
  }

  // Add HTML snippet as readme
  const readme = `# Favicon Files

## How to Use

1. Copy all files to your website's root directory (or public folder)
2. Add the following HTML to your <head> section:

${result.htmlSnippet}

## Files Included

${result.favicons.map(f => `- ${f.filename}${f.size ? ` (${f.size}x${f.size})` : ' (multi-size)'}`).join('\n')}

## Generated by Micro Tools
`;

  zip.file('README.md', readme);

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Download a single favicon
 */
export function downloadFavicon(favicon: GeneratedFavicon): void {
  const url = URL.createObjectURL(favicon.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = favicon.filename;
  link.click();
  URL.revokeObjectURL(url);
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
