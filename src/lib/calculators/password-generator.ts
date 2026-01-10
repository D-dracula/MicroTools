/**
 * Password Generator Logic
 * 
 * Generates secure passwords with configurable options.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.10
 */

export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';

export interface PasswordResult {
  password: string;
  strength: PasswordStrength;
  strengthScore: number; // 0-100
  isValid: boolean;
  error?: string;
}

// Character sets
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Validates password options.
 * Requirements: 5.2, 5.10
 */
export function validateOptions(options: PasswordOptions): { isValid: boolean; error?: string } {
  // Check length bounds - Requirement 5.2
  if (options.length < 8) {
    return { isValid: false, error: 'Password length must be at least 8 characters' };
  }
  
  if (options.length > 128) {
    return { isValid: false, error: 'Password length cannot exceed 128 characters' };
  }
  
  // Check at least one character type is selected - Requirement 5.10
  if (!options.includeUppercase && !options.includeLowercase && 
      !options.includeNumbers && !options.includeSymbols) {
    return { isValid: false, error: 'At least one character type must be selected' };
  }
  
  return { isValid: true };
}

/**
 * Generates a cryptographically secure random number.
 */
function getSecureRandom(max: number): number {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }
  // Fallback for non-browser environments
  return Math.floor(Math.random() * max);
}

/**
 * Shuffles an array using Fisher-Yates algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = getSecureRandom(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Calculates password strength.
 * Requirements: 5.7
 */
export function calculateStrength(password: string): { strength: PasswordStrength; score: number } {
  if (!password) {
    return { strength: 'weak', score: 0 };
  }
  
  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 15;
  if (password.length >= 20) score += 10;
  
  // Character variety scoring
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
  
  if (hasUppercase) score += 15;
  if (hasLowercase) score += 15;
  if (hasNumbers) score += 15;
  if (hasSymbols) score += 20;
  
  // Bonus for mixing character types
  const typesUsed = [hasUppercase, hasLowercase, hasNumbers, hasSymbols].filter(Boolean).length;
  if (typesUsed >= 3) score += 10;
  if (typesUsed === 4) score += 10;
  
  // Penalty for patterns
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/^[a-zA-Z]+$/.test(password)) score -= 5; // Only letters
  if (/^[0-9]+$/.test(password)) score -= 10; // Only numbers
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  // Determine strength level
  let strength: PasswordStrength;
  if (score < 20) strength = 'weak';
  else if (score < 40) strength = 'fair';
  else if (score < 60) strength = 'good';
  else if (score < 80) strength = 'strong';
  else strength = 'very-strong';
  
  return { strength, score };
}

/**
 * Generates a secure password.
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.10
 */
export function generatePassword(options: PasswordOptions): PasswordResult {
  // Validate options
  const validation = validateOptions(options);
  if (!validation.isValid) {
    return {
      password: '',
      strength: 'weak',
      strengthScore: 0,
      isValid: false,
      error: validation.error,
    };
  }
  
  // Build character pool
  let charPool = '';
  const requiredChars: string[] = [];
  
  if (options.includeUppercase) {
    charPool += UPPERCASE;
    requiredChars.push(UPPERCASE[getSecureRandom(UPPERCASE.length)]);
  }
  
  if (options.includeLowercase) {
    charPool += LOWERCASE;
    requiredChars.push(LOWERCASE[getSecureRandom(LOWERCASE.length)]);
  }
  
  if (options.includeNumbers) {
    charPool += NUMBERS;
    requiredChars.push(NUMBERS[getSecureRandom(NUMBERS.length)]);
  }
  
  if (options.includeSymbols) {
    charPool += SYMBOLS;
    requiredChars.push(SYMBOLS[getSecureRandom(SYMBOLS.length)]);
  }
  
  // Generate remaining characters
  const remainingLength = options.length - requiredChars.length;
  const passwordChars = [...requiredChars];
  
  for (let i = 0; i < remainingLength; i++) {
    passwordChars.push(charPool[getSecureRandom(charPool.length)]);
  }
  
  // Shuffle to randomize position of required characters
  const shuffledChars = shuffleArray(passwordChars);
  const password = shuffledChars.join('');
  
  // Calculate strength
  const { strength, score } = calculateStrength(password);
  
  return {
    password,
    strength,
    strengthScore: score,
    isValid: true,
  };
}

/**
 * Default password options.
 */
export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
};
