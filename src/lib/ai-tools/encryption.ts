/**
 * API Key Encryption Module
 * Securely encrypts and stores API keys in localStorage
 * Requirements: 1.2
 */

const API_KEY_STORAGE_KEY = 'openrouter_api_key_encrypted';
const ENCRYPTION_KEY_STORAGE = 'openrouter_encryption_key';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.crypto !== 'undefined';

/**
 * Generate a random encryption key
 */
async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export CryptoKey to base64 string for storage
 */
async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Import base64 string back to CryptoKey
 */
async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Get or create the encryption key
 */
async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  if (!isBrowser) {
    throw new Error('Encryption is only available in browser environment');
  }

  const storedKey = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
  
  if (storedKey) {
    return await importKey(storedKey);
  }

  const newKey = await generateKey();
  const exportedKey = await exportKey(newKey);
  localStorage.setItem(ENCRYPTION_KEY_STORAGE, exportedKey);
  return newKey;
}

/**
 * Encrypt an API key
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
  if (!isBrowser) {
    throw new Error('Encryption is only available in browser environment');
  }

  if (!apiKey) {
    throw new Error('API key cannot be empty');
  }

  const key = await getOrCreateEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt an API key
 */
export async function decryptApiKey(encryptedKey: string): Promise<string> {
  if (!isBrowser) {
    throw new Error('Decryption is only available in browser environment');
  }

  if (!encryptedKey) {
    throw new Error('Encrypted key cannot be empty');
  }

  const key = await getOrCreateEncryptionKey();
  const combined = Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Store an API key securely in localStorage
 */
export async function storeApiKey(apiKey: string): Promise<void> {
  if (!isBrowser) {
    throw new Error('Storage is only available in browser environment');
  }

  const encrypted = await encryptApiKey(apiKey);
  localStorage.setItem(API_KEY_STORAGE_KEY, encrypted);
}

/**
 * Retrieve the stored API key from localStorage
 */
export async function getApiKey(): Promise<string | null> {
  if (!isBrowser) {
    return null;
  }

  const encrypted = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (!encrypted) {
    return null;
  }

  try {
    return await decryptApiKey(encrypted);
  } catch {
    // If decryption fails, remove corrupted data
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    return null;
  }
}

/**
 * Remove the stored API key from localStorage
 */
export function removeApiKey(): void {
  if (!isBrowser) {
    return;
  }

  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

/**
 * Check if an API key is stored
 */
export function hasStoredApiKey(): boolean {
  if (!isBrowser) {
    return false;
  }

  return localStorage.getItem(API_KEY_STORAGE_KEY) !== null;
}
