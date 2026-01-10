"use client";

/**
 * Response Language Selector Component
 * Allows users to select their preferred language for AI responses
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 4.2, 4.3, 5.2
 */

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Globe, Check, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================
// Types
// ============================================

export interface LanguageOption {
  code: string;
  name: string;
  englishName: string;
}

export interface ResponseLanguageSelectorProps {
  onChange?: (language: string) => void;
  compact?: boolean;
}

export interface UseResponseLanguageReturn {
  responseLanguage: string;
  setResponseLanguage: (lang: string) => void;
  isCustomLanguage: boolean;
  languageDisplayName: string;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = "ai-response-language";

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "ar", name: "العربية", englishName: "Arabic" },
  { code: "en", name: "English", englishName: "English" },
  { code: "fr", name: "Français", englishName: "French" },
  { code: "es", name: "Español", englishName: "Spanish" },
  { code: "de", name: "Deutsch", englishName: "German" },
  { code: "tr", name: "Türkçe", englishName: "Turkish" },
  { code: "ur", name: "اردو", englishName: "Urdu" },
  { code: "zh", name: "中文", englishName: "Chinese" },
  { code: "hi", name: "हिन्दी", englishName: "Hindi" },
  { code: "pt", name: "Português", englishName: "Portuguese" },
];

// ============================================
// Hook: useResponseLanguage
// ============================================

export function useResponseLanguage(): UseResponseLanguageReturn {
  const locale = useLocale();
  const [responseLanguage, setResponseLanguageState] = useState<string>(locale);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setResponseLanguageState(stored);
      } else {
        // Default to current locale
        setResponseLanguageState(locale);
      }
    } catch (error) {
      console.error("Failed to load language preference:", error);
      setResponseLanguageState(locale);
    }
    setIsLoaded(true);
  }, [locale]);

  // Save to localStorage
  const setResponseLanguage = useCallback((lang: string) => {
    setResponseLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      console.error("Failed to save language preference:", error);
    }
  }, []);

  // Check if custom language
  const isCustomLanguage = !SUPPORTED_LANGUAGES.some(
    (l) => l.code === responseLanguage
  );

  // Get display name
  const languageDisplayName = isCustomLanguage
    ? responseLanguage.replace("custom:", "")
    : SUPPORTED_LANGUAGES.find((l) => l.code === responseLanguage)?.name ||
      responseLanguage;

  return {
    responseLanguage: isLoaded ? responseLanguage : locale,
    setResponseLanguage,
    isCustomLanguage,
    languageDisplayName,
  };
}

// ============================================
// Component: ResponseLanguageSelector
// ============================================

export function ResponseLanguageSelector({
  onChange,
  compact = false,
}: ResponseLanguageSelectorProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { responseLanguage, setResponseLanguage } = useResponseLanguage();
  
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customLanguage, setCustomLanguage] = useState("");

  // Check if current value is custom
  const isCurrentCustom = !SUPPORTED_LANGUAGES.some(
    (l) => l.code === responseLanguage
  ) && responseLanguage.startsWith("custom:");

  useEffect(() => {
    if (isCurrentCustom) {
      setShowCustomInput(true);
      setCustomLanguage(responseLanguage.replace("custom:", ""));
    }
  }, [isCurrentCustom, responseLanguage]);

  const handleLanguageChange = (value: string) => {
    if (value === "other") {
      setShowCustomInput(true);
      return;
    }
    
    setShowCustomInput(false);
    setResponseLanguage(value);
    onChange?.(value);
    
    const langName = SUPPORTED_LANGUAGES.find((l) => l.code === value)?.name || value;
    toast.success(
      isRTL 
        ? `تم تغيير لغة الرد إلى ${langName}` 
        : `Response language changed to ${langName}`
    );
  };

  const handleCustomLanguageSave = () => {
    if (!customLanguage.trim()) {
      toast.error(isRTL ? "الرجاء إدخال اسم اللغة" : "Please enter a language name");
      return;
    }
    
    const customValue = `custom:${customLanguage.trim()}`;
    setResponseLanguage(customValue);
    onChange?.(customValue);
    
    toast.success(
      isRTL 
        ? `تم تغيير لغة الرد إلى ${customLanguage}` 
        : `Response language changed to ${customLanguage}`
    );
  };

  const getCurrentValue = () => {
    if (showCustomInput || isCurrentCustom) return "other";
    return responseLanguage;
  };

  return (
    <div 
      className={`space-y-2 ${compact ? "" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">
          {isRTL ? "لغة الرد" : "Response Language"}
        </Label>
      </div>

      <Select value={getCurrentValue()} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isRTL ? "اختر اللغة" : "Select language"} />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                {lang.name}
                <span className="text-muted-foreground text-xs">
                  ({lang.englishName})
                </span>
              </span>
            </SelectItem>
          ))}
          <SelectItem value="other">
            <span className="flex items-center gap-2">
              {isRTL ? "أخرى..." : "Other..."}
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Custom language input */}
      {showCustomInput && (
        <div className="flex gap-2 mt-2">
          <Input
            value={customLanguage}
            onChange={(e) => setCustomLanguage(e.target.value)}
            placeholder={isRTL ? "أدخل اسم اللغة (مثل: Hindi)" : "Enter language name (e.g., Hindi)"}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCustomLanguageSave();
              }
            }}
          />
          <button
            onClick={handleCustomLanguageSave}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            aria-label={isRTL ? "حفظ" : "Save"}
          >
            <Check className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default ResponseLanguageSelector;
