"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Palette,
  Upload,
  Copy,
  Check,
  Loader2,
  Trash2,
  Code,
} from "lucide-react";
import { toast } from "sonner";
import {
  extractColors,
  generateCssVariables,
  copyToClipboard,
  getContrastColor,
  isValidImageFile,
  isValidFileSize,
  DEFAULT_COLOR_COUNT,
  type ColorExtractionResult,
  type ExtractedColor,
} from "@/lib/calculators/color-extraction";
import { SEOContent, ExportButtons } from "@/components/tools/shared";

/**
 * Color Extractor Component
 * Extracts dominant colors from images for brand consistency
 * Requirements: 11.1-11.12
 */
export function ColorExtractor() {
  const t = useTranslations("tools.colorExtractor");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [colorCount, setColorCount] = useState(DEFAULT_COLOR_COUNT);
  const [result, setResult] = useState<ColorExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!isValidImageFile(selectedFile)) {
      toast.error(isRTL ? "صيغة غير مدعومة" : "Unsupported format");
      return;
    }
    if (!isValidFileSize(selectedFile)) {
      toast.error(isRTL ? "الملف كبير جداً (الحد 50MB)" : "File too large (max 50MB)");
      return;
    }

    // Clean up previous preview
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
  }, [preview, isRTL]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
    e.target.value = "";
  }, [handleFileSelect]);

  // Extract colors
  const handleExtract = useCallback(async () => {
    if (!file || isExtracting) return;

    setIsExtracting(true);
    try {
      const extractionResult = await extractColors({ file, colorCount });
      setResult(extractionResult);
      toast.success(t("extractionComplete"));
    } catch (error) {
      console.error("Extraction error:", error);
      toast.error(t("extractionFailed"));
    } finally {
      setIsExtracting(false);
    }
  }, [file, colorCount, isExtracting, t]);

  // Copy color to clipboard
  const handleCopyColor = useCallback(async (color: ExtractedColor, format: 'hex' | 'rgb' | 'hsl') => {
    let text: string;
    switch (format) {
      case 'hex':
        text = color.hex;
        break;
      case 'rgb':
        text = `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`;
        break;
      case 'hsl':
        text = `hsl(${color.hsl.h}, ${color.hsl.s}%, ${color.hsl.l}%)`;
        break;
    }
    
    await copyToClipboard(text);
    setCopiedColor(`${color.hex}-${format}`);
    toast.success(isRTL ? "تم النسخ!" : "Copied!");
    
    setTimeout(() => setCopiedColor(null), 2000);
  }, [isRTL]);

  // Copy CSS variables
  const handleCopyCss = useCallback(async () => {
    if (!result) return;
    const css = generateCssVariables(result.colors);
    await copyToClipboard(css);
    toast.success(isRTL ? "تم نسخ متغيرات CSS!" : "CSS variables copied!");
  }, [result, isRTL]);

  // Clear all
  const handleClear = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setResult(null);
  }, [preview]);

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!result) return "";

    const colorLines = result.colors
      .map((c, i) => `${i + 1}. ${c.hex} (${c.percentage}%)`)
      .join('\n');

    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${isRTL ? "الألوان المستخرجة" : "Extracted Colors"}:
${colorLines}
━━━━━━━━━━━━━━━━━━
${isRTL ? "الألوان المكملة" : "Complementary"}: ${result.complementary.join(', ')}
${isRTL ? "الألوان المتجاورة" : "Analogous"}: ${result.analogous.join(', ')}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [result, t, isRTL]);

  // Export data
  const exportData = useMemo(() => {
    if (!result) return { inputs: {}, results: {} };

    return {
      inputs: {
        [isRTL ? "عدد الألوان" : "Color Count"]: colorCount,
      },
      results: {
        [isRTL ? "اللون السائد" : "Dominant Color"]: result.dominantColor.hex,
      },
      comparisonTable: {
        headers: [
          "#",
          isRTL ? "اللون" : "Color",
          "HEX",
          "RGB",
          "HSL",
          isRTL ? "النسبة" : "Percentage",
        ],
        rows: result.colors.map((c, i) => [
          i + 1,
          "",
          c.hex,
          `rgb(${c.rgb.r}, ${c.rgb.g}, ${c.rgb.b})`,
          `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
          `${c.percentage}%`,
        ]),
      },
      metadata: {
        toolName: t("title"),
        date: new Date().toLocaleDateString(locale),
        locale,
      },
    };
  }, [result, colorCount, t, locale, isRTL]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Count Selection */}
          <div className="space-y-2">
            <Label htmlFor="colorCount">{t("colorCount")}</Label>
            <div className="flex items-center gap-4">
              <Input
                id="colorCount"
                type="number"
                min={5}
                max={10}
                value={colorCount}
                onChange={(e) => setColorCount(Math.max(5, Math.min(10, parseInt(e.target.value) || 6)))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                {t("colorCountHint")}
              </span>
            </div>
          </div>

          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                fileInputRef.current?.click();
              }
            }}
            aria-label={t("uploadDescription")}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
              onChange={handleInputChange}
              className="hidden"
              aria-hidden="true"
            />
            
            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt={file?.name || "Preview"}
                  className="max-h-48 mx-auto rounded-lg object-contain"
                />
                <p className="text-sm text-muted-foreground">{file?.name}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className={`p-4 rounded-full ${isDragging ? "bg-primary/10" : "bg-muted"}`}>
                  <Upload className={`h-8 w-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="font-medium">
                    {isDragging ? t("dropHere") : t("uploadDescription")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("supportedFormats")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {file && (
            <div className="flex gap-2 justify-center">
              <Button
                onClick={handleExtract}
                disabled={isExtracting}
                className="gap-2"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("extracting")}
                  </>
                ) : (
                  <>
                    <Palette className="h-4 w-4" />
                    {t("extractColors")}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClear} className="gap-2">
                <Trash2 className="h-4 w-4" />
                {t("clear")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Results Section */}
      {result && (
        <Card ref={resultCardRef}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" aria-hidden="true" />
              {t("results")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Color Palette */}
            <div className="space-y-3">
              <Label>{t("extractedColors")}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {result.colors.map((color, index) => (
                  <div
                    key={`${color.hex}-${index}`}
                    className="rounded-lg border overflow-hidden"
                  >
                    {/* Color Swatch */}
                    <div
                      className="h-20 flex items-center justify-center"
                      style={{ backgroundColor: color.hex }}
                    >
                      <span
                        className="text-sm font-medium px-2 py-1 rounded"
                        style={{ color: getContrastColor(color.hex) }}
                      >
                        {color.percentage}%
                      </span>
                    </div>
                    
                    {/* Color Info */}
                    <div className="p-2 space-y-1 bg-muted/30">
                      {/* HEX */}
                      <button
                        onClick={() => handleCopyColor(color, 'hex')}
                        className="w-full flex items-center justify-between text-xs hover:bg-muted rounded px-1 py-0.5"
                      >
                        <span className="font-mono">{color.hex}</span>
                        {copiedColor === `${color.hex}-hex` ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                      
                      {/* RGB */}
                      <button
                        onClick={() => handleCopyColor(color, 'rgb')}
                        className="w-full flex items-center justify-between text-xs hover:bg-muted rounded px-1 py-0.5"
                      >
                        <span className="font-mono text-muted-foreground">
                          {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
                        </span>
                        {copiedColor === `${color.hex}-rgb` ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                      
                      {/* HSL */}
                      <button
                        onClick={() => handleCopyColor(color, 'hsl')}
                        className="w-full flex items-center justify-between text-xs hover:bg-muted rounded px-1 py-0.5"
                      >
                        <span className="font-mono text-muted-foreground">
                          {color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%
                        </span>
                        {copiedColor === `${color.hex}-hsl` ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Color Suggestions */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Complementary */}
              <div className="space-y-2">
                <Label>{t("complementary")}</Label>
                <div className="flex gap-2">
                  <div
                    className="w-12 h-12 rounded-lg border"
                    style={{ backgroundColor: result.dominantColor.hex }}
                    title={result.dominantColor.hex}
                  />
                  <span className="text-muted-foreground self-center">→</span>
                  {result.complementary.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => copyToClipboard(hex).then(() => toast.success(isRTL ? "تم النسخ!" : "Copied!"))}
                      className="w-12 h-12 rounded-lg border hover:ring-2 ring-primary transition-all"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>

              {/* Analogous */}
              <div className="space-y-2">
                <Label>{t("analogous")}</Label>
                <div className="flex gap-2">
                  {result.analogous.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => copyToClipboard(hex).then(() => toast.success(isRTL ? "تم النسخ!" : "Copied!"))}
                      className="w-12 h-12 rounded-lg border hover:ring-2 ring-primary transition-all"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                  <div
                    className="w-12 h-12 rounded-lg border ring-2 ring-primary"
                    style={{ backgroundColor: result.dominantColor.hex }}
                    title={`${result.dominantColor.hex} (${isRTL ? "السائد" : "dominant"})`}
                  />
                </div>
              </div>

              {/* Triadic */}
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("triadic")}</Label>
                <div className="flex gap-2">
                  <div
                    className="w-12 h-12 rounded-lg border ring-2 ring-primary"
                    style={{ backgroundColor: result.dominantColor.hex }}
                    title={result.dominantColor.hex}
                  />
                  {result.triadic.map((hex) => (
                    <button
                      key={hex}
                      onClick={() => copyToClipboard(hex).then(() => toast.success(isRTL ? "تم النسخ!" : "Copied!"))}
                      className="w-12 h-12 rounded-lg border hover:ring-2 ring-primary transition-all"
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Export as CSS */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleCopyCss}
                className="gap-2"
              >
                <Code className="h-4 w-4" />
                {t("exportCss")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Buttons */}
      {result && (
        <ExportButtons
          data={exportData}
          filename="color-extraction"
          title={t("title")}
          copyText={copyText}
        />
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="colorExtractor" />
    </div>
  );
}
