"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Stamp,
  Upload,
  Download,
  Trash2,
  Loader2,
  Check,
  Archive,
  Type,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  applyWatermark,
  createZipFromResults,
  downloadImage,
  isValidImageFile,
  isValidFileSize,
  POSITION_LABELS,
  FONT_FAMILIES,
  DEFAULT_FONT_SETTINGS,
  type WatermarkPosition,
  type WatermarkType,
  type WatermarkResult,
  type FontSettings,
} from "@/lib/calculators/watermark";
import { SEOContent, ExportButtons } from "@/components/tools/shared";

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

interface ProcessedFile extends UploadedFile {
  result?: WatermarkResult;
  error?: string;
  isProcessing?: boolean;
}

/**
 * Watermark Creator Component
 * Add transparent watermarks to protect product images
 * Requirements: 12.1-12.12
 */
export function WatermarkCreator() {
  const t = useTranslations("tools.watermarkCreator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  // State
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [watermarkType, setWatermarkType] = useState<WatermarkType>('text');
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
  const [watermarkImagePreview, setWatermarkImagePreview] = useState<string | null>(null);
  const [watermarkText, setWatermarkText] = useState('');
  const [position, setPosition] = useState<WatermarkPosition>('bottom-right');
  const [opacity, setOpacity] = useState(30);
  const [size, setSize] = useState(15);
  const [rotation, setRotation] = useState(0);
  const [fontSettings, setFontSettings] = useState<FontSettings>(DEFAULT_FONT_SETTINGS);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Generate unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: ProcessedFile[] = [];
    
    Array.from(selectedFiles).forEach((file) => {
      if (!isValidImageFile(file)) {
        toast.error(`${file.name}: ${isRTL ? "صيغة غير مدعومة" : "Unsupported format"}`);
        return;
      }
      if (!isValidFileSize(file)) {
        toast.error(`${file.name}: ${isRTL ? "الملف كبير جداً (الحد 50MB)" : "File too large (max 50MB)"}`);
        return;
      }

      newFiles.push({
        file,
        preview: URL.createObjectURL(file),
        id: generateId(),
      });
    });

    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }, [isRTL]);

  // Handle watermark image selection
  const handleWatermarkImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isValidImageFile(file)) {
      toast.error(isRTL ? "صيغة غير مدعومة" : "Unsupported format");
      return;
    }

    if (watermarkImagePreview) {
      URL.revokeObjectURL(watermarkImagePreview);
    }

    setWatermarkImage(file);
    setWatermarkImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  }, [watermarkImagePreview, isRTL]);

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
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    e.target.value = "";
  }, [handleFileSelect]);

  // Remove a file
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // Clear all files
  const clearAll = useCallback(() => {
    files.forEach((file) => {
      URL.revokeObjectURL(file.preview);
    });
    setFiles([]);
  }, [files]);

  // Process all files
  const processAll = useCallback(async () => {
    if (files.length === 0 || isProcessing) return;

    // Validate watermark
    if (watermarkType === 'image' && !watermarkImage) {
      toast.error(isRTL ? "يرجى تحميل صورة العلامة المائية" : "Please upload a watermark image");
      return;
    }
    if (watermarkType === 'text' && !watermarkText.trim()) {
      toast.error(isRTL ? "يرجى إدخال نص العلامة المائية" : "Please enter watermark text");
      return;
    }

    setIsProcessing(true);
    setFiles((prev) => prev.map((f) => ({ ...f, isProcessing: true, error: undefined })));

    try {
      const filesToProcess = files.filter((f) => !f.result);
      
      for (const fileItem of filesToProcess) {
        try {
          const result = await applyWatermark({
            file: fileItem.file,
            watermarkType,
            watermarkImage: watermarkImage || undefined,
            watermarkText: watermarkText || undefined,
            position,
            opacity,
            size,
            rotation,
            fontSettings,
          });

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? { ...f, result, isProcessing: false }
                : f
            )
          );
        } catch (error) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? { ...f, error: (error as Error).message, isProcessing: false }
                : f
            )
          );
        }
      }

      toast.success(t("processingComplete"));
    } catch (error) {
      console.error("Batch processing error:", error);
      toast.error(t("processingFailed"));
    } finally {
      setIsProcessing(false);
      setFiles((prev) => prev.map((f) => ({ ...f, isProcessing: false })));
    }
  }, [files, watermarkType, watermarkImage, watermarkText, position, opacity, size, rotation, fontSettings, isProcessing, t, isRTL]);

  // Download single file
  const downloadSingle = useCallback((file: ProcessedFile) => {
    if (!file.result) return;
    downloadImage(file.result);
    toast.success(isRTL ? "تم التحميل!" : "Downloaded!");
  }, [isRTL]);

  // Download all as ZIP
  const downloadAllAsZip = useCallback(async () => {
    const processedFiles = files.filter((f) => f.result);
    if (processedFiles.length === 0) return;

    setIsDownloadingZip(true);
    try {
      const results = processedFiles.map((f) => f.result!);
      const zipBlob = await createZipFromResults(results);
      
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `watermarked-images-${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success(isRTL ? "تم تحميل الملف المضغوط!" : "ZIP downloaded!");
    } catch (error) {
      console.error("ZIP creation error:", error);
      toast.error(isRTL ? "فشل إنشاء الملف المضغوط" : "Failed to create ZIP");
    } finally {
      setIsDownloadingZip(false);
    }
  }, [files, isRTL]);

  // Check if any files are processed
  const hasProcessedFiles = files.some((f) => f.result);
  const hasUnprocessedFiles = files.some((f) => !f.result && !f.error);
  const processedCount = files.filter((f) => f.result).length;

  // Position options
  const positionOptions: WatermarkPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'tiled'];

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!hasProcessedFiles) return "";

    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${isRTL ? "نوع العلامة" : "Type"}: ${watermarkType === 'text' ? (isRTL ? "نص" : "Text") : (isRTL ? "صورة" : "Image")}
${isRTL ? "الموضع" : "Position"}: ${POSITION_LABELS[position][isRTL ? 'ar' : 'en']}
${isRTL ? "الشفافية" : "Opacity"}: ${opacity}%
${isRTL ? "الحجم" : "Size"}: ${size}%
━━━━━━━━━━━━━━━━━━
${isRTL ? "الصور المعالجة" : "Processed"}: ${processedCount}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [hasProcessedFiles, watermarkType, position, opacity, size, processedCount, t, isRTL]);

  // Export data
  const exportData = useMemo(() => {
    if (!hasProcessedFiles) return { inputs: {}, results: {} };

    return {
      inputs: {
        [isRTL ? "نوع العلامة" : "Watermark Type"]: watermarkType === 'text' ? (isRTL ? "نص" : "Text") : (isRTL ? "صورة" : "Image"),
        [isRTL ? "الموضع" : "Position"]: POSITION_LABELS[position][isRTL ? 'ar' : 'en'],
        [isRTL ? "الشفافية" : "Opacity"]: `${opacity}%`,
        [isRTL ? "الحجم" : "Size"]: `${size}%`,
      },
      results: {
        [isRTL ? "الصور المعالجة" : "Processed Images"]: processedCount,
      },
      metadata: {
        toolName: t("title"),
        date: new Date().toLocaleDateString(locale),
        locale,
      },
    };
  }, [hasProcessedFiles, watermarkType, position, opacity, size, processedCount, t, locale, isRTL]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stamp className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Watermark Type Selection */}
          <div className="space-y-2">
            <Label>{t("watermarkType")}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWatermarkType('text')}
                className={`p-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  watermarkType === 'text'
                    ? "border-primary bg-primary/10"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <Type className="h-4 w-4" />
                {t("textWatermark")}
              </button>
              <button
                type="button"
                onClick={() => setWatermarkType('image')}
                className={`p-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  watermarkType === 'image'
                    ? "border-primary bg-primary/10"
                    : "border-muted hover:border-primary/50"
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                {t("imageWatermark")}
              </button>
            </div>
          </div>

          {/* Text Watermark Settings */}
          {watermarkType === 'text' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="watermarkText">{t("watermarkText")}</Label>
                <Input
                  id="watermarkText"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder={isRTL ? "مثال: © متجري 2026" : "e.g., © My Store 2026"}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">{t("fontFamily")}</Label>
                  <select
                    id="fontFamily"
                    value={fontSettings.family}
                    onChange={(e) => setFontSettings({ ...fontSettings, family: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {FONT_FAMILIES.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fontColor">{t("fontColor")}</Label>
                  <Input
                    id="fontColor"
                    type="color"
                    value={fontSettings.color}
                    onChange={(e) => setFontSettings({ ...fontSettings, color: e.target.value })}
                    className="h-10 p-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Image Watermark Upload */}
          {watermarkType === 'image' && (
            <div className="space-y-2">
              <Label>{t("watermarkImage")}</Label>
              <div
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => watermarkInputRef.current?.click()}
              >
                <input
                  ref={watermarkInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleWatermarkImageSelect}
                  className="hidden"
                />
                {watermarkImagePreview ? (
                  <img
                    src={watermarkImagePreview}
                    alt="Watermark preview"
                    className="max-h-20 mx-auto"
                  />
                ) : (
                  <div className="text-muted-foreground">
                    <Upload className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm">{t("uploadWatermark")}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Position Selection */}
          <div className="space-y-2">
            <Label>{t("position")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {positionOptions.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => setPosition(pos)}
                  className={`p-2 rounded-lg border-2 transition-colors text-sm ${
                    position === pos
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  {POSITION_LABELS[pos][isRTL ? 'ar' : 'en']}
                </button>
              ))}
            </div>
          </div>

          {/* Opacity and Size Sliders */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="opacity">{t("opacity")}: {opacity}%</Label>
              <input
                id="opacity"
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">{t("opacityHint")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">{t("size")}: {size}%</Label>
              <input
                id="size"
                type="range"
                min="5"
                max="50"
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          {/* Rotation */}
          <div className="space-y-2">
            <Label htmlFor="rotation">{t("rotation")}: {rotation}°</Label>
            <input
              id="rotation"
              type="range"
              min="-45"
              max="45"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>


      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("uploadImages")}</CardTitle>
        </CardHeader>
        <CardContent>
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
              multiple
              onChange={handleInputChange}
              className="hidden"
              aria-hidden="true"
            />
            
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
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {t("images")} ({files.length})
              </CardTitle>
              <div className="flex gap-2">
                {hasUnprocessedFiles && (
                  <Button
                    onClick={processAll}
                    disabled={isProcessing}
                    className="gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("processing")}
                      </>
                    ) : (
                      <>
                        <Stamp className="h-4 w-4" />
                        {t("applyWatermark")}
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={clearAll}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("clearAll")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30"
                >
                  {/* Preview */}
                  <div className="relative w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                    {file.isProcessing && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {file.result && (
                        <>
                          <span className="text-green-600 dark:text-green-400">
                            {t("watermarked")}
                          </span>
                          {file.result.positionWarning && (
                            <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {t("positionWarning")}
                            </span>
                          )}
                        </>
                      )}
                      {file.error && (
                        <span className="text-red-500">{file.error}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.result ? (
                      <>
                        <Check className="h-5 w-5 text-green-500" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadSingle(file)}
                          className="gap-1"
                        >
                          <Download className="h-4 w-4" />
                          {t("download")}
                        </Button>
                      </>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {hasProcessedFiles && (
        <Card ref={resultCardRef}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" aria-hidden="true" />
              {t("results")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            <div className="text-center mb-6">
              <p className="text-lg">
                {processedCount} {isRTL ? "صورة تمت معالجتها" : "images processed"}
              </p>
            </div>

            {/* Download All Button */}
            {processedCount > 1 && (
              <div className="flex justify-center">
                <Button
                  onClick={downloadAllAsZip}
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
            )}
          </CardContent>
        </Card>
      )}

      {/* Export Buttons */}
      {hasProcessedFiles && (
        <ExportButtons
          data={exportData}
          filename="watermark-settings"
          title={t("title")}
          copyText={copyText}
        />
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="watermarkCreator" />
    </div>
  );
}
