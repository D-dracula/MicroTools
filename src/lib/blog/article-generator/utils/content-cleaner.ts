/**
 * Content Cleaner Utilities
 * 
 * وظائف تنظيف المحتوى من علامات الذكاء الاصطناعي
 */

// ============================================================================
// Content Cleaning
// ============================================================================

/**
 * تنظيف محتوى المقالة من علامات عدد الكلمات والتعليمات الوصفية
 * 
 * @param text - النص الخام من الذكاء الاصطناعي
 * @returns النص المنظف مع إزالة العلامات والتعليمات
 */
export function cleanArticleContent(text: string): string {
  if (!text) return text;

  return text
    // إزالة علامات عدد الكلمات مثل (150-200 words), (300 words), [Section 1: 400 words]
    .replace(/\(\d+(?:-\d+)?\s*words?\)/gi, '')
    .replace(/\[\d+(?:-\d+)?\s*words?\]/gi, '')
    .replace(/-\s*Target\s+Length:\s*\d+(?:-\d+)?\s*words?/gi, '')
    // إزالة عناوين الأقسام التي يضيفها الذكاء الاصطناعي أحياناً كتعليمات
    .replace(/^Section\s+\d+:\s*/gmi, '')
    // إزالة الأسطر الفارغة المتعددة الناتجة عن الإزالات
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * إزالة علامات JSON من المحتوى
 * 
 * @param content - المحتوى الذي قد يحتوي على علامات JSON
 * @returns المحتوى المنظف
 */
export function removeJsonMarkers(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, '') // إزالة كتل الكود
    .replace(/\{[\s\S]*?"content"\s*:\s*"/i, '') // إزالة بادئة JSON
    .replace(/"\s*,?\s*"tags"[\s\S]*$/i, '') // إزالة لاحقة JSON
    .trim();
}

/**
 * تنظيف العنوان من الأحرف الخاصة والمسافات الزائدة
 * 
 * @param title - العنوان الخام
 * @returns العنوان المنظف
 */
export function cleanTitle(title: string): string {
  return title
    .replace(/^["'\s]+|["'\s]+$/g, '') // إزالة علامات الاقتباس والمسافات من البداية والنهاية
    .replace(/\s+/g, ' ') // استبدال المسافات المتعددة بمسافة واحدة
    .trim();
}

/**
 * تنظيف الملخص من الأحرف الخاصة
 * 
 * @param summary - الملخص الخام
 * @returns الملخص المنظف
 */
export function cleanSummary(summary: string): string {
  return summary
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * تنظيف الوسوم من الأحرف الخاصة
 * 
 * @param tags - مصفوفة الوسوم الخام
 * @returns مصفوفة الوسوم المنظفة
 */
export function cleanTags(tags: string[]): string[] {
  return tags
    .map(tag => tag.toLowerCase().trim())
    .filter(tag => tag.length > 0)
    .slice(0, 5); // الاحتفاظ بأول 5 وسوم فقط
}
