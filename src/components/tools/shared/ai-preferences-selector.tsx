"use client";

/**
 * AI Preferences Selector Component
 * Combined component for language and currency selection in AI tools
 * 
 * Requirements: 5.1, 5.5
 */

import { useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Settings2 } from "lucide-react";
import { ResponseLanguageSelector } from "./response-language-selector";
import { CurrencySelector } from "./currency-selector";

// ============================================
// Types
// ============================================

export interface AIPreferencesSelectorProps {
  onLanguageChange?: (language: string) => void;
  onCurrencyChange?: (currency: string) => void;
  showLanguage?: boolean;
  showCurrency?: boolean;
  compact?: boolean;
}

// ============================================
// Component: AIPreferencesSelector
// ============================================

export function AIPreferencesSelector({
  onLanguageChange,
  onCurrencyChange,
  showLanguage = true,
  showCurrency = true,
  compact = false,
}: AIPreferencesSelectorProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";

  // Don't render if nothing to show
  if (!showLanguage && !showCurrency) {
    return null;
  }

  return (
    <Card className={compact ? "border-0 shadow-none bg-transparent" : ""}>
      <CardContent className={compact ? "p-0" : "p-4"}>
        <div 
          className="space-y-4"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Header */}
          {!compact && (
            <div className="flex items-center gap-2 pb-2 border-b">
              <Settings2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {isRTL ? "إعدادات الرد" : "Response Settings"}
              </span>
            </div>
          )}

          {/* Selectors Grid */}
          <div className={`grid gap-4 ${showLanguage && showCurrency ? "md:grid-cols-2" : "grid-cols-1"}`}>
            {showLanguage && (
              <ResponseLanguageSelector
                onChange={onLanguageChange}
                compact={compact}
              />
            )}
            
            {showCurrency && (
              <CurrencySelector
                onChange={onCurrencyChange}
                compact={compact}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AIPreferencesSelector;
