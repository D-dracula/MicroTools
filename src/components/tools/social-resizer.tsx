"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Share2,
  Upload,
  Download,
  Trash2,
  Loader2,
  Check,
  X,
  Archive,
  Instagram,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";
import {
  resizeForSocialMedia,
  createZipFromResults,
  downloadImage,
  formatFileSize,
  isValidImageFile,
  isValidFileSize,
  PLATFORM_LABELS,
  CROP_POSITION_LABELS,
  getPlatformsByNetwork,
  type SocialPlatform,
  type CropPosition,
  type SocialResizeResult,
  type ResizedImage,
} from "@/lib/calculators/social-resize";
import { SEOContent, ExportButtons } from "@/components/tools/shared";

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

interface ProcessedFile extends UploadedFile {
  result?: SocialResizeResult;
  error?: string;
  isProcessing?: boolean;
}

/**
 * Social Media Resizer Component
 * Resizes images for Instagram, Snapchat, and Twitter with preset dimensions
 * Requirements: 10.1-10.12
 */
export function SocialResizer() {
  const t = useTranslations("tools.socialResizer");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([
    "instagram-feed",
    "instagram-story",
  ]);
  const [cropPosition, setCropPosition] = useState<CropPosition>("center");
  const [customPosition, setCustomPosition] = useState({ x: 0.5, y: 0.5 });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Generate unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  // Platform groups
  const platformGroups = getPlatformsByNetwork();

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

  // Toggle platform selection
  const togglePlatform = useCallback((platform: SocialPlatform) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        return prev.filter((p) => p !== platform);
      }
      return [...prev, platform];
    });
  }, []);

  // Select all platforms in a group
  const togglePlatformGroup = useCallback((group: string) => {
    const groupPlatforms = platformGroups[group] as SocialPlatform[];
    setSelectedPlatforms((prev) => {
      const allSelected = groupPlatforms.every((p) => prev.includes(p));
      if (allSelected) {
        return prev.filter((p) => !groupPlatforms.includes(p));
      }
      return [...new Set([...prev, ...groupPlatforms])];
    });
  }, [platformGroups]);

  // Resize all files - Requirements 10.2, 10.3, 10.4, 10.5, 10.6
  const resizeAll = useCallback(async () => {
    if (files.length === 0 || isProcessing) return;

    if (selectedPlatforms.length === 0) {
      toast.error(t("noPlatformsSelected"));
      return;
    }

    setIsProcessing(true);
    setFiles((prev) => prev.map((f) => ({ ...f, isProcessing: true, error: undefined })));

    try {
      const filesToProcess = files.filter((f) => !f.result);
      
      for (const fileItem of filesToProcess) {
        try {
          const result = await resizeForSocialMedia({
            file: fileItem.file,
            platforms: selectedPlatforms,
            cropPosition,
            customPosition: cropPosition === "custom" ? customPosition : undefined,
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

      toast.success(t("resizeComplete"));
    } catch (error) {
      console.error("Batch resize error:", error);
      toast.error(t("resizeFailed"));
    } finally {
      setIsProcessing(false);
      setFiles((prev) => prev.map((f) => ({ ...f, isProcessing: false })));
    }
  }, [files, selectedPlatforms, cropPosition, customPosition, isProcessing, t]);

  // Download single resized image
  const downloadSingleImage = useCallback((image: ResizedImage) => {
    downloadImage(image);
    toast.success(isRTL ? "تم التحميل!" : "Downloaded!");
  }, [isRTL]);

  // Download all as ZIP - Requirement 10.10
  const downloadAllAsZip = useCallback(async () => {
    const processedFiles = files.filter((f) => f.result);
    if (processedFiles.length === 0) return;

    setIsDownloadingZip(true);
    try {
      const results = processedFiles.map((f) => f.result!);
      const zipBlob = await createZipFromResults(results);
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `social-media-images-${Date.now()}.zip`;
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


  // Calculate totals
  const totals = useMemo(() => {
    const processedFiles = files.filter((f) => f.result);
    if (processedFiles.length === 0) return null;

    const totalResized = processedFiles.reduce(
      (sum, f) => sum + (f.result?.resizedImages.length || 0),
      0
    );

    return {
      filesProcessed: processedFiles.length,
      totalResized,
      platforms: selectedPlatforms.length,
    };
  }, [files, selectedPlatforms]);

  // Check states
  const hasProcessedFiles = files.some((f) => f.result);
  const hasUnprocessedFiles = files.some((f) => !f.result && !f.error);

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!totals) return "";

    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("platforms")}: ${selectedPlatforms.map((p) => PLATFORM_LABELS[p][locale as "en" | "ar"]).join(", ")}
${t("cropPosition")}: ${CROP_POSITION_LABELS[cropPosition][locale as "en" | "ar"]}
━━━━━━━━━━━━━━━━━━
${isRTL ? "الصور المعالجة" : "Files Processed"}: ${totals.filesProcessed}
${t("totalImages")}: ${totals.totalResized}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [totals, selectedPlatforms, cropPosition, t, locale, isRTL]);

  // Export data
  const exportData = useMemo(() => {
    if (!totals) return { inputs: {}, results: {} };

    const processedFiles = files.filter((f) => f.result);

    return {
      inputs: {
        [t("platforms")]: selectedPlatforms.map((p) => PLATFORM_LABELS[p][locale as "en" | "ar"]).join(", "),
        [t("cropPosition")]: CROP_POSITION_LABELS[cropPosition][locale as "en" | "ar"],
      },
      results: {
        [isRTL ? "الصور المعالجة" : "Files Processed"]: totals.filesProcessed,
        [t("totalImages")]: totals.totalResized,
      },
      comparisonTable: {
        headers: [
          isRTL ? "الملف" : "File",
          t("originalDimensions"),
          t("resizedImages"),
        ],
        rows: processedFiles.map((f) => [
          f.file.name,
          `${f.result!.originalDimensions.width} × ${f.result!.originalDimensions.height}`,
          f.result!.resizedImages.length,
        ]),
      },
      metadata: {
        toolName: t("title"),
        date: new Date().toLocaleDateString(locale),
        locale,
      },
    };
  }, [totals, files, selectedPlatforms, cropPosition, t, locale, isRTL]);

  // Crop position options
  const cropPositions: CropPosition[] = ["center", "top", "bottom", "custom"];

  // Get platform icon
  const getPlatformIcon = (platform: string) => {
    if (platform.startsWith("instagram")) return <Instagram className="h-4 w-4" />;
    if (platform.startsWith("twitter")) return <Twitter className="h-4 w-4" />;
    // Snapchat doesn't have a lucide icon, use a generic one
    return <Share2 className="h-4 w-4" />;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform Selection - Requirements 10.1, 10.2, 10.3, 10.4 */}
          <div className="space-y-4">
            <div>
              <Label className="text-base">{t("selectPlatforms")}</Label>
              <p className="text-sm text-muted-foreground">{t("selectPlatformsDescription")}</p>
            </div>
            
            {/* Instagram */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => togglePlatformGroup("instagram")}
                className="flex items-center gap-2 text-sm font-medium text-pink-600 dark:text-pink-400"
              >
                <Instagram className="h-4 w-4" />
                {t("instagram")}
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 ml-6">
                {platformGroups.instagram.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform as SocialPlatform)}
                    className={`p-2 rounded-lg border text-xs transition-colors ${
                      selectedPlatforms.includes(platform as SocialPlatform)
                        ? "border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400"
                        : "border-muted hover:border-pink-500/50"
                    }`}
                    aria-pressed={selectedPlatforms.includes(platform as SocialPlatform)}
                  >
                    <div className="font-medium">
                      {PLATFORM_LABELS[platform as SocialPlatform][locale as "en" | "ar"]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Snapchat */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => togglePlatformGroup("snapchat")}
                className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400"
              >
                <Share2 className="h-4 w-4" />
                {t("snapchat")}
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6">
                {platformGroups.snapchat.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform as SocialPlatform)}
                    className={`p-2 rounded-lg border text-xs transition-colors ${
                      selectedPlatforms.includes(platform as SocialPlatform)
                        ? "border-yellow-500 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                        : "border-muted hover:border-yellow-500/50"
                    }`}
                    aria-pressed={selectedPlatforms.includes(platform as SocialPlatform)}
                  >
                    <div className="font-medium">
                      {PLATFORM_LABELS[platform as SocialPlatform][locale as "en" | "ar"]}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Twitter */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => togglePlatformGroup("twitter")}
                className="flex items-center gap-2 text-sm font-medium text-blue-500 dark:text-blue-400"
              >
                <Twitter className="h-4 w-4" />
                {t("twitter")}
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6">
                {platformGroups.twitter.map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform as SocialPlatform)}
                    className={`p-2 rounded-lg border text-xs transition-colors ${
                      selectedPlatforms.includes(platform as SocialPlatform)
                        ? "border-blue-500 bg-blue-500/10 text-blue-500 dark:text-blue-400"
                        : "border-muted hover:border-blue-500/50"
                    }`}
                    aria-pressed={selectedPlatforms.includes(platform as SocialPlatform)}
                  >
                    <div className="font-medium">
                      {PLATFORM_LABELS[platform as SocialPlatform][locale as "en" | "ar"]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* Crop Position Selection - Requirement 10.5 */}
          <div className="space-y-3">
            <div>
              <Label className="text-base">{t("cropPosition")}</Label>
              <p className="text-sm text-muted-foreground">{t("cropPositionDescription")}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {cropPositions.map((position) => (
                <button
                  key={position}
                  type="button"
                  onClick={() => setCropPosition(position)}
                  className={`p-3 rounded-lg border-2 transition-colors text-center ${
                    cropPosition === position
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-primary/50"
                  }`}
                  aria-pressed={cropPosition === position}
                >
                  <div className="text-sm font-medium">{t(position)}</div>
                </button>
              ))}
            </div>

            {/* Custom Position Sliders */}
            {cropPosition === "custom" && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="horizontal-slider" className="text-sm">
                    {t("horizontal")}: {Math.round(customPosition.x * 100)}%
                  </Label>
                  <input
                    id="horizontal-slider"
                    type="range"
                    min="0"
                    max="100"
                    value={customPosition.x * 100}
                    onChange={(e) =>
                      setCustomPosition((prev) => ({ ...prev, x: Number(e.target.value) / 100 }))
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vertical-slider" className="text-sm">
                    {t("vertical")}: {Math.round(customPosition.y * 100)}%
                  </Label>
                  <input
                    id="vertical-slider"
                    type="range"
                    min="0"
                    max="100"
                    value={customPosition.y * 100}
                    onChange={(e) =>
                      setCustomPosition((prev) => ({ ...prev, y: Number(e.target.value) / 100 }))
                    }
                    className="w-full"
                  />
                </div>
              </div>
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
                <p className="text-xs text-muted-foreground">
                  {t("maxFileSize")}
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
                {t("uploadTitle")} ({files.length})
              </CardTitle>
              <div className="flex gap-2">
                {hasUnprocessedFiles && (
                  <Button
                    onClick={resizeAll}
                    disabled={isProcessing || selectedPlatforms.length === 0}
                    className="gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("resizing")}
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4" />
                        {t("resizeAll")}
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
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="rounded-lg border bg-muted/30 overflow-hidden"
                >
                  {/* File Header */}
                  <div className="flex items-center gap-4 p-3">
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
                        <span>{formatFileSize(file.file.size)}</span>
                        {file.result && (
                          <>
                            <span>•</span>
                            <span>
                              {file.result.originalDimensions.width} × {file.result.originalDimensions.height}px
                            </span>
                            <span>•</span>
                            <span className="text-green-600 dark:text-green-400">
                              {file.result.resizedImages.length} {t("resizedImages")}
                            </span>
                          </>
                        )}
                        {file.error && (
                          <span className="text-red-500">{file.error}</span>
                        )}
                      </div>
                    </div>

                    {/* Status & Remove */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {file.result ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : file.error ? (
                        <X className="h-5 w-5 text-red-500" />
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

                  {/* Resized Images Grid - Requirement 10.9 */}
                  {file.result && (
                    <div className="border-t p-3 bg-muted/20">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {file.result.resizedImages.map((image, index) => (
                          <div
                            key={`${file.id}-${image.platform}-${index}`}
                            className="relative group rounded-lg overflow-hidden border bg-background"
                          >
                            <div className="aspect-square relative">
                              <img
                                src={URL.createObjectURL(image.blob)}
                                alt={`${file.file.name} - ${image.platform}`}
                                className="w-full h-full object-cover"
                              />
                              {/* Overlay with download button */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => downloadSingleImage(image)}
                                  className="gap-1"
                                >
                                  <Download className="h-3 w-3" />
                                  {t("downloadSingle")}
                                </Button>
                              </div>
                            </div>
                            <div className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1 text-xs font-medium">
                                {getPlatformIcon(image.platform)}
                                <span className="truncate">
                                  {image.platform.split("-")[0]}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {image.dimensions.width}×{image.dimensions.height}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


      {/* Results Summary */}
      {totals && (
        <Card ref={resultCardRef}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" aria-hidden="true" />
              {t("results")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary Grid */}
            <dl className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 rounded-lg bg-muted">
                <dt className="text-xs text-muted-foreground mb-1">
                  {isRTL ? "الصور المعالجة" : "Files Processed"}
                </dt>
                <dd className="text-lg font-bold">{totals.filesProcessed}</dd>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <dt className="text-xs text-muted-foreground mb-1">{t("platforms")}</dt>
                <dd className="text-lg font-bold">{totals.platforms}</dd>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/10 border-2 border-primary">
                <dt className="text-xs text-muted-foreground mb-1">{t("totalImages")}</dt>
                <dd className="text-lg font-bold text-primary">{totals.totalResized}</dd>
              </div>
            </dl>

            {/* Download All Button - Requirement 10.10 */}
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
          </CardContent>
        </Card>
      )}

      {/* Export Buttons - Requirements 10.11, 10.12 */}
      {hasProcessedFiles && (
        <ExportButtons
          data={exportData}
          filename="social-media-resize"
          title={t("title")}
          copyText={copyText}
        />
      )}

      {/* Empty State */}
      {files.length === 0 && (
        <p className="text-sm text-muted-foreground text-center" role="status">
          {t("noImages")}
        </p>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="socialResizer" />
    </div>
  );
}
