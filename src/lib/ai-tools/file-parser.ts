/**
 * Unified File Parser Module
 * Supports CSV, Excel (XLSX/XLS), and Text file parsing
 * Auto-detects file format and e-commerce platform (Salla, Zid, Shopify)
 * 
 * Requirements: 7.1, 7.2
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export type FileType = 'csv' | 'xlsx' | 'xls' | 'txt' | 'unknown';
export type Platform = 'salla' | 'zid' | 'shopify' | 'unknown';

export interface ParsedFile {
  success: boolean;
  data?: Record<string, unknown>[];
  headers?: string[];
  rowCount?: number;
  fileType: FileType;
  platform?: Platform;
  error?: string;
  rawText?: string;
}

const PLATFORM_PATTERNS: Record<Platform, string[]> = {
  salla: ['salla', 'order_id', 'salla_order'],
  zid: ['zid', 'zid_order', 'merchant_id'],
  shopify: ['shopify', 'line_item', 'fulfillment', 'variant_sku', 'financial_status'],
  unknown: [],
};

export function detectFileType(file: File): FileType {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();
  if (extension === 'csv' || mimeType === 'text/csv') return 'csv';
  if (extension === 'xlsx' || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'xlsx';
  if (extension === 'xls' || mimeType === 'application/vnd.ms-excel') return 'xls';
  if (extension === 'txt' || mimeType === 'text/plain') return 'txt';
  return 'unknown';
}

export function detectPlatform(headers: string[], data: Record<string, unknown>[]): Platform {
  const headersLower = headers.map(h => h.toLowerCase());
  const firstRowValues = data.length > 0 ? Object.values(data[0]).map(v => String(v).toLowerCase()) : [];
  const allText = [...headersLower, ...firstRowValues].join(' ');
  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    if (platform === 'unknown') continue;
    for (const pattern of patterns) {
      if (allText.includes(pattern.toLowerCase())) return platform as Platform;
    }
  }
  return 'unknown';
}


export async function parseCSV(file: File): Promise<ParsedFile> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          resolve({ success: false, fileType: 'csv', error: `Failed to read CSV file: ${results.errors[0].message}` });
          return;
        }
        const data = results.data as Record<string, unknown>[];
        const headers = results.meta.fields || [];
        const platform = detectPlatform(headers, data);
        resolve({ success: true, data, headers, rowCount: data.length, fileType: 'csv', platform });
      },
      error: (error) => {
        resolve({ success: false, fileType: 'csv', error: `Failed to read CSV file: ${error.message}` });
      },
    });
  });
}

export async function parseExcel(file: File): Promise<ParsedFile> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { success: false, fileType: file.name.endsWith('.xlsx') ? 'xlsx' : 'xls', error: 'File does not contain any worksheets' };
    }
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    const platform = detectPlatform(headers, data);
    const fileType: FileType = file.name.endsWith('.xlsx') ? 'xlsx' : 'xls';
    return { success: true, data, headers, rowCount: data.length, fileType, platform };
  } catch (error) {
    const fileType: FileType = file.name.endsWith('.xlsx') ? 'xlsx' : 'xls';
    return { success: false, fileType, error: `Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function parseText(file: File): Promise<ParsedFile> {
  try {
    const text = await file.text();
    if (!text.trim()) {
      return { success: false, fileType: 'txt', error: 'File is empty or contains no data' };
    }
    const lines = text.split('\n').filter(line => line.trim());
    return { success: true, fileType: 'txt', rawText: text, rowCount: lines.length };
  } catch (error) {
    return { success: false, fileType: 'txt', error: `Failed to read text file: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const fileType = detectFileType(file);
  switch (fileType) {
    case 'csv': return parseCSV(file);
    case 'xlsx':
    case 'xls': return parseExcel(file);
    case 'txt': return parseText(file);
    default: return { success: false, fileType: 'unknown', error: 'Unsupported file format. Use CSV, Excel, or TXT' };
  }
}

export function getFileTypeLabel(fileType: FileType): string {
  const labels: Record<FileType, string> = { csv: 'CSV', xlsx: 'Excel (XLSX)', xls: 'Excel (XLS)', txt: 'Text', unknown: 'Unknown' };
  return labels[fileType];
}

export function getPlatformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = { salla: 'Salla', zid: 'Zid', shopify: 'Shopify', unknown: 'Unknown' };
  return labels[platform];
}
