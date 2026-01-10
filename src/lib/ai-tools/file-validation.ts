/**
 * File Validation Module
 * Validates file size, format, and required columns
 * 
 * Requirements: 7.2, 7.3, 7.5
 */

import { FileType, detectFileType } from './file-parser';

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Supported file extensions
export const SUPPORTED_EXTENSIONS = ['csv', 'xlsx', 'xls', 'txt'];

// Platform-specific required columns
export const PLATFORM_REQUIRED_COLUMNS: Record<string, string[]> = {
  sales: ['order_id', 'date', 'product', 'quantity', 'revenue'],
  reviews: ['review', 'text', 'comment'],
  catalog: ['title', 'description', 'name', 'product_name'],
  inventory: ['product', 'stock', 'quantity', 'sales'],
  ads: ['campaign', 'spend', 'cost', 'impressions', 'clicks'],
};

export interface FileValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  detectedFormat?: FileType;
  fileSizeBytes?: number;
  fileSizeMB?: number;
  requiredColumns?: string[];
  missingColumns?: string[];
  foundColumns?: string[];
}

export interface ValidationOptions {
  maxSizeBytes?: number;
  requiredColumns?: string[];
  toolType?: 'sales' | 'reviews' | 'catalog' | 'inventory' | 'ads';
}

export function validateFileSize(file: File, maxSize: number = MAX_FILE_SIZE): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `File size too large (${sizeMB}MB). Maximum allowed: ${maxMB}MB` };
  }
  return { valid: true };
}

export function validateFileFormat(file: File): { valid: boolean; fileType: FileType; error?: string } {
  const fileType = detectFileType(file);
  if (fileType === 'unknown') {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    return { valid: false, fileType, error: `Unsupported file format (.${ext}). Use: ${SUPPORTED_EXTENSIONS.join(', ')}` };
  }
  return { valid: true, fileType };
}


export function validateRequiredColumns(
  headers: string[],
  requiredColumns?: string[],
  toolType?: string
): { valid: boolean; missing: string[]; found: string[] } {
  if (!requiredColumns && !toolType) {
    return { valid: true, missing: [], found: headers };
  }

  let columnsToCheck: string[] = requiredColumns || [];
  
  if (toolType && !requiredColumns) {
    columnsToCheck = PLATFORM_REQUIRED_COLUMNS[toolType] || [];
  }

  const headersLower = headers.map(h => h.toLowerCase().trim());
  const found: string[] = [];
  const missing: string[] = [];

  for (const col of columnsToCheck) {
    const colLower = col.toLowerCase().trim();
    if (headersLower.some(h => h.includes(colLower) || colLower.includes(h))) {
      found.push(col);
    }
  }

  // Check if at least one required column is found
  const hasRequiredColumn = found.length > 0 || columnsToCheck.length === 0;
  
  if (!hasRequiredColumn) {
    missing.push(...columnsToCheck.slice(0, 3)); // Show first 3 as examples
  }

  return { valid: hasRequiredColumn, missing, found };
}

export function validateFile(file: File, options: ValidationOptions = {}): FileValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate file size
  const sizeValidation = validateFileSize(file, options.maxSizeBytes);
  if (!sizeValidation.valid && sizeValidation.error) {
    errors.push(sizeValidation.error);
  }

  // Validate file format
  const formatValidation = validateFileFormat(file);
  if (!formatValidation.valid && formatValidation.error) {
    errors.push(formatValidation.error);
  }

  // Add warning for large files
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > 5 && sizeMB <= 10) {
    warnings.push('File is relatively large. Processing may take longer');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    detectedFormat: formatValidation.fileType,
    fileSizeBytes: file.size,
    fileSizeMB: sizeMB,
    requiredColumns: options.requiredColumns,
  };
}

export async function validateFileWithHeaders(
  file: File,
  headers: string[],
  options: ValidationOptions = {}
): Promise<FileValidation> {
  const baseValidation = validateFile(file, options);
  
  // Validate required columns
  const columnValidation = validateRequiredColumns(
    headers,
    options.requiredColumns,
    options.toolType
  );

  if (!columnValidation.valid && columnValidation.missing.length > 0) {
    baseValidation.errors.push(
      `Required columns missing. Examples: ${columnValidation.missing.join(', ')}`
    );
    baseValidation.isValid = false;
  }

  baseValidation.missingColumns = columnValidation.missing;
  baseValidation.foundColumns = columnValidation.found;

  return baseValidation;
}

export function getFileSizeDisplay(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getSampleFileUrl(toolType: string): string {
  const sampleFiles: Record<string, string> = {
    sales: '/samples/sales-template.csv',
    reviews: '/samples/reviews-template.csv',
    catalog: '/samples/catalog-template.csv',
    inventory: '/samples/inventory-template.csv',
    ads: '/samples/ads-template.csv',
  };
  return sampleFiles[toolType] || '/samples/generic-template.csv';
}
