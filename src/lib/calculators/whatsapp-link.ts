/**
 * WhatsApp Link Generator Logic
 * 
 * Generates WhatsApp click-to-chat links with pre-filled order messages.
 * Requirements: 1.1, 1.2, 1.3, 1.6
 */

export interface WhatsAppLinkInput {
  phoneNumber: string;      // Phone number without country code
  countryCode: string;      // e.g., "966" for Saudi Arabia
  productName: string;
  price?: number;
  quantity?: number;
  customMessage?: string;
  language: 'ar' | 'en';
}

export interface WhatsAppLinkResult {
  link: string;             // wa.me link
  message: string;          // Pre-filled message
  isValid: boolean;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Common country codes for the region
export const COUNTRY_CODES = [
  { code: '966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '971', country: 'UAE', flag: '🇦🇪' },
  { code: '965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '968', country: 'Oman', flag: '🇴🇲' },
  { code: '974', country: 'Qatar', flag: '🇶🇦' },
  { code: '20', country: 'Egypt', flag: '🇪🇬' },
  { code: '962', country: 'Jordan', flag: '🇯🇴' },
  { code: '1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '44', country: 'UK', flag: '🇬🇧' },
];

/**
 * Validates phone number format.
 * Accepts digits only, length between 7-15 digits.
 * Requirement: 1.3
 */
export function validatePhoneNumber(phoneNumber: string, countryCode: string): ValidationResult {
  // Remove any spaces, dashes, or other formatting
  const cleanedNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
  
  // Check if it contains only digits
  if (!/^\d+$/.test(cleanedNumber)) {
    return { 
      isValid: false, 
      error: 'Phone number must contain only digits' 
    };
  }
  
  // Check length (typical phone numbers are 7-15 digits)
  if (cleanedNumber.length < 7 || cleanedNumber.length > 15) {
    return { 
      isValid: false, 
      error: 'Phone number must be between 7 and 15 digits' 
    };
  }
  
  // Validate country code
  if (!countryCode || !/^\d{1,4}$/.test(countryCode)) {
    return { 
      isValid: false, 
      error: 'Invalid country code' 
    };
  }
  
  return { isValid: true };
}

/**
 * Formats the WhatsApp message based on language and inputs.
 * Requirement: 1.6 - Support Arabic and English templates
 */
export function formatWhatsAppMessage(input: WhatsAppLinkInput): string {
  const { productName, price, quantity, customMessage, language } = input;
  
  // If custom message is provided, use it
  if (customMessage && customMessage.trim()) {
    return customMessage.trim();
  }
  
  // Generate template message based on language
  if (language === 'ar') {
    let message = `مرحباً، أرغب في طلب المنتج: ${productName}`;
    
    if (quantity && quantity > 0) {
      message += `\nالكمية: ${quantity}`;
    }
    
    if (price && price > 0) {
      message += `\nالسعر: ${price} ريال`;
    }
    
    message += '\n\nشكراً لكم';
    return message;
  } else {
    let message = `Hello, I would like to order: ${productName}`;
    
    if (quantity && quantity > 0) {
      message += `\nQuantity: ${quantity}`;
    }
    
    if (price && price > 0) {
      message += `\nPrice: ${price} SAR`;
    }
    
    message += '\n\nThank you';
    return message;
  }
}

/**
 * Generates a WhatsApp click-to-chat link.
 * Requirements: 1.1, 1.2
 */
export function generateWhatsAppLink(input: WhatsAppLinkInput): WhatsAppLinkResult {
  const { phoneNumber, countryCode, productName } = input;
  
  // Validate product name
  if (!productName || !productName.trim()) {
    return {
      link: '',
      message: '',
      isValid: false,
      error: 'Product name is required'
    };
  }
  
  // Validate phone number
  const phoneValidation = validatePhoneNumber(phoneNumber, countryCode);
  if (!phoneValidation.isValid) {
    return {
      link: '',
      message: '',
      isValid: false,
      error: phoneValidation.error
    };
  }
  
  // Clean phone number
  const cleanedNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, '');
  
  // Format the full phone number (country code + number)
  const fullPhoneNumber = `${countryCode}${cleanedNumber}`;
  
  // Generate the message
  const message = formatWhatsAppMessage(input);
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Generate the WhatsApp link
  const link = `https://wa.me/${fullPhoneNumber}?text=${encodedMessage}`;
  
  return {
    link,
    message,
    isValid: true
  };
}

/**
 * Extracts phone number components from a full number string.
 * Useful for parsing user input that might include country code.
 */
export function parsePhoneNumber(fullNumber: string): { countryCode: string; phoneNumber: string } | null {
  const cleaned = fullNumber.replace(/[\s\-\(\)\.+]/g, '');
  
  if (!/^\d+$/.test(cleaned)) {
    return null;
  }
  
  // Try to match known country codes
  for (const { code } of COUNTRY_CODES) {
    if (cleaned.startsWith(code)) {
      return {
        countryCode: code,
        phoneNumber: cleaned.slice(code.length)
      };
    }
  }
  
  // Default: assume no country code
  return {
    countryCode: '',
    phoneNumber: cleaned
  };
}
