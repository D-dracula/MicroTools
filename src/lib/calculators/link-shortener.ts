/**
 * Link Shortener Logic
 * 
 * Generates shortened links for influencer tracking.
 * Requirements: 4.1, 4.2, 4.3
 */

export interface ShortenInput {
  originalUrl: string;
  customAlias?: string;
  influencerName?: string;
}

export interface ShortenResult {
  shortUrl: string;
  shortCode: string;
  originalUrl: string;
  isValid: boolean;
  error?: string;
}

export interface AliasValidation {
  isValid: boolean;
  error?: string;
}

// Characters allowed in short codes (URL-safe)
const ALLOWED_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SHORT_CODE_LENGTH = 6;

// Base URL for shortened links (in production, this would be your domain)
const BASE_SHORT_URL = 'https://mtools.link';

// Reserved aliases that cannot be used
const RESERVED_ALIASES = [
  'admin', 'api', 'app', 'dashboard', 'login', 'logout', 'register',
  'settings', 'profile', 'help', 'support', 'about', 'contact',
  'terms', 'privacy', 'tools', 'home', 'index', 'null', 'undefined'
];

/**
 * Generates a random short code.
 * Requirement: 4.1 - Generate unique identifier
 */
export function generateShortCode(): string {
  let code = '';
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
    code += ALLOWED_CHARS[randomIndex];
  }
  return code;
}

/**
 * Validates a URL format.
 */
export function validateUrl(url: string): boolean {
  if (!url || !url.trim()) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates a custom alias.
 * Requirement: 4.2 - Allow custom alias creation
 * Requirement: 4.3 - Notify if alias is taken
 */
export function validateAlias(alias: string): AliasValidation {
  if (!alias || !alias.trim()) {
    return { isValid: true }; // Empty alias is valid (will use generated code)
  }

  const trimmedAlias = alias.trim().toLowerCase();

  // Check minimum length
  if (trimmedAlias.length < 3) {
    return {
      isValid: false,
      error: 'Alias must be at least 3 characters long'
    };
  }

  // Check maximum length
  if (trimmedAlias.length > 30) {
    return {
      isValid: false,
      error: 'Alias must be 30 characters or less'
    };
  }

  // Check for valid characters (alphanumeric and hyphens only)
  if (!/^[a-z0-9-]+$/.test(trimmedAlias)) {
    return {
      isValid: false,
      error: 'Alias can only contain letters, numbers, and hyphens'
    };
  }

  // Check for leading/trailing hyphens
  if (trimmedAlias.startsWith('-') || trimmedAlias.endsWith('-')) {
    return {
      isValid: false,
      error: 'Alias cannot start or end with a hyphen'
    };
  }

  // Check for consecutive hyphens
  if (trimmedAlias.includes('--')) {
    return {
      isValid: false,
      error: 'Alias cannot contain consecutive hyphens'
    };
  }

  // Check for reserved aliases
  if (RESERVED_ALIASES.includes(trimmedAlias)) {
    return {
      isValid: false,
      error: 'This alias is reserved. Please choose a different one.'
    };
  }

  return { isValid: true };
}

/**
 * Generates alternative alias suggestions when the requested alias is taken.
 * Requirement: 4.3 - Suggest alternatives
 */
export function generateAliasSuggestions(baseAlias: string): string[] {
  const suggestions: string[] = [];
  const cleanAlias = baseAlias.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  if (!cleanAlias) {
    return suggestions;
  }

  // Add number suffixes
  for (let i = 1; i <= 3; i++) {
    suggestions.push(`${cleanAlias}${i}`);
  }

  // Add random suffix
  const randomSuffix = Math.floor(Math.random() * 1000);
  suggestions.push(`${cleanAlias}-${randomSuffix}`);

  // Add year suffix
  const year = new Date().getFullYear();
  suggestions.push(`${cleanAlias}-${year}`);

  return suggestions.slice(0, 5);
}

/**
 * Creates a shortened link.
 * Requirements: 4.1, 4.2, 4.3
 */
export function createShortLink(input: ShortenInput): ShortenResult {
  const { originalUrl, customAlias, influencerName } = input;

  // Validate original URL
  if (!originalUrl || !originalUrl.trim()) {
    return {
      shortUrl: '',
      shortCode: '',
      originalUrl: '',
      isValid: false,
      error: 'URL is required'
    };
  }

  if (!validateUrl(originalUrl)) {
    return {
      shortUrl: '',
      shortCode: '',
      originalUrl: originalUrl,
      isValid: false,
      error: 'Invalid URL format. Please enter a valid URL starting with http:// or https://'
    };
  }

  // Validate custom alias if provided
  if (customAlias) {
    const aliasValidation = validateAlias(customAlias);
    if (!aliasValidation.isValid) {
      return {
        shortUrl: '',
        shortCode: '',
        originalUrl: originalUrl,
        isValid: false,
        error: aliasValidation.error
      };
    }
  }

  // Generate or use custom short code
  let shortCode: string;
  
  if (customAlias && customAlias.trim()) {
    shortCode = customAlias.trim().toLowerCase();
  } else if (influencerName && influencerName.trim()) {
    // Create a code based on influencer name
    const cleanName = influencerName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const namePart = cleanName.slice(0, 4);
    const randomPart = generateShortCode().slice(0, 3);
    shortCode = `${namePart}${randomPart}`;
  } else {
    shortCode = generateShortCode();
  }

  // Build the short URL
  const shortUrl = `${BASE_SHORT_URL}/${shortCode}`;

  return {
    shortUrl,
    shortCode,
    originalUrl: originalUrl.trim(),
    isValid: true
  };
}

/**
 * Extracts the domain from a URL for display purposes.
 * Requirement: 4.5 - Display preview of destination
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * Formats a URL for display (truncates if too long).
 */
export function formatUrlForDisplay(url: string, maxLength: number = 50): string {
  if (url.length <= maxLength) {
    return url;
  }
  return url.slice(0, maxLength - 3) + '...';
}
