/**
 * CSV Parser Module for Ad Spend Data
 * 
 * Parses CSV files from Facebook, TikTok, and Google Ads platforms.
 * Auto-detects platform from column headers and extracts ad spend data.
 * 
 * Requirements: 1.1, 1.4
 */

export type AdPlatform = 'facebook' | 'tiktok' | 'google' | 'other';

export interface CSVAdData {
  platform: AdPlatform;
  spend: number;
  campaign?: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
}

export interface ParsedCSVResult {
  success: boolean;
  data?: CSVAdData[];
  totalSpend?: number;
  error?: string;
  errorKey?: string;
  rowCount?: number;
  platform?: AdPlatform;
}

const PLATFORM_CONFIGS: Record<AdPlatform, {
  identifyingColumns: string[];
  spendColumn: string[];
  campaignColumn: string[];
  impressionsColumn: string[];
  clicksColumn: string[];
}> = {
  facebook: {
    identifyingColumns: ['Amount spent (SAR)', 'Amount spent', 'Spend'],
    spendColumn: ['Amount spent (SAR)', 'Amount spent', 'Spend', 'Amount Spent (SAR)'],
    campaignColumn: ['Campaign name', 'Campaign Name', 'Campaign'],
    impressionsColumn: ['Impressions'],
    clicksColumn: ['Link clicks', 'Clicks', 'Link Clicks'],
  },
  tiktok: {
    identifyingColumns: ['Cost'],
    spendColumn: ['Cost', 'Total Cost', 'Spend'],
    campaignColumn: ['Campaign', 'Campaign Name', 'Campaign name'],
    impressionsColumn: ['Impressions', 'Impression'],
    clicksColumn: ['Clicks', 'Click'],
  },
  google: {
    identifyingColumns: ['Cost'],
    spendColumn: ['Cost', 'Spend', 'Amount'],
    campaignColumn: ['Campaign', 'Campaign name', 'Campaign Name'],
    impressionsColumn: ['Impressions', 'Impr.', 'Impr'],
    clicksColumn: ['Clicks', 'Click'],
  },
  other: {
    identifyingColumns: [],
    spendColumn: ['Spend', 'Cost', 'Amount', 'Amount spent'],
    campaignColumn: ['Campaign', 'Campaign name', 'Campaign Name'],
    impressionsColumn: ['Impressions'],
    clicksColumn: ['Clicks'],
  },
};


export function parseCSVString(csvContent: string): string[][] {
  const lines = csvContent.trim().split(/\r?\n/);
  const result: string[][] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    result.push(row);
  }
  return result;
}

export function detectPlatform(headers: string[]): AdPlatform {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  const facebookIdentifiers = PLATFORM_CONFIGS.facebook.identifyingColumns.map(c => c.toLowerCase());
  if (facebookIdentifiers.some(id => normalizedHeaders.some(h => h.includes(id) || id.includes(h)))) {
    return 'facebook';
  }
  const hasCost = normalizedHeaders.some(h => h === 'cost' || h === 'total cost');
  const hasTikTokPattern = normalizedHeaders.some(h => h.includes('tiktok') || h.includes('tt'));
  if (hasTikTokPattern || (hasCost && !normalizedHeaders.some(h => h.includes('amount spent')))) {
    if (normalizedHeaders.some(h => h.includes('impr.') || h === 'impr')) {
      return 'google';
    }
    return 'tiktok';
  }
  return 'other';
}

function findColumnIndex(headers: string[], possibleNames: string[]): number {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  for (const name of possibleNames) {
    const index = normalizedHeaders.findIndex(h => h === name.toLowerCase() || h.includes(name.toLowerCase()));
    if (index !== -1) return index;
  }
  return -1;
}

export function parseNumericValue(value: string): number {
  if (!value || value.trim() === '') return 0;
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}


export function parseAdCSV(csvContent: string): ParsedCSVResult {
  if (!csvContent || csvContent.trim() === '') {
    return { success: false, error: 'The uploaded file contains no data', errorKey: 'csvErrors.emptyFile' };
  }
  try {
    const rows = parseCSVString(csvContent);
    if (rows.length < 2) {
      return { success: false, error: 'The uploaded file contains no data rows', errorKey: 'csvErrors.emptyFile' };
    }
    const headers = rows[0];
    const platform = detectPlatform(headers);
    const config = PLATFORM_CONFIGS[platform];
    const spendIndex = findColumnIndex(headers, config.spendColumn);
    if (spendIndex === -1) {
      return { success: false, error: `Missing required column: spend/cost. Expected one of: ${config.spendColumn.join(', ')}`, errorKey: 'csvErrors.missingColumns' };
    }
    const campaignIndex = findColumnIndex(headers, config.campaignColumn);
    const impressionsIndex = findColumnIndex(headers, config.impressionsColumn);
    const clicksIndex = findColumnIndex(headers, config.clicksColumn);
    const data: CSVAdData[] = [];
    let totalSpend = 0;
    const errors: string[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.every(cell => !cell.trim())) continue;
      const spendValue = row[spendIndex];
      const spend = parseNumericValue(spendValue);
      if (spendValue && spendValue.trim() !== '' && spend === 0 && !/^0+\.?0*$/.test(spendValue.replace(/[^\d.]/g, ''))) {
        errors.push(`Invalid spend value in row ${i + 1}: "${spendValue}"`);
        continue;
      }
      const rowData: CSVAdData = {
        platform,
        spend,
        campaign: campaignIndex !== -1 ? row[campaignIndex] : undefined,
        impressions: impressionsIndex !== -1 ? parseNumericValue(row[impressionsIndex]) : undefined,
        clicks: clicksIndex !== -1 ? parseNumericValue(row[clicksIndex]) : undefined,
      };
      data.push(rowData);
      totalSpend += spend;
    }
    if (errors.length > 0 && data.length === 0) {
      return { success: false, error: errors.join('; '), errorKey: 'csvErrors.invalidData' };
    }
    if (data.length === 0) {
      return { success: false, error: 'No valid data rows found in the file', errorKey: 'csvErrors.emptyFile' };
    }
    return { success: true, data, totalSpend, rowCount: data.length, platform };
  } catch (error) {
    return { success: false, error: `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`, errorKey: 'csvErrors.invalidFormat' };
  }
}
