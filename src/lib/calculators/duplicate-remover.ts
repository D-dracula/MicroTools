/**
 * Duplicate Line Remover Logic
 * 
 * Removes duplicate lines from text while preserving the first occurrence.
 * Supports case-insensitive comparison and whitespace trimming options.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

export interface DuplicateRemoverInput {
  text: string;
  caseSensitive: boolean;
  trimWhitespace: boolean;
}

export interface DuplicateRemoverResult {
  cleanedText: string;
  originalLineCount: number;
  uniqueLineCount: number;
  duplicatesRemoved: number;
}

/**
 * Normalizes a line for comparison based on options.
 */
function normalizeLine(line: string, caseSensitive: boolean, trimWhitespace: boolean): string {
  let normalized = line;
  
  if (trimWhitespace) {
    normalized = normalized.trim();
  }
  
  if (!caseSensitive) {
    normalized = normalized.toLowerCase();
  }
  
  return normalized;
}

/**
 * Removes duplicate lines from text.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 * 
 * @param input - The input configuration
 * @returns Result with cleaned text and statistics
 */
export function removeDuplicateLines(input: DuplicateRemoverInput): DuplicateRemoverResult {
  const { text, caseSensitive, trimWhitespace } = input;
  
  // Handle empty input - Requirement 2.7
  if (!text || text.trim() === '') {
    return {
      cleanedText: '',
      originalLineCount: 0,
      uniqueLineCount: 0,
      duplicatesRemoved: 0,
    };
  }
  
  // Split text into lines
  const lines = text.split('\n');
  const originalLineCount = lines.length;
  
  // Track seen lines for duplicate detection
  const seenNormalized = new Set<string>();
  const uniqueLines: string[] = [];
  
  for (const line of lines) {
    const normalized = normalizeLine(line, caseSensitive, trimWhitespace);
    
    // Keep the first occurrence - Requirement 2.1
    if (!seenNormalized.has(normalized)) {
      seenNormalized.add(normalized);
      uniqueLines.push(line);
    }
  }
  
  const uniqueLineCount = uniqueLines.length;
  const duplicatesRemoved = originalLineCount - uniqueLineCount;
  
  return {
    cleanedText: uniqueLines.join('\n'),
    originalLineCount,
    uniqueLineCount,
    duplicatesRemoved,
  };
}

/**
 * Default options for duplicate removal.
 */
export const DEFAULT_DUPLICATE_REMOVER_OPTIONS = {
  caseSensitive: true,
  trimWhitespace: false,
};
