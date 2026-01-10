/**
 * Contact Link Generator Logic
 * 
 * Generates direct contact links for various platforms.
 * Requirements: 5.1, 5.2, 5.3
 */

export type ContactPlatform = 'whatsapp' | 'telegram' | 'email' | 'phone' | 'sms';

export interface ContactLinkInput {
  platform: ContactPlatform;
  contact: string;          // Phone number, email, or username
  message?: string;         // Pre-filled message (where supported)
  subject?: string;         // Email subject
}

export interface ContactLinkResult {
  link: string;
  platform: ContactPlatform;
  isValid: boolean;
  error?: string;
}

export interface ContactValidation {
  isValid: boolean;
  error?: string;
}

// Platform configuration
export const PLATFORMS: Record<ContactPlatform, {
  name: string;
  nameAr: string;
  icon: string;
  placeholder: string;
  placeholderAr: string;
  supportsMessage: boolean;
  supportsSubject: boolean;
}> = {
  whatsapp: {
    name: 'WhatsApp',
    nameAr: 'واتساب',
    icon: '💬',
    placeholder: '+966501234567',
    placeholderAr: '+966501234567',
    supportsMessage: true,
    supportsSubject: false,
  },
  telegram: {
    name: 'Telegram',
    nameAr: 'تيليجرام',
    icon: '✈️',
    placeholder: 'username',
    placeholderAr: 'اسم المستخدم',
    supportsMessage: false,
    supportsSubject: false,
  },
  email: {
    name: 'Email',
    nameAr: 'البريد الإلكتروني',
    icon: '📧',
    placeholder: 'example@email.com',
    placeholderAr: 'example@email.com',
    supportsMessage: true,
    supportsSubject: true,
  },
  phone: {
    name: 'Phone Call',
    nameAr: 'مكالمة هاتفية',
    icon: '📞',
    placeholder: '+966501234567',
    placeholderAr: '+966501234567',
    supportsMessage: false,
    supportsSubject: false,
  },
  sms: {
    name: 'SMS',
    nameAr: 'رسالة نصية',
    icon: '💬',
    placeholder: '+966501234567',
    placeholderAr: '+966501234567',
    supportsMessage: true,
    supportsSubject: false,
  },
};

/**
 * Validates phone number format.
 * Accepts international format with or without +
 */
function validatePhoneNumber(phone: string): ContactValidation {
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  // Check if it starts with + or is all digits
  if (!/^\+?\d{7,15}$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Invalid phone number format. Use international format (e.g., +966501234567)'
    };
  }
  
  return { isValid: true };
}

/**
 * Validates email format.
 */
function validateEmail(email: string): ContactValidation {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Invalid email format'
    };
  }
  
  return { isValid: true };
}

/**
 * Validates Telegram username.
 */
function validateTelegramUsername(username: string): ContactValidation {
  // Remove @ if present
  const cleaned = username.replace(/^@/, '');
  
  // Telegram usernames: 5-32 characters, alphanumeric and underscores
  if (!/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Invalid Telegram username. Must be 5-32 characters, start with a letter, and contain only letters, numbers, and underscores.'
    };
  }
  
  return { isValid: true };
}

/**
 * Validates contact information based on platform.
 * Requirement: 5.3 - Validate contact information format for each platform
 */
export function validateContact(platform: ContactPlatform, contact: string): ContactValidation {
  if (!contact || !contact.trim()) {
    return {
      isValid: false,
      error: 'Contact information is required'
    };
  }

  const trimmedContact = contact.trim();

  switch (platform) {
    case 'whatsapp':
    case 'phone':
    case 'sms':
      return validatePhoneNumber(trimmedContact);
    
    case 'email':
      return validateEmail(trimmedContact);
    
    case 'telegram':
      return validateTelegramUsername(trimmedContact);
    
    default:
      return { isValid: false, error: 'Unknown platform' };
  }
}

/**
 * Formats phone number for URL (removes + and spaces).
 */
function formatPhoneForUrl(phone: string): string {
  return phone.replace(/[\s\-\(\)\.+]/g, '');
}

/**
 * Generates contact link based on platform.
 * Requirements: 5.1, 5.2
 */
export function generateContactLink(input: ContactLinkInput): ContactLinkResult {
  const { platform, contact, message, subject } = input;

  // Validate contact
  const validation = validateContact(platform, contact);
  if (!validation.isValid) {
    return {
      link: '',
      platform,
      isValid: false,
      error: validation.error
    };
  }

  const trimmedContact = contact.trim();
  let link = '';

  switch (platform) {
    case 'whatsapp': {
      const phone = formatPhoneForUrl(trimmedContact);
      link = `https://wa.me/${phone}`;
      if (message && message.trim()) {
        link += `?text=${encodeURIComponent(message.trim())}`;
      }
      break;
    }

    case 'telegram': {
      // Remove @ if present
      const username = trimmedContact.replace(/^@/, '');
      link = `https://t.me/${username}`;
      break;
    }

    case 'email': {
      link = `mailto:${trimmedContact}`;
      const params: string[] = [];
      if (subject && subject.trim()) {
        params.push(`subject=${encodeURIComponent(subject.trim())}`);
      }
      if (message && message.trim()) {
        params.push(`body=${encodeURIComponent(message.trim())}`);
      }
      if (params.length > 0) {
        link += `?${params.join('&')}`;
      }
      break;
    }

    case 'phone': {
      const phone = formatPhoneForUrl(trimmedContact);
      link = `tel:+${phone}`;
      break;
    }

    case 'sms': {
      const phone = formatPhoneForUrl(trimmedContact);
      link = `sms:+${phone}`;
      if (message && message.trim()) {
        link += `?body=${encodeURIComponent(message.trim())}`;
      }
      break;
    }

    default:
      return {
        link: '',
        platform,
        isValid: false,
        error: 'Unknown platform'
      };
  }

  return {
    link,
    platform,
    isValid: true
  };
}

/**
 * Gets all supported platforms.
 */
export function getSupportedPlatforms(): ContactPlatform[] {
  return ['whatsapp', 'telegram', 'email', 'phone', 'sms'];
}

/**
 * Gets platform display info.
 */
export function getPlatformInfo(platform: ContactPlatform, language: 'ar' | 'en' = 'en') {
  const info = PLATFORMS[platform];
  return {
    ...info,
    displayName: language === 'ar' ? info.nameAr : info.name,
    displayPlaceholder: language === 'ar' ? info.placeholderAr : info.placeholder,
  };
}
