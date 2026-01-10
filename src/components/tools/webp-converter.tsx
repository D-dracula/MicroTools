"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FileImage, Upload, Download, Trash2, Loader2, Check, X, Archive } from "lucide-react";
import { toast } from "sonner";
import { convertToWebP, formatFileSize, downloadBlob, createZipFromResults, QUALITY_SETTINGS, isValidImageFile, isValidFileSize, type WebPQuality, type WebPConversionResult } from "@/lib/calculators/webp-conversion";
import { SEOContent, ExportButtons } from "@/components/tools/shared";

interface UploadedFile { file: File; preview: string; id: string; }
interface ConvertedFile extends UploadedFile { result?: WebPConversionResult; error?: string; isConverting?: boolean; }

export function WebPConverter() {
  const t = useTranslations("tools.webpConverter");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [quality, setQuality] = useState<WebPQuality>("high");
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const generateId = () => Date.now().toString() + Math.random().toString(36).slice(2, 11);

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles: ConvertedFile[] = [];
    Array.from(selectedFiles).forEach((file) => {
      if (!isValidImageFile(file)) { toast.error(file.name + ": " + (isRTL ? "صيغة غير مدعومة" : "Unsupported format")); return; }
      if (!isValidFileSize(file)) { toast.error(file.name + ": " + (isRTL ? "الملف كبير جداً" : "File too large")); return; }
      newFiles.push({ file, preview: URL.createObjectURL(file), id: generateId() });
    });
    if (newFiles.length > 0) setFiles((prev) => [...prev, ...newFiles]);
  }, [isRTL]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files); }, [handleFileSelect]);
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { handleFileSelect(e.target.files); e.target.value = ""; }, [handleFileSelect]);
  const removeFile = useCallback((id: string) => { setFiles((prev) => { const file = prev.find((f) => f.id === id); if (file) URL.revokeObjectURL(file.preview); return prev.filter((f) => f.id !== id); }); }, []);
  const clearAll = useCallback(() => { files.forEach((f) => URL.revokeObjectURL(f.preview)); setFiles([]); }, [files]);

  const convertAll = useCallback(async () => {
    if (files.length === 0 || isConverting) return;
    setIsConverting(true);
    setFiles((prev) => prev.map((f) => ({ ...f, isConverting: true, error: undefined })));
    try {
      for (const fileItem of files.filter((f) => !f.result)) {
        try {
          const result = await convertToWebP({ file: fileItem.file, quality });
          setFiles((prev) => prev.map((f) => f.id === fileItem.id ? { ...f, result, isConverting: false } : f));
        } catch (error) { setFiles((prev) => prev.map((f) => f.id === fileItem.id ? { ...f, error: (error as Error).message, isConverting: false } : f)); }
      }
      toast.success(t("conversionComplete"));
    } finally { setIsConverting(false); setFiles((prev) => prev.map((f) => ({ ...f, isConverting: false }))); }
  }, [files, quality, isConverting, t]);

  const downloadSingle = useCallback((file: ConvertedFile) => { if (!file.result) return; downloadBlob(file.result.convertedBlob, file.result.filename); toast.success(isRTL ? "تم التحميل!" : "Downloaded!"); }, [isRTL]);

  const downloadAllAsZip = useCallback(async () => {
    const convertedFiles = files.filter((f) => f.result);
    if (convertedFiles.length === 0) return;
    setIsDownloadingZip(true);
    try {
      const results = convertedFiles.map((f) => f.result!);
      const zipBlob = await createZipFromResults(results);
      downloadBlob(zipBlob, "webp-images-" + Date.now() + ".zip");
      toast.success(isRTL ? "تم تحميل الملف المضغوط!" : "ZIP downloaded!");
    } catch { toast.error(isRTL ? "فشل إنشاء الملف المضغوط" : "Failed to create ZIP"); }
    finally { setIsDownloadingZip(false); }
  }, [files, isRTL]);

  const totals = useMemo(() => {
    const convertedFiles = files.filter((f) => f.result);
    if (convertedFiles.length === 0) return null;
    const totalOriginal = convertedFiles.reduce((sum, f) => sum + (f.result?.originalSize || 0), 0);
    const totalConverted = convertedFiles.reduce((sum, f) => sum + (f.result?.convertedSize || 0), 0);
    const totalSavings = totalOriginal > 0 ? Math.round((1 - totalConverted / totalOriginal) * 100) : 0;
    return { totalOriginal, totalConverted, totalSavings: Math.max(0, totalSavings), count: convertedFiles.length };
  }, [files]);

  const hasConvertedFiles = files.some((f) => f.result);
  const hasUnconvertedFiles = files.some((f) => !f.result && !f.error);

  const copyText = useMemo(() => {
    if (!totals) return "";
    return t("title") + "\n" + t("quality") + ": " + t(quality) + "\n" + t("originalSize") + ": " + formatFileSize(totals.totalOriginal) + "\n" + t("convertedSize") + ": " + formatFileSize(totals.totalConverted) + "\n" + t("totalSavings") + ": " + totals.totalSavings + "%";
  }, [totals, quality, t]);

  const exportData = useMemo(() => {
    if (!totals) return { inputs: {}, results: {} };
    const convertedFiles = files.filter((f) => f.result);
    return {
      inputs: { [t("quality")]: t(quality), [isRTL ? "عدد الصور" : "Images"]: totals.count },
      results: { [t("originalSize")]: formatFileSize(totals.totalOriginal), [t("convertedSize")]: formatFileSize(totals.totalConverted), [t("totalSavings")]: totals.totalSavings + "%" },
      comparisonTable: { headers: [isRTL ? "الملف" : "File", t("originalSize"), t("convertedSize"), t("savings")], rows: convertedFiles.map((f) => [f.file.name, formatFileSize(f.result!.originalSize), formatFileSize(f.result!.convertedSize), f.result!.savingsPercentage + "%"]) },
      metadata: { toolName: t("title"), date: new Date().toLocaleDateString(locale), locale }
    };
  }, [totals, files, quality, t, locale, isRTL]);

  const qualityOptions: WebPQuality[] = ["low", "medium", "high", "lossless"];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileImage className="h-5 w-5" />{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("qualitySettings")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {qualityOptions.map((q) => (
                <button key={q} type="button" onClick={() => setQuality(q)} className={"p-3 rounded-lg border-2 transition-colors text-center " + (quality === q ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50")} aria-pressed={quality === q}>
                  <div className="text-sm font-medium">{t(q)}</div>
                  <div className="text-xs text-muted-foreground">{Math.round(QUALITY_SETTINGS[q] * 100)}%</div>
                </button>
              ))}
            </div>
          </div>
          <div className={"relative border-2 border-dashed rounded-lg p-8 text-center transition-colors " + (isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50")} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/bmp" multiple onChange={handleInputChange} className="hidden" />
            <div className="flex flex-col items-center gap-3">
              <div className={"p-4 rounded-full " + (isDragging ? "bg-primary/10" : "bg-muted")}><Upload className={"h-8 w-8 " + (isDragging ? "text-primary" : "text-muted-foreground")} /></div>
              <div><p className="font-medium">{isDragging ? t("dropHere") : t("uploadDescription")}</p><p className="text-sm text-muted-foreground mt-1">{t("supportedFormats")}</p><p className="text-xs text-muted-foreground">{t("maxFileSize")}</p></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t("uploadTitle")} ({files.length})</CardTitle>
              <div className="flex gap-2">
                {hasUnconvertedFiles && <Button onClick={convertAll} disabled={isConverting} className="gap-2">{isConverting ? <><Loader2 className="h-4 w-4 animate-spin" />{t("converting")}</> : <><FileImage className="h-4 w-4" />{t("convertAll")}</>}</Button>}
                <Button variant="outline" onClick={clearAll} className="gap-2"><Trash2 className="h-4 w-4" />{t("clearAll")}</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                  <div className="relative w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                    <img src={file.preview} alt={file.file.name} className="w-full h-full object-cover" />
                    {file.isConverting && <div className="absolute inset-0 bg-background/80 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.file.size)}</span>
                      {file.result && <><span>→</span><span className="text-green-600 dark:text-green-400">{formatFileSize(file.result.convertedSize)}</span><span className="text-green-600 dark:text-green-400 font-medium">-{file.result.savingsPercentage}%</span></>}
                      {file.error && <span className="text-red-500">{file.error}</span>}
                    </div>
                    {file.result && <p className="text-xs text-muted-foreground">{file.result.dimensions.width} × {file.result.dimensions.height}px</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.result ? <><Check className="h-5 w-5 text-green-500" /><Button variant="outline" size="sm" onClick={() => downloadSingle(file)} className="gap-1"><Download className="h-4 w-4" />{t("downloadSingle")}</Button></> : file.error ? <X className="h-5 w-5 text-red-500" /> : null}
                    <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {totals && (
        <Card ref={resultCardRef}>
          <CardHeader><CardTitle className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" />{t("results")}</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 rounded-lg bg-muted"><dt className="text-xs text-muted-foreground mb-1">{isRTL ? "عدد الصور" : "Images"}</dt><dd className="text-lg font-bold">{totals.count}</dd></div>
              <div className="text-center p-3 rounded-lg bg-muted"><dt className="text-xs text-muted-foreground mb-1">{t("originalSize")}</dt><dd className="text-lg font-bold">{formatFileSize(totals.totalOriginal)}</dd></div>
              <div className="text-center p-3 rounded-lg bg-muted"><dt className="text-xs text-muted-foreground mb-1">{t("convertedSize")}</dt><dd className="text-lg font-bold text-green-600 dark:text-green-400">{formatFileSize(totals.totalConverted)}</dd></div>
              <div className="text-center p-3 rounded-lg bg-primary/10 border-2 border-primary"><dt className="text-xs text-muted-foreground mb-1">{t("totalSavings")}</dt><dd className="text-lg font-bold text-primary">{totals.totalSavings}%</dd></div>
            </dl>
            {totals.count > 1 && <div className="flex justify-center"><Button onClick={downloadAllAsZip} disabled={isDownloadingZip} className="gap-2" size="lg">{isDownloadingZip ? <><Loader2 className="h-5 w-5 animate-spin" />{isRTL ? "جاري الإنشاء..." : "Creating..."}</> : <><Archive className="h-5 w-5" />{t("downloadAll")}</>}</Button></div>}
          </CardContent>
        </Card>
      )}
      {hasConvertedFiles && <ExportButtons data={exportData} filename="webp-conversion" title={t("title")} copyText={copyText} />}
      {files.length === 0 && <p className="text-sm text-muted-foreground text-center" role="status">{t("noImages")}</p>}
      <SEOContent toolSlug="webpConverter" />
    </div>
  );
}
