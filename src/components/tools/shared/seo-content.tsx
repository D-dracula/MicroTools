"use client";

import { useTranslations, useLocale } from "next-intl";

interface SEOContentProps {
  toolSlug: string;
}

/**
 * SEO Content Component
 * Renders SEO-optimized content for calculator tools with proper semantic HTML
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 12.1, 12.10
 */
export function SEOContent({ toolSlug }: SEOContentProps) {
  const t = useTranslations(`tools.${toolSlug}`);
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Helper to safely get translation without throwing errors
  const safeT = (key: string): string | null => {
    try {
      // Use t.has() to check if key exists before getting value
      const fullKey = `seo.${key}`;
      const raw = (t as any).raw ? (t as any).raw(fullKey) : null;
      if (raw === undefined || raw === null) return null;
      
      const value = t(fullKey);
      // Check if it's a valid translation (not the key itself or error message)
      if (value && typeof value === 'string' && !value.includes(fullKey) && !value.includes('MISSING_MESSAGE')) {
        return value;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Try to get SEO content with fallbacks
  const whatIsTitle = safeT("whatIs");
  const whatIsContent = safeT("whatIsContent");
  
  // Support both "formula" and "howItWorks" keys
  const formulaTitle = safeT("formula") || safeT("howItWorks");
  const formulaContent = safeT("formulaContent") || safeT("howItWorksContent");
  
  const whyNeedTitle = safeT("whyNeed");
  const whyNeedContent = safeT("whyNeedContent");

  // Check if we have any valid content
  if (!whatIsContent && !formulaContent && !whyNeedContent) {
    return null;
  }

  return (
    <article
      className="w-full max-w-2xl mx-auto mt-8 prose prose-slate dark:prose-invert"
      dir={isRTL ? "rtl" : "ltr"}
      aria-label={isRTL ? "معلومات عن الأداة" : "Tool information"}
    >
      {/* What is this tool? - Requirement 1.3 */}
      {whatIsContent && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-foreground">
            {whatIsTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {whatIsContent}
          </p>
        </section>
      )}

      {/* Formula/Method explanation - Requirement 1.4 */}
      {formulaContent && (
        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-foreground">
            {formulaTitle}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {formulaContent}
          </p>
        </section>
      )}

      {/* Why merchants need this - Requirement 1.5 */}
      {whyNeedContent && (
        <section className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-foreground">
            {whyNeedTitle}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {whyNeedContent}
          </p>
        </section>
      )}
    </article>
  );
}
