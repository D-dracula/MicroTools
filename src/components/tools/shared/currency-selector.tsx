"use client";

/**
 * Currency Selector Component
 * Allows users to select their preferred currency for AI tool displays
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4
 */

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Coins, Check } from "lucide-react";
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

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  englishName: string;
}

export interface CurrencySelectorProps {
  onChange?: (currency: string) => void;
  compact?: boolean;
}

export interface UseDisplayCurrencyReturn {
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => void;
  isCustomCurrency: boolean;
  currencySymbol: string;
  formatAmount: (amount: number) => string;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = "ai-display-currency";

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: "SAR", symbol: "ر.س", name: "ريال سعودي", englishName: "Saudi Riyal" },
  { code: "USD", symbol: "$", name: "دولار أمريكي", englishName: "US Dollar" },
  { code: "EUR", symbol: "€", name: "يورو", englishName: "Euro" },
  { code: "GBP", symbol: "£", name: "جنيه إسترليني", englishName: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "درهم إماراتي", englishName: "UAE Dirham" },
  { code: "MAD", symbol: "د.م", name: "درهم مغربي", englishName: "Moroccan Dirham" },
  { code: "EGP", symbol: "ج.م", name: "جنيه مصري", englishName: "Egyptian Pound" },
  { code: "KWD", symbol: "د.ك", name: "دينار كويتي", englishName: "Kuwaiti Dinar" },
  { code: "QAR", symbol: "ر.ق", name: "ريال قطري", englishName: "Qatari Riyal" },
  { code: "BHD", symbol: "د.ب", name: "دينار بحريني", englishName: "Bahraini Dinar" },
  { code: "OMR", symbol: "ر.ع", name: "ريال عماني", englishName: "Omani Rial" },
  { code: "JOD", symbol: "د.أ", name: "دينار أردني", englishName: "Jordanian Dinar" },
  { code: "TRY", symbol: "₺", name: "ليرة تركية", englishName: "Turkish Lira" },
  { code: "INR", symbol: "₹", name: "روبية هندية", englishName: "Indian Rupee" },
];

// ============================================
// Hook: useDisplayCurrency
// ============================================

export function useDisplayCurrency(): UseDisplayCurrencyReturn {
  const locale = useLocale();
  const defaultCurrency = locale === "ar" ? "SAR" : "USD";
  const [displayCurrency, setDisplayCurrencyState] = useState<string>(defaultCurrency);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setDisplayCurrencyState(stored);
      } else {
        // Default based on locale
        setDisplayCurrencyState(defaultCurrency);
      }
    } catch (error) {
      console.error("Failed to load currency preference:", error);
      setDisplayCurrencyState(defaultCurrency);
    }
    setIsLoaded(true);
  }, [defaultCurrency]);

  // Save to localStorage
  const setDisplayCurrency = useCallback((currency: string) => {
    setDisplayCurrencyState(currency);
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch (error) {
      console.error("Failed to save currency preference:", error);
    }
  }, []);

  // Check if custom currency
  const isCustomCurrency = !SUPPORTED_CURRENCIES.some(
    (c) => c.code === displayCurrency
  ) && displayCurrency.startsWith("custom:");

  // Get currency symbol
  const currencySymbol = isCustomCurrency
    ? displayCurrency.replace("custom:", "")
    : SUPPORTED_CURRENCIES.find((c) => c.code === displayCurrency)?.symbol ||
      displayCurrency;

  // Format amount with currency
  const formatAmount = useCallback((amount: number): string => {
    const currencyCode = isCustomCurrency 
      ? displayCurrency.replace("custom:", "") 
      : displayCurrency;
    
    try {
      return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      // Fallback for unknown currency codes
      const symbol = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode)?.symbol || currencyCode;
      return `${symbol} ${amount.toFixed(2)}`;
    }
  }, [displayCurrency, isCustomCurrency, locale]);

  return {
    displayCurrency: isLoaded ? displayCurrency : defaultCurrency,
    setDisplayCurrency,
    isCustomCurrency,
    currencySymbol,
    formatAmount,
  };
}

// ============================================
// Component: CurrencySelector
// ============================================

export function CurrencySelector({
  onChange,
  compact = false,
}: CurrencySelectorProps) {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { displayCurrency, setDisplayCurrency } = useDisplayCurrency();
  
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCurrency, setCustomCurrency] = useState("");

  // Check if current value is custom
  const isCurrentCustom = !SUPPORTED_CURRENCIES.some(
    (c) => c.code === displayCurrency
  ) && displayCurrency.startsWith("custom:");

  useEffect(() => {
    if (isCurrentCustom) {
      setShowCustomInput(true);
      setCustomCurrency(displayCurrency.replace("custom:", ""));
    }
  }, [isCurrentCustom, displayCurrency]);

  const handleCurrencyChange = (value: string) => {
    if (value === "other") {
      setShowCustomInput(true);
      return;
    }
    
    setShowCustomInput(false);
    setDisplayCurrency(value);
    onChange?.(value);
    
    const currency = SUPPORTED_CURRENCIES.find((c) => c.code === value);
    const displayName = currency ? `${currency.symbol} ${currency.englishName}` : value;
    toast.success(
      isRTL 
        ? `تم تغيير العملة إلى ${currency?.name || value}` 
        : `Currency changed to ${displayName}`
    );
  };

  const handleCustomCurrencySave = () => {
    if (!customCurrency.trim()) {
      toast.error(isRTL ? "الرجاء إدخال رمز العملة" : "Please enter a currency code");
      return;
    }
    
    // Validate currency code (should be 3 letters)
    const code = customCurrency.trim().toUpperCase();
    if (code.length !== 3) {
      toast.error(
        isRTL 
          ? "رمز العملة يجب أن يكون 3 أحرف (مثل: USD)" 
          : "Currency code must be 3 letters (e.g., USD)"
      );
      return;
    }
    
    const customValue = `custom:${code}`;
    setDisplayCurrency(customValue);
    onChange?.(customValue);
    
    toast.success(
      isRTL 
        ? `تم تغيير العملة إلى ${code}` 
        : `Currency changed to ${code}`
    );
  };

  const getCurrentValue = () => {
    if (showCustomInput || isCurrentCustom) return "other";
    return displayCurrency;
  };

  return (
    <div 
      className={`space-y-2 ${compact ? "" : ""}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">
          {isRTL ? "العملة" : "Currency"}
        </Label>
      </div>

      <Select value={getCurrentValue()} onValueChange={handleCurrencyChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isRTL ? "اختر العملة" : "Select currency"} />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CURRENCIES.map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <span className="flex items-center gap-2">
                <span className="font-medium w-8">{currency.symbol}</span>
                <span>{isRTL ? currency.name : currency.englishName}</span>
                <span className="text-muted-foreground text-xs">
                  ({currency.code})
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

      {/* Custom currency input */}
      {showCustomInput && (
        <div className="flex gap-2 mt-2">
          <Input
            value={customCurrency}
            onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
            placeholder={isRTL ? "رمز العملة (مثل: CNY)" : "Currency code (e.g., CNY)"}
            className="flex-1"
            maxLength={3}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCustomCurrencySave();
              }
            }}
          />
          <button
            onClick={handleCustomCurrencySave}
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

export default CurrencySelector;
