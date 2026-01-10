"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Image as ImageIcon,
  Upload,
  Download,
  Trash2,
  Loader2,
  Check,
  Archive,
  Copy,
  Code,
} from "lucide-react";
import { toast } from "sonner";
import {
  generateFavicons,
  createZipFromFavicons,
  downloadFavicon,
  copyToClipboard,
  isValidImageFile,
  isValidFileSize,
  FAVICON_SIZES,
  type FaviconResult,
  type GeneratedFavicon,
} from "@/lib/calculators/favicon-generation";
import { SEOContent, ExportButtons } from "@/components/tools/shared";

/**
 * Favicon Generator Component
 * Convert logo to favicon in all required sizes
 * Requirements: 13.1-13.12
 */
export function FaviconGenerator() {
  const t = useTranslations("tools.faviconGenerator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [useBackground, setUseBackground] = useState(false);
  const [result, setResult] = useState<FaviconResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!isValidImageFile(selectedFile)) {
      toast.error(isRTL ? "صيغة غير مدعومة. استخدم PNG, JPG, GIF, WebP, أو SVG" : "Unsupported format. Use PNG, JPG, GIF, WebP, or SVG");
      return;
    }
    if (!isValidFileSize(selectedFile)) {
      toast.error(isRTL ? "الملف كبير جداً (الحد 10MB)" : "File too large (max 10MB)");
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

  // Generate favicons
  const handleGenerate = useCallback(async () => {
    if (!file || isGenerating) return;

    setIsGenerating(true);
    try {
      const faviconResult = await generateFavicons({
        file,
        backgroundColor: useBackground ? backgroundColor : undefined,
      });
      setResult(faviconResult);
      toast.success(t("generationComplete"));
    } catch (error) {
      console.error("Generation error:", error);
      toast.error(t("generationFailed"));
    } finally {
      setIsGenerating(false);
    }
  }, [file, useBackground, backgroundColor, isGenerating, t]);

  // Download all as ZIP
  const handleDownloadZip = useCallback(async () => {
    if (!result) return;

    setIsDownloadingZip(true);
    try {
      const zipBlob = await createZipFromFavicons(result);
      
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `favicons-${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success(isRTL ? "تم تحميل الملف المضغوط!" : "ZIP downloaded!");
    } catch (error) {
      console.error("ZIP creation error:", error);
      toast.error(isRTL ? "فشل إنشاء الملف المضغوط" : "Failed to create ZIP");
    } finally {
      setIsDownloadingZip(false);
    }
  }, [result, isRTL]);

  // Copy HTML snippet
  const handleCopySnippet = useCallback(async () => {
    if (!result) return;
    
    await copyToClipboard(result.htmlSnippet);
    setCopiedSnippet(true);
    toast.success(isRTL ? "تم نسخ الكود!" : "Code copied!");
    
    setTimeout(() => setCopiedSnippet(false), 2000);
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

    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${isRTL ? "الأحجام المولدة" : "Generated Sizes"}:
${result.favicons.map(f => `• ${f.filename}`).join('\n')}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [result, t, isRTL]);

  // Export data
  const exportData = useMemo(() => {
    if (!result) return { inputs: {}, results: {} };

    return {
      inputs: {
        [isRTL ? "الأبعاد الأصلية" : "Original Dimensions"]: `${result.originalDimensions.width}×${result.originalDimensions.height}`,
      },
      results: {
        [isRTL ? "عدد الملفات" : "Files Generated"]: result.favicons.length,
      },
      metadata: {
        toolName: t("title"),
        date: new Date().toLocaleDateString(locale),
        locale,
      },
    };
  }, [result, t, locale, isRTL]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Background Color Option */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useBackground}
                onChange={(e) => setUseBackground(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t("useBackground")}</span>
            </label>
            {useBackground && (
              <Input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-8 p-1"
              />
            )}
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
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              onChange={handleInputChange}
              className="hidden"
              aria-hidden="true"
            />
            
            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt={file?.name || "Preview"}
                  className="max-h-32 mx-auto rounded-lg object-contain"
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
                  <p className="text-xs text-muted-foreground">
                    {t("recommendedSize")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {file && (
            <div className="flex gap-2 justify-center">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("generating")}
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    {t("generateFavicons")}
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
            {/* Browser Tab Preview */}
            <div className="space-y-2">
              <Label>{t("browserPreview")}</Label>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 bg-background rounded-t-lg px-3 py-2 border-b max-w-xs">
                  {result.favicons.find(f => f.size === 16) && (
                    <img
                      src={URL.createObjectURL(result.favicons.find(f => f.size === 16)!.blob)}
                      alt="Favicon preview"
                      className="w-4 h-4"
                    />
                  )}
                  <span className="text-sm truncate">{isRTL ? "متجري الإلكتروني" : "My Store"}</span>
                  <span className="text-muted-foreground ml-auto">×</span>
                </div>
                <div className="bg-background rounded-b-lg p-4 text-center text-muted-foreground text-sm">
                  {t("browserPreviewHint")}
                </div>
              </div>
            </div>

            {/* Generated Favicons Grid */}
            <div className="space-y-2">
              <Label>{t("generatedSizes")}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {result.favicons.map((favicon) => (
                  <div
                    key={favicon.filename}
                    className="border rounded-lg p-3 text-center space-y-2"
                  >
                    <div className="h-16 flex items-center justify-center bg-muted/30 rounded">
                      <img
                        src={URL.createObjectURL(favicon.blob)}
                        alt={favicon.filename}
                        className="max-w-full max-h-full object-contain"
                        style={{ 
                          width: favicon.size > 64 ? 64 : favicon.size || 32,
                          height: favicon.size > 64 ? 64 : favicon.size || 32,
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium truncate" title={favicon.filename}>
                        {favicon.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {favicon.size ? `${favicon.size}×${favicon.size}` : 'ICO'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        downloadFavicon(favicon);
                        toast.success(isRTL ? "تم التحميل!" : "Downloaded!");
                      }}
                      className="w-full h-7 text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {t("download")}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* HTML Snippet */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("htmlSnippet")}</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopySnippet}
                  className="gap-1"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      {isRTL ? "تم النسخ" : "Copied"}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t("copyCode")}
                    </>
                  )}
                </Button>
              </div>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto">
                <code>{result.htmlSnippet}</code>
              </pre>
            </div>

            {/* Download All Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleDownloadZip}
                disabled={isDownloadingZip}
                className="gap-2"
                size="lg"
              >
                {isDownloadingZip ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {isRTL ? "جاري الإنشاء..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Archive className="h-5 w-5" />
                    {t("downloadAll")}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Buttons */}
      {result && (
        <ExportButtons
          data={exportData}
          filename="favicon-generation"
          title={t("title")}
          copyText={copyText}
        />
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="faviconGenerator" />
    </div>
  );
}
