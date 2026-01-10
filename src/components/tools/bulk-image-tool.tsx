"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Upload,
  Download,
  Trash2,
  Loader2,
  Check,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import {
  transformImage,
  batchTransformImages,
  createZipFromResults,
  downloadImage,
  createOperation,
  isValidImageFile,
  isValidFileSize,
  OPERATION_LABELS,
  type TransformOperation,
  type TransformResult,
} from "@/lib/calculators/image-transform";
import { SEOContent, ExportButtons } from "@/components/tools/shared";

interface UploadedFile {
  file: File;
  preview: string;
  id: string;
}

interface ProcessedFile extends UploadedFile {
  result?: TransformResult;
  resultPreview?: string;
  error?: string;
  isProcessing?: boolean;
}

type OperationPreset = 'flip-horizontal' | 'flip-vertical' | 'rotate-90' | 'rotate-180' | 'rotate-270' | 'rotate-custom';

/**
 * Bulk Image Tool Component
 * Flip and rotate multiple images at once
 * Requirements: 14.1-14.12
 */
export function BulkImageTool() {
  const t = useTranslations("tools.bulkImageTool");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<OperationPreset>('rotate-90');
  const [customAngle, setCustomAngle] = useState(45);
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
        if (file.resultPreview) {
          URL.revokeObjectURL(file.resultPreview);
        }
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  // Clear all files
  const clearAll = useCallback(() => {
    files.forEach((file) => {
      URL.revokeObjectURL(file.preview);
      if (file.resultPreview) {
        URL.revokeObjectURL(file.resultPreview);
      }
    });
    setFiles([]);
  }, [files]);

  // Process all files
  const processAll = useCallback(async () => {
    if (files.length === 0 || isProcessing) return;

    setIsProcessing(true);
    setFiles((prev) => prev.map((f) => ({ ...f, isProcessing: true, error: undefined })));

    try {
      const operation = createOperation(selectedOperation, customAngle);
      const filesToProcess = files.filter((f) => !f.result);
      
      for (const fileItem of filesToProcess) {
        try {
          const result = await transformImage({
            file: fileItem.file,
            operations: [operation],
          });

          const resultPreview = URL.createObjectURL(result.transformedBlob);

          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? { ...f, result, resultPreview, isProcessing: false }
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
  }, [files, selectedOperation, customAngle, isProcessing, t]);

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
      link.download = `transformed-images-${Date.now()}.zip`;
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

  // Operation options
  const operationOptions: { value: OperationPreset; icon: React.ReactNode }[] = [
    { value: 'flip-horizontal', icon: <FlipHorizontal className="h-4 w-4" /> },
    { value: 'flip-vertical', icon: <FlipVertical className="h-4 w-4" /> },
    { value: 'rotate-90', icon: <RotateCw className="h-4 w-4" /> },
    { value: 'rotate-180', icon: <RotateCw className="h-4 w-4 rotate-180" /> },
    { value: 'rotate-270', icon: <RotateCw className="h-4 w-4 -rotate-90" /> },
    { value: 'rotate-custom', icon: <RotateCw className="h-4 w-4" /> },
  ];

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!hasProcessedFiles) return "";

    const opLabel = OPERATION_LABELS[selectedOperation][isRTL ? 'ar' : 'en'];

    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${isRTL ? "العملية" : "Operation"}: ${opLabel}${selectedOperation === 'rotate-custom' ? ` (${customAngle}°)` : ''}
${isRTL ? "الصور المعالجة" : "Processed"}: ${processedCount}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [hasProcessedFiles, selectedOperation, customAngle, processedCount, t, isRTL]);

  // Export data
  const exportData = useMemo(() => {
    if (!hasProcessedFiles) return { inputs: {}, results: {} };

    const opLabel = OPERATION_LABELS[selectedOperation][isRTL ? 'ar' : 'en'];

    return {
      inputs: {
        [isRTL ? "العملية" : "Operation"]: opLabel + (selectedOperation === 'rotate-custom' ? ` (${customAngle}°)` : ''),
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
  }, [hasProcessedFiles, selectedOperation, customAngle, processedCount, t, locale, isRTL]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCw className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Operation Selection */}
          <div className="space-y-2">
            <Label>{t("selectOperation")}</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {operationOptions.map((op) => (
                <button
                  key={op.value}
                  type="button"
                  onClick={() => setSelectedOperation(op.value)}
                  className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-1 ${
                    selectedOperation === op.value
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-primary/50"
                  }`}
                >
                  {op.icon}
                  <span className="text-xs">
                    {OPERATION_LABELS[op.value][isRTL ? 'ar' : 'en'].replace('Flip ', '').replace('Rotate ', '').replace('قلب ', '').replace('تدوير ', '')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Angle Input */}
          {selectedOperation === 'rotate-custom' && (
            <div className="space-y-2">
              <Label htmlFor="customAngle">{t("customAngle")}: {customAngle}°</Label>
              <div className="flex items-center gap-4">
                <input
                  id="customAngle"
                  type="range"
                  min="-180"
                  max="180"
                  value={customAngle}
                  onChange={(e) => setCustomAngle(parseInt(e.target.value))}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="-180"
                  max="180"
                  value={customAngle}
                  onChange={(e) => setCustomAngle(parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
            </div>
          )}

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
                        <RotateCw className="h-4 w-4" />
                        {t("processAll")}
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
                  {/* Before/After Preview */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Original */}
                    <div className="relative w-16 h-16 rounded overflow-hidden bg-muted">
                      <img
                        src={file.preview}
                        alt={`${file.file.name} original`}
                        className="w-full h-full object-cover"
                      />
                      {file.isProcessing && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    
                    {/* Arrow */}
                    {file.result && (
                      <>
                        <span className="text-muted-foreground">→</span>
                        {/* Transformed */}
                        <div className="relative w-16 h-16 rounded overflow-hidden bg-muted">
                          <img
                            src={file.resultPreview}
                            alt={`${file.file.name} transformed`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {file.result && (
                        <>
                          <span>
                            {file.result.originalDimensions.width}×{file.result.originalDimensions.height}
                          </span>
                          <span>→</span>
                          <span className="text-green-600 dark:text-green-400">
                            {file.result.newDimensions.width}×{file.result.newDimensions.height}
                          </span>
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
              <p className="text-sm text-muted-foreground">
                {OPERATION_LABELS[selectedOperation][isRTL ? 'ar' : 'en']}
                {selectedOperation === 'rotate-custom' && ` (${customAngle}°)`}
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
          filename="bulk-transform"
          title={t("title")}
          copyText={copyText}
        />
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="bulkImageTool" />
    </div>
  );
}
