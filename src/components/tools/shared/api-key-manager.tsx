"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Loader2, 
  Key, 
  Trash2,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { 
  storeApiKey, 
  getApiKey, 
  removeApiKey, 
  hasStoredApiKey 
} from "@/lib/ai-tools/encryption";
import { 
  validateApiKey, 
  getUsage, 
  estimateCost 
} from "@/lib/ai-tools/openrouter-client";

interface ApiKeyManagerProps {
  onApiKeyChange?: (apiKey: string | null) => void;
  onValidationChange?: (isValid: boolean) => void;
  estimatedTokens?: number;
  compact?: boolean;
}

interface UsageInfo {
  credits: number;
  used: number;
}

/**
 * API Key Manager Component
 * Handles OpenRouter API key input, validation, and storage
 * Requirements: 1.1, 1.4, 1.5
 */
export function ApiKeyManager({
  onApiKeyChange,
  onValidationChange,
  estimatedTokens,
  compact = false,
}: ApiKeyManagerProps) {
  const t = useTranslations("aiTools");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasStored, setHasStored] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored API key on mount
  useEffect(() => {
    const loadStoredKey = async () => {
      try {
        const stored = await getApiKey();
        if (stored) {
          setApiKey(stored);
          setHasStored(true);
          // Validate stored key
          await handleValidate(stored);
        }
      } catch (error) {
        console.error("Failed to load stored API key:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredKey();
  }, []);

  // Notify parent of API key changes
  useEffect(() => {
    onApiKeyChange?.(isValid ? apiKey : null);
  }, [apiKey, isValid, onApiKeyChange]);

  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange?.(isValid === true);
  }, [isValid, onValidationChange]);

  /**
   * Validate the API key
   */
  const handleValidate = useCallback(async (keyToValidate?: string) => {
    const key = keyToValidate || apiKey;
    if (!key.trim()) {
      setIsValid(null);
      setErrorMessage(null);
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);

    try {
      const result = await validateApiKey(key);
      setIsValid(result.valid);
      
      if (!result.valid) {
        setErrorMessage(result.error || (isRTL ? "مفتاح غير صالح" : "Invalid key"));
      } else {
        // Fetch usage info on successful validation
        const usageInfo = await getUsage(key);
        setUsage(usageInfo);
        
        // Store the valid key
        await storeApiKey(key);
        setHasStored(true);
        toast.success(isRTL ? "تم حفظ مفتاح API بنجاح" : "API key saved successfully");
      }
    } catch (error) {
      setIsValid(false);
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : (isRTL ? "فشل التحقق" : "Validation failed")
      );
    } finally {
      setIsValidating(false);
    }
  }, [apiKey, isRTL]);

  /**
   * Handle key input change
   */
  const handleKeyChange = (value: string) => {
    setApiKey(value);
    setIsValid(null);
    setErrorMessage(null);
  };

  /**
   * Remove stored API key
   */
  const handleRemoveKey = () => {
    removeApiKey();
    setApiKey("");
    setIsValid(null);
    setErrorMessage(null);
    setHasStored(false);
    setUsage(null);
    onApiKeyChange?.(null);
    toast.success(isRTL ? "تم حذف مفتاح API" : "API key removed");
  };

  /**
   * Calculate estimated cost
   */
  const estimatedCost = estimatedTokens 
    ? estimateCost(estimatedTokens, Math.ceil(estimatedTokens * 0.5))
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div 
      className={`space-y-4 ${compact ? "p-3" : "p-4"} bg-muted/50 rounded-lg border`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Key className="h-5 w-5 text-primary" />
        <Label className="text-base font-medium">
          {isRTL ? "مفتاح OpenRouter API" : "OpenRouter API Key"}
        </Label>
        {isValid === true && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="h-4 w-4" />
            {isRTL ? "متصل" : "Connected"}
          </span>
        )}
      </div>

      {/* API Key Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder={isRTL ? "sk-or-..." : "sk-or-..."}
              className={`pr-10 ${
                isValid === true 
                  ? "border-green-500 focus:ring-green-500" 
                  : isValid === false 
                    ? "border-red-500 focus:ring-red-500" 
                    : ""
              }`}
              disabled={isValidating}
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              aria-label={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          
          <Button
            onClick={() => handleValidate()}
            disabled={isValidating || !apiKey.trim()}
            variant={isValid === true ? "outline" : "default"}
            size="default"
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isValid === true ? (
              <Check className="h-4 w-4" />
            ) : (
              isRTL ? "تحقق" : "Validate"
            )}
          </Button>

          {hasStored && (
            <Button
              onClick={handleRemoveKey}
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              aria-label={isRTL ? "حذف المفتاح" : "Remove key"}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <X className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        {/* Get API Key Link */}
        {!isValid && (
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {isRTL ? "احصل على مفتاح API من OpenRouter" : "Get an API key from OpenRouter"}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Usage & Cost Info */}
      {isValid === true && (
        <div className="space-y-2 pt-2 border-t">
          {/* Usage Display */}
          {usage && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isRTL ? "الرصيد المتبقي:" : "Remaining credits:"}
              </span>
              <span className="font-medium">
                ${(usage.credits - usage.used).toFixed(4)}
              </span>
            </div>
          )}

          {/* Estimated Cost Warning */}
          {estimatedCost !== null && estimatedCost > 0 && (
            <div className="flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-amber-800 dark:text-amber-200">
                  {isRTL 
                    ? `التكلفة التقديرية: $${estimatedCost.toFixed(4)} (${estimatedTokens?.toLocaleString()} توكن)`
                    : `Estimated cost: $${estimatedCost.toFixed(4)} (${estimatedTokens?.toLocaleString()} tokens)`
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
