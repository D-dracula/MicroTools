/**
 * Image Transform Logic
 * 
 * Implements flip (horizontal/vertical) and rotation (90/180/270/custom) operations.
 * Requirements: 14.1, 14.2, 14.5
 */

export type FlipDirection = 'horizontal' | 'vertical';
export type RotationAngle = 90 | 180 | 270 | 'custom';

export type TransformOperation = 
  | { type: 'flip'; direction: FlipDirection }
  | { type: 'rotate'; angle: number };

export interface TransformInput {
  file: File;
  operations: TransformOperation[];
}

export interface TransformResult {
  transformedBlob: Blob;
  originalDimensions: { width: number; height: number };
  newDimensions: { width: number; height: number };
  filename: string;
  operationsApplied: string[];
}

export interface BatchTransformResult {
  results: TransformResult[];
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
 * Operation labels for UI
 */
export const OPERATION_LABELS = {
  'flip-horizontal': { en: 'Flip Horizontal', ar: 'قلب أفقي' },
  'flip-vertical': { en: 'Flip Vertical', ar: 'قلب عمودي' },
  'rotate-90': { en: 'Rotate 90°', ar: 'تدوير 90°' },
  'rotate-180': { en: 'Rotate 180°', ar: 'تدوير 180°' },
  'rotate-270': { en: 'Rotate 270°', ar: 'تدوير 270°' },
  'rotate-custom': { en: 'Custom Rotation', ar: 'تدوير مخصص' },
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
 * Calculate new dimensions after rotation
 * Requirement: 14.2
 */
export function calculateRotatedDimensions(
  width: number,
  height: number,
  angle: number
): { width: number; height: number } {
  // Normalize angle to 0-360
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  // For 90 and 270 degree rotations, swap dimensions
  if (normalizedAngle === 90 || normalizedAngle === 270) {
    return { width: height, height: width };
  }
  
  // For 0 and 180 degree rotations, dimensions stay the same
  if (normalizedAngle === 0 || normalizedAngle === 180) {
    return { width, height };
  }
  
  // For custom angles, calculate bounding box
  const radians = (normalizedAngle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  
  const newWidth = Math.ceil(width * cos + height * sin);
  const newHeight = Math.ceil(width * sin + height * cos);
  
  return { width: newWidth, height: newHeight };
}

/**
 * Apply flip transformation
 * Requirement: 14.1
 */
function applyFlip(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  direction: FlipDirection
): void {
  const { width, height } = ctx.canvas;
  
  ctx.save();
  
  if (direction === 'horizontal') {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, height);
    ctx.scale(1, -1);
  }
  
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

/**
 * Apply rotation transformation
 * Requirement: 14.2
 */
function applyRotation(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  angle: number
): void {
  const { width, height } = ctx.canvas;
  const radians = (angle * Math.PI) / 180;
  
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(radians);
  
  // For 90/270 rotations, we need to adjust the draw position
  const normalizedAngle = ((angle % 360) + 360) % 360;
  if (normalizedAngle === 90 || normalizedAngle === 270) {
    ctx.drawImage(img, -img.height / 2, -img.width / 2, img.height, img.width);
  } else {
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
  }
  
  ctx.restore();
}

/**
 * Get operation description string
 */
function getOperationDescription(operation: TransformOperation): string {
  if (operation.type === 'flip') {
    return `Flip ${operation.direction}`;
  } else {
    return `Rotate ${operation.angle}°`;
  }
}

/**
 * Transform a single image
 * Requirements: 14.1, 14.2, 14.5
 */
export async function transformImage(input: TransformInput): Promise<TransformResult> {
  const { file, operations } = input;

  // Validate file
  if (!isValidImageFile(file)) {
    throw new Error('Unsupported image format');
  }

  if (!isValidFileSize(file)) {
    throw new Error('File size exceeds 50MB limit');
  }

  if (operations.length === 0) {
    throw new Error('At least one operation is required');
  }

  // Load image
  const img = await createImageFromFile(file);
  const originalDimensions = { width: img.width, height: img.height };

  // Calculate final dimensions based on all rotations
  let totalRotation = 0;

  for (const op of operations) {
    if (op.type === 'rotate') {
      totalRotation += op.angle;
    }
  }

  const newDimensions = calculateRotatedDimensions(img.width, img.height, totalRotation);

  // Create canvas with final dimensions
  const canvas = document.createElement('canvas');
  canvas.width = newDimensions.width;
  canvas.height = newDimensions.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Apply operations in sequence
  // First, draw the original image
  let tempCanvas = document.createElement('canvas');
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  let tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.drawImage(img, 0, 0);

  const operationsApplied: string[] = [];

  for (const operation of operations) {
    if (operation.type === 'flip') {
      // Apply flip
      const flippedCanvas = document.createElement('canvas');
      flippedCanvas.width = tempCanvas.width;
      flippedCanvas.height = tempCanvas.height;
      const flippedCtx = flippedCanvas.getContext('2d')!;
      
      flippedCtx.save();
      if (operation.direction === 'horizontal') {
        flippedCtx.translate(flippedCanvas.width, 0);
        flippedCtx.scale(-1, 1);
      } else {
        flippedCtx.translate(0, flippedCanvas.height);
        flippedCtx.scale(1, -1);
      }
      flippedCtx.drawImage(tempCanvas, 0, 0);
      flippedCtx.restore();
      
      tempCanvas = flippedCanvas;
      tempCtx = flippedCtx;
      operationsApplied.push(getOperationDescription(operation));
    } else if (operation.type === 'rotate') {
      // Apply rotation
      const rotatedDims = calculateRotatedDimensions(tempCanvas.width, tempCanvas.height, operation.angle);
      const rotatedCanvas = document.createElement('canvas');
      rotatedCanvas.width = rotatedDims.width;
      rotatedCanvas.height = rotatedDims.height;
      const rotatedCtx = rotatedCanvas.getContext('2d')!;
      
      const radians = (operation.angle * Math.PI) / 180;
      rotatedCtx.translate(rotatedCanvas.width / 2, rotatedCanvas.height / 2);
      rotatedCtx.rotate(radians);
      rotatedCtx.drawImage(tempCanvas, -tempCanvas.width / 2, -tempCanvas.height / 2);
      
      tempCanvas = rotatedCanvas;
      tempCtx = rotatedCtx;
      operationsApplied.push(getOperationDescription(operation));
    }
  }

  // Draw final result to output canvas
  canvas.width = tempCanvas.width;
  canvas.height = tempCanvas.height;
  ctx.drawImage(tempCanvas, 0, 0);

  // Clean up
  URL.revokeObjectURL(img.src);

  // Determine output format (preserve original if possible)
  const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const quality = outputFormat === 'image/jpeg' ? 0.92 : undefined;

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error('Failed to create transformed image'));
        }
      },
      outputFormat,
      quality
    );
  });

  // Generate filename
  const originalName = file.name.replace(/\.[^/.]+$/, '');
  const extension = outputFormat === 'image/png' ? 'png' : 'jpg';
  const filename = `${originalName}_transformed.${extension}`;

  return {
    transformedBlob: blob,
    originalDimensions,
    newDimensions: { width: canvas.width, height: canvas.height },
    filename,
    operationsApplied,
  };
}

/**
 * Transform multiple images (batch processing)
 * Requirement: 14.4
 */
export async function batchTransformImages(
  files: File[],
  operations: TransformOperation[],
  onProgress?: (completed: number, total: number) => void
): Promise<BatchTransformResult> {
  const results: TransformResult[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    try {
      const result = await transformImage({ file, operations });
      results.push(result);
      successCount++;
    } catch (error) {
      console.error(`Failed to transform ${file.name}:`, error);
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
 * Creates a ZIP file from transformed images
 * Requirement: 14.6
 */
export async function createZipFromResults(results: TransformResult[]): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  results.forEach((result) => {
    zip.file(result.filename, result.transformedBlob);
  });

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Download a transformed image
 */
export function downloadImage(result: TransformResult): void {
  const url = URL.createObjectURL(result.transformedBlob);
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

/**
 * Create a simple operation from preset
 */
export function createOperation(preset: string, customAngle?: number): TransformOperation {
  switch (preset) {
    case 'flip-horizontal':
      return { type: 'flip', direction: 'horizontal' };
    case 'flip-vertical':
      return { type: 'flip', direction: 'vertical' };
    case 'rotate-90':
      return { type: 'rotate', angle: 90 };
    case 'rotate-180':
      return { type: 'rotate', angle: 180 };
    case 'rotate-270':
      return { type: 'rotate', angle: 270 };
    case 'rotate-custom':
      return { type: 'rotate', angle: customAngle || 0 };
    default:
      throw new Error(`Unknown operation: ${preset}`);
  }
}
