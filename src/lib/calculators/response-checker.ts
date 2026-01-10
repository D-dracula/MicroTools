/**
 * Website Response Checker Logic
 * 
 * Checks website response time and accessibility.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

export interface ResponseCheckInput {
  url: string;
  timeout?: number; // milliseconds, default 10000
}

export type ResponseStatus = 'fast' | 'moderate' | 'slow' | 'timeout' | 'error';

export interface ResponseCheckResult {
  url: string;
  responseTime: number; // milliseconds
  statusCode: number;
  status: ResponseStatus;
  isAccessible: boolean;
  error?: string;
}

/**
 * Normalizes a URL by adding protocol if missing.
 * Requirements: 6.1
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';
  
  let normalized = url.trim();
  
  // Add https:// if no protocol
  if (!normalized.match(/^https?:\/\//i)) {
    normalized = 'https://' + normalized;
  }
  
  return normalized;
}

/**
 * Validates a URL string.
 * Requirements: 6.2
 */
export function validateUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Determines response status based on response time.
 * Requirements: 6.4
 */
function getResponseStatus(responseTime: number, timeout: number): ResponseStatus {
  if (responseTime >= timeout) return 'timeout';
  if (responseTime < 500) return 'fast';
  if (responseTime < 2000) return 'moderate';
  return 'slow';
}

/**
 * Checks website response time and accessibility.
 * This is a client-side implementation that uses fetch.
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
export async function checkResponse(input: ResponseCheckInput): Promise<ResponseCheckResult> {
  const { timeout = 10000 } = input;
  const url = normalizeUrl(input.url);
  
  // Validate URL
  if (!validateUrl(url)) {
    return {
      url: input.url,
      responseTime: 0,
      statusCode: 0,
      status: 'error',
      isAccessible: false,
      error: 'Invalid URL format',
    };
  }
  
  const startTime = performance.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD', // Use HEAD for faster response
      mode: 'no-cors', // Allow cross-origin requests
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    // Note: With no-cors mode, we can't access status code
    // We'll assume success if no error was thrown
    return {
      url,
      responseTime,
      statusCode: response.type === 'opaque' ? 200 : response.status,
      status: getResponseStatus(responseTime, timeout),
      isAccessible: true,
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    // Check if it was a timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        url,
        responseTime: timeout,
        statusCode: 0,
        status: 'timeout',
        isAccessible: false,
        error: 'Request timed out',
      };
    }
    
    // Other errors (network, DNS, etc.)
    return {
      url,
      responseTime,
      statusCode: 0,
      status: 'error',
      isAccessible: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gets a human-readable description of the response status.
 */
export function getStatusDescription(status: ResponseStatus): { en: string; ar: string } {
  switch (status) {
    case 'fast':
      return { en: 'Fast response', ar: 'استجابة سريعة' };
    case 'moderate':
      return { en: 'Moderate response', ar: 'استجابة متوسطة' };
    case 'slow':
      return { en: 'Slow response', ar: 'استجابة بطيئة' };
    case 'timeout':
      return { en: 'Request timed out', ar: 'انتهت مهلة الطلب' };
    case 'error':
      return { en: 'Error occurred', ar: 'حدث خطأ' };
  }
}
