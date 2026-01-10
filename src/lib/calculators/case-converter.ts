/**
 * Case Converter Logic
 * 
 * Converts text between different cases: uppercase, lowercase, title case,
 * sentence case, and toggle case.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */

export type CaseType = 'uppercase' | 'lowercase' | 'titlecase' | 'sentencecase' | 'togglecase';

export interface CaseConvertInput {
  text: string;
  caseType: CaseType;
}

export interface CaseConvertResult {
  convertedText: string;
  originalLength: number;
  convertedLength: number;
}

/**
 * Converts text to UPPERCASE.
 * Requirements: 1.1, 1.6, 1.7
 */
export function toUpperCase(text: string): string {
  if (!text) return '';
  return text.toUpperCase();
}

/**
 * Converts text to lowercase.
 * Requirements: 1.2, 1.6, 1.7
 */
export function toLowerCase(text: string): string {
  if (!text) return '';
  return text.toLowerCase();
}

/**
 * Converts text to Title Case (first letter of each word capitalized).
 * Requirements: 1.3, 1.6, 1.7
 */
export function toTitleCase(text: string): string {
  if (!text) return '';
  
  return text.replace(/\S+/g, (word) => {
    if (word.length === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

/**
 * Converts text to Sentence case (first letter of each sentence capitalized).
 * Requirements: 1.4, 1.6, 1.7
 */
export function toSentenceCase(text: string): string {
  if (!text) return '';
  
  // First, convert everything to lowercase
  let result = text.toLowerCase();
  
  // Capitalize the first letter of the text
  result = result.charAt(0).toUpperCase() + result.slice(1);
  
  // Capitalize after sentence-ending punctuation (. ! ? and Arabic ؟)
  result = result.replace(/([.!?؟]\s*)([a-zA-Z\u0600-\u06FF])/g, (match, punctuation, letter) => {
    return punctuation + letter.toUpperCase();
  });
  
  return result;
}

/**
 * Converts text to tOGGLE cASE (swaps uppercase to lowercase and vice versa).
 * Requirements: 1.5, 1.6, 1.7
 */
export function toToggleCase(text: string): string {
  if (!text) return '';
  
  return text.split('').map(char => {
    if (char === char.toUpperCase() && char !== char.toLowerCase()) {
      // Character is uppercase, convert to lowercase
      return char.toLowerCase();
    } else if (char === char.toLowerCase() && char !== char.toUpperCase()) {
      // Character is lowercase, convert to uppercase
      return char.toUpperCase();
    }
    // Non-alphabetic character, preserve as-is
    return char;
  }).join('');
}

/**
 * Main function to convert text based on case type.
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
 */
export function convertCase(input: CaseConvertInput): CaseConvertResult {
  const { text, caseType } = input;
  
  if (!text) {
    return {
      convertedText: '',
      originalLength: 0,
      convertedLength: 0,
    };
  }
  
  let convertedText: string;
  
  switch (caseType) {
    case 'uppercase':
      convertedText = toUpperCase(text);
      break;
    case 'lowercase':
      convertedText = toLowerCase(text);
      break;
    case 'titlecase':
      convertedText = toTitleCase(text);
      break;
    case 'sentencecase':
      convertedText = toSentenceCase(text);
      break;
    case 'togglecase':
      convertedText = toToggleCase(text);
      break;
    default:
      convertedText = text;
  }
  
  return {
    convertedText,
    originalLength: text.length,
    convertedLength: convertedText.length,
  };
}
