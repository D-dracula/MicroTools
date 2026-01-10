/**
 * UTM Builder Logic
 * 
 * Builds UTM-tagged URLs for tracking campaigns on TikTok, Snapchat, and other platforms.
 * Requirements: 2.1, 2.2, 2.4, 2.6
 */

export interface UTMParams {
  url: string;
  source: string;           // utm_source (required)
  medium: string;           // utm_medium (required)
  campaign: string;         // utm_campaign (required)
  term?: string;            // utm_term (optional)
  content?: string;         // utm_content (optional)
}

export interface UTMPreset {
  id: string;
  name: string;
  nameAr: string;
  source: string;
  medium: string;
  description: string;
  descriptionAr: string;
}

export interface UTMResult {
  fullUrl: string;
  isValid: boolean;
  missingParams: string[];
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// TikTok and Snapchat presets - Requirement 2.2
export const UTM_PRESETS: UTMPreset[] = [
  {
    id: 'tiktok_organic',
    name: 'TikTok Organic',
    nameAr: 'تيك توك عضوي',
    source: 'tiktok',
    medium: 'social',
    description: 'For organic TikTok content and bio links',
    descriptionAr: 'للمحتوى العضوي وروابط البايو في تيك توك',
  },
  {
    id: 'tiktok_paid',
    name: 'TikTok Ads',
    nameAr: 'إعلانات تيك توك',
    source: 'tiktok',
    medium: 'cpc',
    description: 'For paid TikTok advertising campaigns',
    descriptionAr: 'للحملات الإعلانية المدفوعة في تيك توك',
  },
  {
    id: 'tiktok_influencer',
    name: 'TikTok Influencer',
    nameAr: 'مؤثرين تيك توك',
    source: 'tiktok',
    medium: 'influencer',
    description: 'For influencer marketing on TikTok',
    descriptionAr: 'للتسويق عبر المؤثرين في تيك توك',
  },
  {
    id: 'snapchat_organic',
    name: 'Snapchat Organic',
    nameAr: 'سناب شات عضوي',
    source: 'snapchat',
    medium: 'social',
    description: 'For organic Snapchat content and stories',
    descriptionAr: 'للمحتوى العضوي والستوريز في سناب شات',
  },
  {
    id: 'snapchat_paid',
    name: 'Snapchat Ads',
    nameAr: 'إعلانات سناب شات',
    source: 'snapchat',
    medium: 'cpc',
    description: 'For paid Snapchat advertising campaigns',
    descriptionAr: 'للحملات الإعلانية المدفوعة في سناب شات',
  },
  {
    id: 'snapchat_influencer',
    name: 'Snapchat Influencer',
    nameAr: 'مؤثرين سناب شات',
    source: 'snapchat',
    medium: 'influencer',
    description: 'For influencer marketing on Snapchat',
    descriptionAr: 'للتسويق عبر المؤثرين في سناب شات',
  },
  {
    id: 'instagram_organic',
    name: 'Instagram Organic',
    nameAr: 'انستقرام عضوي',
    source: 'instagram',
    medium: 'social',
    description: 'For organic Instagram content and bio links',
    descriptionAr: 'للمحتوى العضوي وروابط البايو في انستقرام',
  },
  {
    id: 'instagram_paid',
    name: 'Instagram Ads',
    nameAr: 'إعلانات انستقرام',
    source: 'instagram',
    medium: 'cpc',
    description: 'For paid Instagram advertising campaigns',
    descriptionAr: 'للحملات الإعلانية المدفوعة في انستقرام',
  },
  {
    id: 'twitter_organic',
    name: 'Twitter/X Organic',
    nameAr: 'تويتر عضوي',
    source: 'twitter',
    medium: 'social',
    description: 'For organic Twitter/X content',
    descriptionAr: 'للمحتوى العضوي في تويتر',
  },
  {
    id: 'email',
    name: 'Email Campaign',
    nameAr: 'حملة بريد إلكتروني',
    source: 'email',
    medium: 'email',
    description: 'For email marketing campaigns',
    descriptionAr: 'لحملات التسويق عبر البريد الإلكتروني',
  },
];

/**
 * Validates URL format.
 * Requirement: 2.6
 */
export function validateUrl(url: string): ValidationResult {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'URL is required' };
  }

  const trimmedUrl = url.trim();

  // Check if URL has a protocol
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return { isValid: false, error: 'URL must start with http:// or https://' };
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    
    // Check for valid hostname
    if (!parsedUrl.hostname || parsedUrl.hostname.length < 1) {
      return { isValid: false, error: 'Invalid URL hostname' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * URL-encodes UTM parameter values.
 * Requirement: 2.4
 */
export function encodeUTMParams(params: UTMParams): string {
  const utmParams: string[] = [];

  // Required parameters
  if (params.source) {
    utmParams.push(`utm_source=${encodeURIComponent(params.source.trim())}`);
  }
  if (params.medium) {
    utmParams.push(`utm_medium=${encodeURIComponent(params.medium.trim())}`);
  }
  if (params.campaign) {
    utmParams.push(`utm_campaign=${encodeURIComponent(params.campaign.trim())}`);
  }

  // Optional parameters
  if (params.term && params.term.trim()) {
    utmParams.push(`utm_term=${encodeURIComponent(params.term.trim())}`);
  }
  if (params.content && params.content.trim()) {
    utmParams.push(`utm_content=${encodeURIComponent(params.content.trim())}`);
  }

  return utmParams.join('&');
}

/**
 * Checks for missing required UTM parameters.
 * Requirement: 2.3
 */
export function getMissingParams(params: UTMParams): string[] {
  const missing: string[] = [];

  if (!params.source || !params.source.trim()) {
    missing.push('source');
  }
  if (!params.medium || !params.medium.trim()) {
    missing.push('medium');
  }
  if (!params.campaign || !params.campaign.trim()) {
    missing.push('campaign');
  }

  return missing;
}

/**
 * Builds a UTM-tagged URL.
 * Requirements: 2.1, 2.4, 2.6
 */
export function buildUTMUrl(params: UTMParams): UTMResult {
  // Validate URL first
  const urlValidation = validateUrl(params.url);
  if (!urlValidation.isValid) {
    return {
      fullUrl: '',
      isValid: false,
      missingParams: [],
      error: urlValidation.error,
    };
  }

  // Check for missing required parameters
  const missingParams = getMissingParams(params);
  if (missingParams.length > 0) {
    return {
      fullUrl: '',
      isValid: false,
      missingParams,
      error: `Missing required parameters: ${missingParams.join(', ')}`,
    };
  }

  try {
    const parsedUrl = new URL(params.url.trim());
    
    // Encode and add UTM parameters
    const utmString = encodeUTMParams(params);
    
    // Determine separator (? or &)
    const separator = parsedUrl.search ? '&' : '?';
    
    // Build full URL
    const fullUrl = `${parsedUrl.origin}${parsedUrl.pathname}${parsedUrl.search}${separator}${utmString}${parsedUrl.hash}`;

    return {
      fullUrl,
      isValid: true,
      missingParams: [],
    };
  } catch {
    return {
      fullUrl: '',
      isValid: false,
      missingParams: [],
      error: 'Failed to build URL',
    };
  }
}

/**
 * Gets a preset by ID.
 */
export function getPresetById(id: string): UTMPreset | undefined {
  return UTM_PRESETS.find(preset => preset.id === id);
}

/**
 * Applies a preset to UTM params.
 */
export function applyPreset(preset: UTMPreset, url: string, campaign: string): UTMParams {
  return {
    url,
    source: preset.source,
    medium: preset.medium,
    campaign,
  };
}
