/**
 * HTML Entity Encoder/Decoder Logic
 * 
 * Encodes and decodes HTML entities for safe handling of special characters.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

export type CodecMode = 'encode' | 'decode';

export interface HtmlCodecInput {
  text: string;
  mode: CodecMode;
}

export interface HtmlCodecResult {
  result: string;
  originalLength: number;
  resultLength: number;
  entitiesProcessed: number;
}

// Named HTML entities mapping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

// Reverse mapping for decoding
const HTML_ENTITIES_REVERSE: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&#34;': '"',
  '&#38;': '&',
  '&#60;': '<',
  '&#62;': '>',
};

/**
 * Encodes special characters to HTML entities.
 * Requirements: 7.1, 7.3, 7.6
 */
export function encodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  let result = '';
  let i = 0;
  
  while (i < text.length) {
    const char = text[i];
    
    // Check if this & is already part of an entity - Requirement 7.6
    if (char === '&') {
      // Look ahead to see if this is already an entity
      const remaining = text.substring(i);
      const entityMatch = remaining.match(/^&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/);
      
      if (entityMatch) {
        // Already an entity, preserve it
        result += entityMatch[0];
        i += entityMatch[0].length;
        continue;
      }
    }
    
    // Encode the character if it's in our mapping
    if (HTML_ENTITIES[char]) {
      result += HTML_ENTITIES[char];
    } else {
      result += char;
    }
    i++;
  }
  
  return result;
}

/**
 * Decodes HTML entities back to characters.
 * Requirements: 7.2, 7.4
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // Decode named entities
  for (const [entity, char] of Object.entries(HTML_ENTITIES_REVERSE)) {
    result = result.split(entity).join(char);
  }
  
  // Decode numeric entities (decimal)
  result = result.replace(/&#(\d+);/g, (match, dec) => {
    const code = parseInt(dec, 10);
    return code > 0 && code < 65536 ? String.fromCharCode(code) : match;
  });
  
  // Decode numeric entities (hexadecimal)
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    const code = parseInt(hex, 16);
    return code > 0 && code < 65536 ? String.fromCharCode(code) : match;
  });
  
  return result;
}

/**
 * Counts the number of entities in text.
 */
function countEntities(text: string): number {
  const matches = text.match(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g);
  return matches ? matches.length : 0;
}

/**
 * Counts characters that would be encoded.
 */
function countEncodableChars(text: string): number {
  let count = 0;
  for (const char of text) {
    if (HTML_ENTITIES[char]) {
      count++;
    }
  }
  return count;
}

/**
 * Processes HTML encoding or decoding.
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
export function processHtml(input: HtmlCodecInput): HtmlCodecResult {
  const { text, mode } = input;
  
  // Handle empty input - Requirement 7.5
  if (!text) {
    return {
      result: '',
      originalLength: 0,
      resultLength: 0,
      entitiesProcessed: 0,
    };
  }
  
  let result: string;
  let entitiesProcessed: number;
  
  if (mode === 'encode') {
    entitiesProcessed = countEncodableChars(text);
    result = encodeHtmlEntities(text);
  } else {
    entitiesProcessed = countEntities(text);
    result = decodeHtmlEntities(text);
  }
  
  return {
    result,
    originalLength: text.length,
    resultLength: result.length,
    entitiesProcessed,
  };
}
