/**
 * Google Indexing API Client
 * 
 * This module provides functionality to submit URLs to Google for indexing.
 * It uses the Google Indexing API to notify Google about new or updated pages.
 * 
 * Setup Requirements:
 * 1. Create a Google Cloud Project
 * 2. Enable the Indexing API
 * 3. Create a Service Account and download the JSON key
 * 4. Add the Service Account email as an Owner in Google Search Console
 * 5. Set the GOOGLE_SERVICE_ACCOUNT_KEY environment variable
 */

import { tools } from '@/lib/tools';
import { routing } from '@/i18n/routing';

// Types
export interface IndexingResult {
  url: string;
  success: boolean;
  error?: string;
  notificationType?: 'URL_UPDATED' | 'URL_DELETED';
}

export interface BatchIndexingResult {
  total: number;
  successful: number;
  failed: number;
  results: IndexingResult[];
}

export interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Constants
const INDEXING_API_ENDPOINT = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const BATCH_ENDPOINT = 'https://indexing.googleapis.com/batch';
const SCOPES = ['https://www.googleapis.com/auth/indexing'];

/**
 * Get service account credentials from environment
 */
function getCredentials(): ServiceAccountCredentials | null {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) {
    console.error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
    return null;
  }
  
  try {
    return JSON.parse(keyJson) as ServiceAccountCredentials;
  } catch (error) {
    console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', error);
    return null;
  }
}

/**
 * Create a JWT token for Google API authentication
 */
async function createJWT(credentials: ServiceAccountCredentials): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: SCOPES.join(' '),
    aud: credentials.token_uri,
    iat: now,
    exp: now + 3600, // 1 hour
  };
  
  // Base64URL encode
  const base64UrlEncode = (obj: object): string => {
    const json = JSON.stringify(obj);
    const base64 = Buffer.from(json).toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };
  
  const headerEncoded = base64UrlEncode(header);
  const payloadEncoded = base64UrlEncode(payload);
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;
  
  // Sign with RSA-SHA256
  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(credentials.private_key, 'base64');
  const signatureEncoded = signature.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  return `${signatureInput}.${signatureEncoded}`;
}

/**
 * Get an access token using the service account credentials
 */
async function getAccessToken(credentials: ServiceAccountCredentials): Promise<string | null> {
  try {
    const jwt = await createJWT(credentials);
    
    const response = await fetch(credentials.token_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to get access token:', error);
      return null;
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Submit a single URL for indexing
 */
export async function submitUrl(
  url: string,
  type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'
): Promise<IndexingResult> {
  const credentials = getCredentials();
  if (!credentials) {
    return { url, success: false, error: 'Missing credentials' };
  }
  
  const accessToken = await getAccessToken(credentials);
  if (!accessToken) {
    return { url, success: false, error: 'Failed to get access token' };
  }
  
  try {
    const response = await fetch(INDEXING_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        url,
        type,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return { url, success: false, error, notificationType: type };
    }
    
    return { url, success: true, notificationType: type };
  } catch (error) {
    return { 
      url, 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      notificationType: type 
    };
  }
}

/**
 * Submit multiple URLs for indexing (batch request)
 */
export async function submitUrls(
  urls: string[],
  type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'
): Promise<BatchIndexingResult> {
  const results: IndexingResult[] = [];
  let successful = 0;
  let failed = 0;
  
  // Process in batches of 100 (API limit)
  const batchSize = 100;
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    
    // Process each URL in the batch
    const batchResults = await Promise.all(
      batch.map(url => submitUrl(url, type))
    );
    
    for (const result of batchResults) {
      results.push(result);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return {
    total: urls.length,
    successful,
    failed,
    results,
  };
}

/**
 * Get all indexable URLs from the site
 */
export function getAllSiteUrls(): string[] {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinecalc.com';
  const urls: string[] = [];
  
  // Root URL
  urls.push(baseUrl);
  
  // Base pages for each locale
  const basePages = ['', '/tools', '/blog'];
  for (const locale of routing.locales) {
    for (const page of basePages) {
      urls.push(`${baseUrl}/${locale}${page}`);
    }
  }
  
  // Tool pages
  for (const tool of tools) {
    for (const locale of routing.locales) {
      urls.push(`${baseUrl}/${locale}/tools/${tool.slug}`);
    }
  }
  
  return urls;
}

/**
 * Submit all site URLs for indexing
 */
export async function indexAllSiteUrls(): Promise<BatchIndexingResult> {
  const urls = getAllSiteUrls();
  console.log(`Submitting ${urls.length} URLs for indexing...`);
  return submitUrls(urls);
}

/**
 * Submit tool pages for indexing
 */
export async function indexToolPages(): Promise<BatchIndexingResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinecalc.com';
  const urls: string[] = [];
  
  for (const tool of tools) {
    for (const locale of routing.locales) {
      urls.push(`${baseUrl}/${locale}/tools/${tool.slug}`);
    }
  }
  
  console.log(`Submitting ${urls.length} tool URLs for indexing...`);
  return submitUrls(urls);
}

/**
 * Submit a specific URL for indexing (convenience function)
 */
export async function indexUrl(path: string): Promise<IndexingResult> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinecalc.com';
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  return submitUrl(url);
}

/**
 * Check if the Indexing API is configured
 */
export function isIndexingConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
}
