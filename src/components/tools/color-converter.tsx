"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Copy, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { parseColor, formatRgb, formatHsl, type ColorConvertResult } from "@/lib/calculators/color-converter";
import { ShareButtons } from "./shared/share-buttons";
import { SEOContent } from "./shared/seo-content";

export function ColorConverter() {
  const t = useTranslations("tools.colorConverter");
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';
  
  const [colorInput, setColorInput] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Parse color in real-time
  const result: ColorConvertResult = useMemo(() => {
    return parseColor(colorInput);
  }, [colorInput]);

  const handleCopy = async (value: string, field: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success(isRTL ? 'تم النسخ!' : 'Copied!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error(isRTL ? 'فشل النسخ' : 'Failed to copy');
    }
  };

  const getCopyText = () => {
    if (!result.isValid) return '';
    return `HEX: ${result.hex}\nRGB: ${formatRgb(result.rgb)}\nHSL: ${formatHsl(result.hsl)}`;
  };

  const colorFormats = [
    { key: 'hex', label: 'HEX', value: result.hex },
    { key: 'rgb', label: 'RGB', value: formatRgb(result.rgb) },
    { key: 'hsl', label: 'HSL', value: formatHsl(result.hsl) },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="color-input">
              {t("enterColor")}
            </Label>
            <Input
              id="color-input"
              placeholder={isRTL 
                ? 'أدخل اللون (مثال: #FF5733 أو rgb(255,87,51) أو hsl(11,100,60))'
                : 'Enter color (e.g., #FF5733, rgb(255,87,51), or hsl(11,100,60))'
              }
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {t("supportedFormats")}
            </p>
          </div>

          {/* Error Message */}
          {colorInput && !result.isValid && result.error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm">{result.error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result Section */}
      {result.isValid && (
        <Card ref={resultCardRef}>
          <CardHeader>
            <CardTitle>{t("convertedColors")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color Preview */}
            <div className="space-y-2">
              <Label>{t("preview")}</Label>
              <div 
                className="h-24 rounded-lg border shadow-inner"
                style={{ backgroundColor: result.hex }}
              />
            </div>

            {/* Color Formats */}
            <div className="grid gap-3">
              {colorFormats.map(({ key, label, value }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm w-12">{label}</span>
                    <code className="font-mono text-sm bg-background px-2 py-1 rounded">
                      {value}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(value, key)}
                    className="gap-1 shrink-0"
                  >
                    {copiedField === key ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>

            {/* RGB Values */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {result.rgb.r}
                </div>
                <div className="text-xs text-muted-foreground">R</div>
              </div>
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.rgb.g}
                </div>
                <div className="text-xs text-muted-foreground">G</div>
              </div>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.rgb.b}
                </div>
                <div className="text-xs text-muted-foreground">B</div>
              </div>
            </div>

            {/* Share Buttons */}
            <ShareButtons
              copyText={getCopyText()}
            />
          </CardContent>
        </Card>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="colorConverter" />
    </div>
  );
}
