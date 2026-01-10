/**
 * Business Name Generator Logic
 * 
 * Generates creative business name suggestions based on keywords and category.
 * Supports both Arabic and English name generation.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

export type BusinessCategory = 'retail' | 'food' | 'fashion' | 'technology' | 'services' | 'general';

export interface NameGeneratorInput {
  keywords: string[];
  category: BusinessCategory;
  language: 'ar' | 'en';
}

export interface GeneratedName {
  name: string;
  pattern: string;
}

export interface NameGeneratorResult {
  names: GeneratedName[];
  keyword: string;
  category: BusinessCategory;
}

// English prefixes by category
const EN_PREFIXES: Record<BusinessCategory, string[]> = {
  retail: ['Shop', 'Store', 'Market', 'Mart', 'Outlet', 'Hub', 'Corner', 'Place'],
  food: ['Taste', 'Fresh', 'Yummy', 'Delish', 'Savory', 'Golden', 'Royal', 'Chef'],
  fashion: ['Style', 'Chic', 'Vogue', 'Trend', 'Glam', 'Elite', 'Urban', 'Luxe'],
  technology: ['Tech', 'Digital', 'Smart', 'Cyber', 'Net', 'Cloud', 'Data', 'Pixel'],
  services: ['Pro', 'Expert', 'Prime', 'Elite', 'Swift', 'Quick', 'Trust', 'Care'],
  general: ['Best', 'Top', 'Prime', 'First', 'Super', 'Ultra', 'Max', 'Plus'],
};

// English suffixes by category
const EN_SUFFIXES: Record<BusinessCategory, string[]> = {
  retail: ['Store', 'Shop', 'Mart', 'Hub', 'Zone', 'World', 'Place', 'Center'],
  food: ['Kitchen', 'Bites', 'Eats', 'Cafe', 'Grill', 'House', 'Spot', 'Table'],
  fashion: ['Wear', 'Style', 'Boutique', 'Fashion', 'Attire', 'Closet', 'Look', 'Trends'],
  technology: ['Tech', 'Labs', 'Systems', 'Solutions', 'Digital', 'Works', 'Logic', 'Soft'],
  services: ['Services', 'Solutions', 'Group', 'Team', 'Partners', 'Agency', 'Co', 'Works'],
  general: ['Co', 'Group', 'Hub', 'Zone', 'Plus', 'Pro', 'Works', 'Central'],
};

// Arabic prefixes by category
const AR_PREFIXES: Record<BusinessCategory, string[]> = {
  retail: ['متجر', 'سوق', 'مركز', 'بيت', 'دار', 'ركن', 'عالم', 'واحة'],
  food: ['مطعم', 'مطبخ', 'بيت', 'دار', 'كافيه', 'مقهى', 'شيف', 'طعم'],
  fashion: ['أزياء', 'موضة', 'ستايل', 'بوتيك', 'دار', 'بيت', 'عالم', 'أناقة'],
  technology: ['تقنية', 'رقمي', 'ذكي', 'سمارت', 'تك', 'نت', 'كلاود', 'داتا'],
  services: ['خدمات', 'حلول', 'مجموعة', 'فريق', 'شركاء', 'وكالة', 'مؤسسة', 'خبراء'],
  general: ['أفضل', 'أول', 'سوبر', 'ألترا', 'ماكس', 'بلس', 'برو', 'توب'],
};

// Arabic suffixes by category
const AR_SUFFIXES: Record<BusinessCategory, string[]> = {
  retail: ['ستور', 'شوب', 'مارت', 'هب', 'زون', 'بلاس', 'سنتر', 'مول'],
  food: ['كيتشن', 'بايتس', 'إيتس', 'كافيه', 'جريل', 'هاوس', 'سبوت', 'تيبل'],
  fashion: ['وير', 'ستايل', 'بوتيك', 'فاشن', 'لوك', 'كلوزيت', 'تريند', 'شيك'],
  technology: ['تك', 'لابز', 'سيستمز', 'سوليوشنز', 'ديجيتال', 'ووركس', 'سوفت', 'آب'],
  services: ['سيرفيسز', 'سوليوشنز', 'جروب', 'تيم', 'بارتنرز', 'إيجنسي', 'كو', 'ووركس'],
  general: ['كو', 'جروب', 'هب', 'زون', 'بلس', 'برو', 'ووركس', 'سنترال'],
};

// Creative patterns
const PATTERNS = {
  prefix_keyword: 'prefix + keyword',
  keyword_suffix: 'keyword + suffix',
  prefix_keyword_suffix: 'prefix + keyword + suffix',
  keyword_and: 'keyword & Co',
  the_keyword: 'The + keyword',
  keyword_ly: 'keyword + ly',
  keyword_ify: 'keyword + ify',
  keyword_io: 'keyword + io',
  double_keyword: 'keyword + keyword',
  keyword_hub: 'keyword + hub',
};

/**
 * Capitalizes the first letter of a string.
 */
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Generates English business names.
 * Requirements: 3.6
 */
function generateEnglishNames(keyword: string, category: BusinessCategory): GeneratedName[] {
  const names: GeneratedName[] = [];
  const prefixes = EN_PREFIXES[category];
  const suffixes = EN_SUFFIXES[category];
  const capitalizedKeyword = capitalize(keyword);
  
  // Prefix + Keyword patterns
  prefixes.slice(0, 3).forEach(prefix => {
    names.push({
      name: `${prefix}${capitalizedKeyword}`,
      pattern: PATTERNS.prefix_keyword,
    });
  });
  
  // Keyword + Suffix patterns
  suffixes.slice(0, 3).forEach(suffix => {
    names.push({
      name: `${capitalizedKeyword}${suffix}`,
      pattern: PATTERNS.keyword_suffix,
    });
  });
  
  // The + Keyword pattern
  names.push({
    name: `The ${capitalizedKeyword}`,
    pattern: PATTERNS.the_keyword,
  });
  
  // Keyword & Co pattern
  names.push({
    name: `${capitalizedKeyword} & Co`,
    pattern: PATTERNS.keyword_and,
  });
  
  // Keyword + ly pattern
  names.push({
    name: `${capitalizedKeyword}ly`,
    pattern: PATTERNS.keyword_ly,
  });
  
  // Keyword + ify pattern
  names.push({
    name: `${capitalizedKeyword}ify`,
    pattern: PATTERNS.keyword_ify,
  });
  
  // Keyword + io pattern
  names.push({
    name: `${capitalizedKeyword}.io`,
    pattern: PATTERNS.keyword_io,
  });
  
  // Prefix + Keyword + Suffix pattern
  names.push({
    name: `${prefixes[0]}${capitalizedKeyword}${suffixes[0]}`,
    pattern: PATTERNS.prefix_keyword_suffix,
  });
  
  return names;
}

/**
 * Generates Arabic business names.
 * Requirements: 3.5
 */
function generateArabicNames(keyword: string, category: BusinessCategory): GeneratedName[] {
  const names: GeneratedName[] = [];
  const prefixes = AR_PREFIXES[category];
  const suffixes = AR_SUFFIXES[category];
  
  // Prefix + Keyword patterns (Arabic reads right-to-left)
  prefixes.slice(0, 3).forEach(prefix => {
    names.push({
      name: `${prefix} ${keyword}`,
      pattern: PATTERNS.prefix_keyword,
    });
  });
  
  // Keyword + Suffix patterns
  suffixes.slice(0, 3).forEach(suffix => {
    names.push({
      name: `${keyword} ${suffix}`,
      pattern: PATTERNS.keyword_suffix,
    });
  });
  
  // Keyword & شركاء pattern
  names.push({
    name: `${keyword} وشركاه`,
    pattern: PATTERNS.keyword_and,
  });
  
  // ال + Keyword pattern
  names.push({
    name: `ال${keyword}`,
    pattern: PATTERNS.the_keyword,
  });
  
  // Keyword Hub pattern
  names.push({
    name: `${keyword} هب`,
    pattern: PATTERNS.keyword_hub,
  });
  
  // Prefix + Keyword + Suffix pattern
  names.push({
    name: `${prefixes[0]} ${keyword} ${suffixes[0]}`,
    pattern: PATTERNS.prefix_keyword_suffix,
  });
  
  // Double keyword pattern
  names.push({
    name: `${keyword} ${keyword}`,
    pattern: PATTERNS.double_keyword,
  });
  
  return names;
}

/**
 * Generates business name suggestions.
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 * 
 * @param input - The input configuration
 * @returns Result with generated names (at least 10)
 */
export function generateBusinessNames(input: NameGeneratorInput): NameGeneratorResult {
  const { keywords, category, language } = input;
  
  // Use first keyword or default
  const keyword = keywords.length > 0 ? keywords[0].trim() : '';
  
  if (!keyword) {
    return {
      names: [],
      keyword: '',
      category,
    };
  }
  
  let names: GeneratedName[];
  
  if (language === 'ar') {
    names = generateArabicNames(keyword, category);
  } else {
    names = generateEnglishNames(keyword, category);
  }
  
  // If we have multiple keywords, generate additional combinations
  if (keywords.length > 1) {
    const secondKeyword = keywords[1].trim();
    if (secondKeyword) {
      if (language === 'ar') {
        names.push({
          name: `${keyword} و ${secondKeyword}`,
          pattern: 'keyword + و + keyword',
        });
        names.push({
          name: `${secondKeyword} ${keyword}`,
          pattern: 'keyword2 + keyword1',
        });
      } else {
        names.push({
          name: `${capitalize(keyword)} & ${capitalize(secondKeyword)}`,
          pattern: 'keyword + & + keyword',
        });
        names.push({
          name: `${capitalize(secondKeyword)}${capitalize(keyword)}`,
          pattern: 'keyword2 + keyword1',
        });
      }
    }
  }
  
  // Ensure we have at least 10 names - Requirement 3.3
  while (names.length < 10) {
    const prefixes = language === 'ar' ? AR_PREFIXES[category] : EN_PREFIXES[category];
    const suffixes = language === 'ar' ? AR_SUFFIXES[category] : EN_SUFFIXES[category];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    if (language === 'ar') {
      names.push({
        name: `${randomPrefix} ${keyword} ${randomSuffix}`,
        pattern: 'random combination',
      });
    } else {
      names.push({
        name: `${randomPrefix}${capitalize(keyword)}${randomSuffix}`,
        pattern: 'random combination',
      });
    }
  }
  
  // Remove duplicates
  const uniqueNames = names.filter((name, index, self) =>
    index === self.findIndex(n => n.name === name.name)
  );
  
  return {
    names: uniqueNames,
    keyword,
    category,
  };
}
