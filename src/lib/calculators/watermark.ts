/**
 * Watermark Logic
 * 
 * Implements watermark positioning, opacity/size adjustment, and text watermark rendering.
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

export type WatermarkPosition = 
  | 'top-left' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-right' 
  | 'center' 
  | 'tiled';

export type WatermarkType = 'image' | 'text';

export interface FontSettings {
  family: string;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
}

export interface WatermarkInput {
  file: File;
  watermarkType: WatermarkType;
  watermarkImage?: File;
  watermarkText?: string;
  position: WatermarkPosition;
  opacity: number; // 0-100
  size: number; // percentage of image (5-50)
  rotation: number; // degrees
  fontSettings?: FontSettings;
  padding?: number; // pixels from edge
}

export interface WatermarkResult {
  watermarkedBlob: Blob;
  dimensions: { width: number; height: number };
  filename: string;
  positionWarning?: boolean;
}

export interface BatchWatermarkResult {
  results: WatermarkResult[];
  successCount: number;
  failedCount: number;
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
 * Default font settings
 */
export const DEFAULT_FONT_SETTINGS: FontSettings = {
  family: 'Arial',
  size: 24,
  color: '#FFFFFF',
  bold: false,
  italic: false,
};

/**
 * Available font families
 */
export const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Impact',
];

/**
 * Position labels for UI
 */
export const POSITION_LABELS: Record<WatermarkPosition, { en: string; ar: string }> = {
  'top-left': { en: 'Top Left', ar: 'أعلى اليسار' },
  'top-right': { en: 'Top Right', ar: 'أعلى اليمين' },
  'bottom-left': { en: 'Bottom Left', ar: 'أسفل اليسار' },
  'bottom-right': { en: 'Bottom Right', ar: 'أسفل اليمين' },
  'center': { en: 'Center', ar: 'الوسط' },
  'tiled': { en: 'Tiled', ar: 'متكرر' },
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
 * Calculate watermark position coordinates
 * Requirement: 12.2
 */
function calculatePosition(
  canvasWidth: number,
  canvasHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  position: WatermarkPosition,
  padding: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];

  switch (position) {
    case 'top-left':
      positions.push({ x: padding, y: padding });
      break;
    case 'top-right':
      positions.push({ x: canvasWidth - watermarkWidth - padding, y: padding });
      break;
    case 'bottom-left':
      positions.push({ x: padding, y: canvasHeight - watermarkHeight - padding });
      break;
    case 'bottom-right':
      positions.push({
        x: canvasWidth - watermarkWidth - padding,
        y: canvasHeight - watermarkHeight - padding,
      });
      break;
    case 'center':
      positions.push({
        x: (canvasWidth - watermarkWidth) / 2,
        y: (canvasHeight - watermarkHeight) / 2,
      });
      break;
    case 'tiled':
      // Create a grid of watermarks
      const spacingX = watermarkWidth * 2;
      const spacingY = watermarkHeight * 2;
      
      for (let y = padding; y < canvasHeight; y += spacingY) {
        for (let x = padding; x < canvasWidth; x += spacingX) {
          positions.push({ x, y });
        }
      }
      break;
  }

  return positions;
}

/**
 * Check if watermark might obscure important content
 * Requirement: 12.6
 */
function checkPositionWarning(
  canvasWidth: number,
  canvasHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  position: WatermarkPosition
): boolean {
  // Warn if watermark covers more than 30% of the image in center position
  if (position === 'center') {
    const watermarkArea = watermarkWidth * watermarkHeight;
    const imageArea = canvasWidth * canvasHeight;
    return watermarkArea / imageArea > 0.3;
  }
  
  // Warn if tiled watermarks are too dense
  if (position === 'tiled') {
    const watermarkArea = watermarkWidth * watermarkHeight;
    const imageArea = canvasWidth * canvasHeight;
    // Estimate coverage (roughly 25% of image covered by tiled watermarks)
    return watermarkArea / imageArea > 0.05;
  }
  
  return false;
}


/**
 * Draw text watermark on canvas
 * Requirement: 12.4
 */
function drawTextWatermark(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSettings: FontSettings,
  opacity: number,
  rotation: number,
  size: number,
  canvasWidth: number
): { width: number; height: number } {
  ctx.save();
  
  // Calculate font size based on canvas width and size percentage
  const fontSize = Math.max(12, (canvasWidth * size) / 100 * 0.5);
  
  // Set font
  const fontStyle = fontSettings.italic ? 'italic ' : '';
  const fontWeight = fontSettings.bold ? 'bold ' : '';
  ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${fontSettings.family}`;
  
  // Measure text
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize;
  
  // Set opacity
  ctx.globalAlpha = opacity / 100;
  
  // Translate and rotate
  ctx.translate(x + textWidth / 2, y + textHeight / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  
  // Draw text with shadow for visibility
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  ctx.fillStyle = fontSettings.color;
  ctx.fillText(text, -textWidth / 2, textHeight / 4);
  
  ctx.restore();
  
  return { width: textWidth, height: textHeight };
}

/**
 * Draw image watermark on canvas
 * Requirement: 12.1
 */
function drawImageWatermark(
  ctx: CanvasRenderingContext2D,
  watermarkImg: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  opacity: number,
  rotation: number
): void {
  ctx.save();
  
  // Set opacity
  ctx.globalAlpha = opacity / 100;
  
  // Translate and rotate
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  
  // Draw watermark
  ctx.drawImage(watermarkImg, -width / 2, -height / 2, width, height);
  
  ctx.restore();
}

/**
 * Apply watermark to a single image
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
export async function applyWatermark(input: WatermarkInput): Promise<WatermarkResult> {
  const {
    file,
    watermarkType,
    watermarkImage,
    watermarkText,
    position,
    opacity,
    size,
    rotation,
    fontSettings = DEFAULT_FONT_SETTINGS,
    padding = 20,
  } = input;

  // Validate main image
  if (!isValidImageFile(file)) {
    throw new Error('Unsupported image format');
  }

  if (!isValidFileSize(file)) {
    throw new Error('File size exceeds 50MB limit');
  }

  // Validate watermark
  if (watermarkType === 'image' && !watermarkImage) {
    throw new Error('Watermark image is required');
  }

  if (watermarkType === 'text' && !watermarkText) {
    throw new Error('Watermark text is required');
  }

  // Load main image
  const mainImg = await createImageFromFile(file);

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = mainImg.width;
  canvas.height = mainImg.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw main image
  ctx.drawImage(mainImg, 0, 0);
  URL.revokeObjectURL(mainImg.src);

  let watermarkWidth: number;
  let watermarkHeight: number;
  let watermarkImg: HTMLImageElement | null = null;

  if (watermarkType === 'image' && watermarkImage) {
    // Load watermark image
    watermarkImg = await createImageFromFile(watermarkImage);
    
    // Calculate watermark size based on percentage
    const scaleFactor = (size / 100) * Math.min(canvas.width, canvas.height) / Math.max(watermarkImg.width, watermarkImg.height);
    watermarkWidth = watermarkImg.width * scaleFactor;
    watermarkHeight = watermarkImg.height * scaleFactor;
    
    URL.revokeObjectURL(watermarkImg.src);
  } else {
    // For text, estimate size
    const fontSize = Math.max(12, (canvas.width * size) / 100 * 0.5);
    ctx.font = `${fontSize}px ${fontSettings.family}`;
    const metrics = ctx.measureText(watermarkText || '');
    watermarkWidth = metrics.width;
    watermarkHeight = fontSize;
  }

  // Calculate positions
  const positions = calculatePosition(
    canvas.width,
    canvas.height,
    watermarkWidth,
    watermarkHeight,
    position,
    padding
  );

  // Check for position warning
  const positionWarning = checkPositionWarning(
    canvas.width,
    canvas.height,
    watermarkWidth,
    watermarkHeight,
    position
  );

  // Draw watermarks at each position
  for (const pos of positions) {
    if (watermarkType === 'image' && watermarkImg) {
      // Reload watermark image for each position (needed after revoking URL)
      const wmImg = await createImageFromFile(watermarkImage!);
      drawImageWatermark(
        ctx,
        wmImg,
        pos.x,
        pos.y,
        watermarkWidth,
        watermarkHeight,
        opacity,
        rotation
      );
      URL.revokeObjectURL(wmImg.src);
    } else if (watermarkType === 'text' && watermarkText) {
      drawTextWatermark(
        ctx,
        watermarkText,
        pos.x,
        pos.y,
        fontSettings,
        opacity,
        rotation,
        size,
        canvas.width
      );
    }
  }

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error('Failed to create watermarked image'));
        }
      },
      'image/png',
      0.92
    );
  });

  // Generate filename
  const originalName = file.name.replace(/\.[^/.]+$/, '');
  const filename = `${originalName}_watermarked.png`;

  return {
    watermarkedBlob: blob,
    dimensions: { width: canvas.width, height: canvas.height },
    filename,
    positionWarning,
  };
}

/**
 * Apply watermark to multiple images (batch processing)
 * Requirement: 12.5
 */
export async function batchApplyWatermark(
  files: File[],
  watermarkSettings: Omit<WatermarkInput, 'file'>,
  onProgress?: (completed: number, total: number) => void
): Promise<BatchWatermarkResult> {
  const results: WatermarkResult[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const result = await applyWatermark({
        ...watermarkSettings,
        file,
      });
      results.push(result);
      successCount++;
    } catch (error) {
      console.error(`Failed to watermark ${file.name}:`, error);
      failedCount++;
    }

    onProgress?.(i + 1, files.length);
  }

  return {
    results,
    successCount,
    failedCount,
  };
}

/**
 * Creates a ZIP file from watermarked images
 */
export async function createZipFromResults(results: WatermarkResult[]): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  results.forEach((result) => {
    zip.file(result.filename, result.watermarkedBlob);
  });

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Downloads a watermarked image
 */
export function downloadImage(result: WatermarkResult): void {
  const url = URL.createObjectURL(result.watermarkedBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename;
  link.click();
  URL.revokeObjectURL(url);
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
