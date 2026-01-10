"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ShareButtonsProps {
  copyText: string;
  onCopySuccess?: () => void;
}

/**
 * Share Buttons Component
 * Provides "Copy Result" functionality
 * Requirements: 1.6, 1.8, 13.7, 13.9, 13.11
 */
export function ShareButtons({
  copyText,
  onCopySuccess,
}: ShareButtonsProps) {
  const t = useTranslations("share");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [isCopying, setIsCopying] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  /**
   * Copy result text to clipboard - Requirement 1.8, 13.7
   */
  const handleCopy = useCallback(async () => {
    if (isCopying) return;

    setIsCopying(true);
    try {
      // Check if Clipboard API is supported
      if (!navigator.clipboard) {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = copyText;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      } else {
        await navigator.clipboard.writeText(copyText);
      }

      // Show success feedback - Requirement 13.9
      setJustCopied(true);
      toast.success(t("copied"));
      onCopySuccess?.();

      // Reset copied state after 2 seconds
      setTimeout(() => setJustCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error(isRTL ? "فشل النسخ" : "Failed to copy");
    } finally {
      setIsCopying(false);
    }
  }, [copyText, isCopying, t, isRTL, onCopySuccess]);

  return (
    <div
      className="flex flex-wrap gap-3 justify-center"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Copy Result Button - Requirement 1.6 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        disabled={isCopying}
        className="gap-2"
        aria-label={t("copyResult")}
      >
        {justCopied ? (
          <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
        {t("copyResult")}
      </Button>
    </div>
  );
}
