"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ImageIcon, Upload, Download, Trash2, Loader2, Check, X, Archive,
  AlertTriangle, Sparkles, Settings2, Target,
} from "lucide-react";
import { toast } from "sonner";
import {
  compressImage, analyzeImageQuality, formatFileSize, downloadCompressedImage,
  createZipFromResults, isValidImageFile, isValidFileSize, QUALITY_PRESETS,
  QUALITY_WARNING_THRESHOLD, type CompressionMode, type ImageCompressionResult,
  type QualityAnalysis,
} from "@/lib/calculators/image-compression";
import { SEOContent, ExportButtons } from "@/components/tools/shared";

interface UploadedFile {
  file: File; preview: string; id: string;
  analysis?: QualityAnalysis; isAnalyzing?: boolean;
}

interface CompressedFile extends UploadedFile {
  result?: ImageCompressionResult; error?: string; isCompressing?: boolean;
}

type QualityPreset = keyof typeof QUALITY_PRESETS;

export function ImageCompressor() {
  const t = useTranslations("tools.imageCompressor");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<CompressedFile[]>([]);
  const [mode, setMode] = useState<CompressionMode>("quality");
  const [quality, setQuality] = useState<number>(QUALITY_PRESETS.high);
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>("high");
  const [targetSize, setTargetSize] = useState<number>(100);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const handleFileSelect = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles: CompressedFile[] = [];
    for (const file of Array.from(selectedFiles)) {
      if (!isValidImageFile(file)) { toast.error(`${file.name}: ${isRTL ? "صيغة غير مدعومة" : "Unsupported format"}`); continue; }
      if (!isValidFileSize(file)) { toast.error(`${file.name}: ${isRTL ? "الملف كبير جداً (الحد 50MB)" : "File too large (max 50MB)"}`); continue; }
      newFiles.push({ file, preview: URL.createObjectURL(file), id: generateId(), isAnalyzing: true });
    }
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
      for (const newFile of newFiles) {
        try {
          const analysis = await analyzeImageQuality(newFile.file);
          setFiles((prev) => prev.map((f) => f.id === newFile.id ? { ...f, analysis, isAnalyzing: false } : f));
        } catch { setFiles((prev) => prev.map((f) => f.id === newFile.id ? { ...f, isAnalyzing: false } : f)); }
      }
    }
  }, [isRTL]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files); }, [handleFileSelect]);
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { handleFileSelect(e.target.files); e.target.value = ""; }, [handleFileSelect]);
  const removeFile = useCallback((id: string) => { setFiles((prev) => { const file = prev.find((f) => f.id === id); if (file) URL.revokeObjectURL(file.preview); return prev.filter((f) => f.id !== id); }); }, []);
  const clearAll = useCallback(() => { files.forEach((file) => URL.revokeObjectURL(file.preview)); setFiles([]); }, [files]);
  const handlePresetChange = useCallback((preset: QualityPreset) => { setQualityPreset(preset); setQuality(QUALITY_PRESETS[preset]); }, []);

  const compressAll = useCallback(async () => {
    if (files.length === 0 || isCompressing) return;
    setIsCompressing(true);
    setFiles((prev) => prev.map((f) => ({ ...f, isCompressing: true, error: undefined })));
    try {
      for (const fileItem of files.filter((f) => !f.result)) {
        try {
          const result = await compressImage({ file: fileItem.file, mode, quality: mode === "quality" ? quality : undefined, targetSize: mode === "target-size" ? targetSize : undefined, preserveTransparency: true });
          setFiles((prev) => prev.map((f) => f.id === fileItem.id ? { ...f, result, isCompressing: false } : f));
        } catch (error) { setFiles((prev) => prev.map((f) => f.id === fileItem.id ? { ...f, error: (error as Error).message, isCompressing: false } : f)); }
      }
      toast.success(t("compressionComplete"));
    } catch { toast.error(t("compressionFailed")); }
    finally { setIsCompressing(false); setFiles((prev) => prev.map((f) => ({ ...f, isCompressing: false }))); }
  }, [files, mode, quality, targetSize, isCompressing, t]);

  const downloadSingle = useCallback((file: CompressedFile) => { if (!file.result) return; downloadCompressedImage(file.result); toast.success(isRTL ? "تم التحميل!" : "Downloaded!"); }, [isRTL]);

  const downloadAllAsZip = useCallback(async () => {
    const compressedFiles = files.filter((f) => f.result);
    if (compressedFiles.length === 0) return;
    setIsDownloadingZip(true);
    try {
      const zipBlob = await createZipFromResults(compressedFiles.map((f) => f.result!));
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a"); link.href = url; link.download = `compressed-images-${Date.now()}.zip`; link.click();
      URL.revokeObjectURL(url);
      toast.success(isRTL ? "تم تحميل الملف المضغوط!" : "ZIP downloaded!");
    } catch { toast.error(isRTL ? "فشل إنشاء الملف المضغوط" : "Failed to create ZIP"); }
    finally { setIsDownloadingZip(false); }
  }, [files, isRTL]);

  const totals = useMemo(() => {
    const compressedFiles = files.filter((f) => f.result);
    if (compressedFiles.length === 0) return null;
    const totalOriginal = compressedFiles.reduce((sum, f) => sum + (f.result?.originalSize || 0), 0);
    const totalCompressed = compressedFiles.reduce((sum, f) => sum + (f.result?.compressedSize || 0), 0);
    return { totalOriginal, totalCompressed, totalSavings: Math.max(0, totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0), count: compressedFiles.length };
  }, [files]);

  const hasCompressedFiles = files.some((f) => f.result);
  const hasUncompressedFiles = files.some((f) => !f.result && !f.error);

  const copyText = useMemo(() => {
    if (!totals) return "";
    return `${t("title")}\n━━━━━━━━━━━━━━━━━━\n${t("compressionMode")}: ${mode === "quality" ? t("qualityMode") : t("targetSizeMode")}\n${mode === "quality" ? `${t("quality")}: ${quality}%` : `${t("targetSize")}: ${targetSize}KB`}\n${isRTL ? "عدد الصور" : "Images"}: ${totals.count}\n━━━━━━━━━━━━━━━━━━\n${t("originalSize")}: ${formatFileSize(totals.totalOriginal)}\n${t("compressedSize")}: ${formatFileSize(totals.totalCompressed)}\n${t("totalSavings")}: ${totals.totalSavings}%\n━━━━━━━━━━━━━━━━━━\n${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [totals, mode, quality, targetSize, t, isRTL]);

  const exportData = useMemo(() => {
    if (!totals) return { inputs: {}, results: {} };
    const compressedFiles = files.filter((f) => f.result);
    return {
      inputs: { [t("compressionMode")]: mode === "quality" ? t("qualityMode") : t("targetSizeMode"), ...(mode === "quality" ? { [t("quality")]: `${quality}%` } : { [t("targetSize")]: `${targetSize}KB` }), [isRTL ? "عدد الصور" : "Images"]: totals.count },
      results: { [t("originalSize")]: formatFileSize(totals.totalOriginal), [t("compressedSize")]: formatFileSize(totals.totalCompressed), [t("totalSavings")]: `${totals.totalSavings}%` },
      comparisonTable: { headers: [isRTL ? "الملف" : "File", t("originalSize"), t("compressedSize"), t("savings"), t("qualityUsed")], rows: compressedFiles.map((f) => [f.file.name, formatFileSize(f.result!.originalSize), formatFileSize(f.result!.compressedSize), `${f.result!.savingsPercentage}%`, `${f.result!.qualityUsed}%`]) },
      metadata: { toolName: t("title"), date: new Date().toLocaleDateString(locale), locale },
    };
  }, [totals, files, mode, quality, targetSize, t, locale, isRTL]);

  const presets: QualityPreset[] = ["low", "medium", "high", "maximum"];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" aria-hidden="true" />{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>{t("compressionMode")}</Label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setMode("quality")} className={`p-4 rounded-lg border-2 transition-colors text-left ${mode === "quality" ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50"}`} aria-pressed={mode === "quality"}>
                <div className="flex items-center gap-2 mb-1"><Settings2 className="h-4 w-4" /><span className="font-medium">{t("qualityMode")}</span></div>
                <p className="text-xs text-muted-foreground">{t("qualityModeDescription")}</p>
              </button>
              <button type="button" onClick={() => setMode("target-size")} className={`p-4 rounded-lg border-2 transition-colors text-left ${mode === "target-size" ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50"}`} aria-pressed={mode === "target-size"}>
                <div className="flex items-center gap-2 mb-1"><Target className="h-4 w-4" /><span className="font-medium">{t("targetSizeMode")}</span></div>
                <p className="text-xs text-muted-foreground">{t("targetSizeModeDescription")}</p>
              </button>
            </div>
          </div>
          {mode === "quality" && (
            <div className="space-y-3">
              <Label>{t("qualityPresets")}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {presets.map((preset) => (<button key={preset} type="button" onClick={() => handlePresetChange(preset)} className={`p-3 rounded-lg border-2 transition-colors text-center ${qualityPreset === preset ? "border-primary bg-primary/10" : "border-muted hover:border-primary/50"}`} aria-pressed={qualityPreset === preset}><div className="text-sm font-medium">{t(preset)}</div></button>))}
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="quality-slider" className="whitespace-nowrap">{t("quality")}: {quality}%</Label>
                <input id="quality-slider" type="range" min="10" max="100" value={quality} onChange={(e) => { setQuality(Number(e.target.value)); setQualityPreset("high"); }} className="flex-1" />
              </div>
              {quality < QUALITY_WARNING_THRESHOLD && (<div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400"><AlertTriangle className="h-4 w-4 flex-shrink-0" /><span className="text-sm">{t("qualityWarning")}</span></div>)}
            </div>
          )}
          {mode === "target-size" && (
            <div className="space-y-3">
              <Label htmlFor="target-size">{t("targetSize")}</Label>
              <div className="flex items-center gap-3"><Input id="target-size" type="number" min="10" max="5000" value={targetSize} onChange={(e) => setTargetSize(Number(e.target.value))} className="w-32" /><span className="text-sm text-muted-foreground">KB</span></div>
              <p className="text-xs text-muted-foreground">{t("optimalSize")}</p>
            </div>
          )}
          <div className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }} aria-label={t("uploadDescription")}>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/bmp" multiple onChange={handleInputChange} className="hidden" aria-hidden="true" />
            <div className="flex flex-col items-center gap-3">
              <div className={`p-4 rounded-full ${isDragging ? "bg-primary/10" : "bg-muted"}`}><Upload className={`h-8 w-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`} /></div>
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
                {hasUncompressedFiles && (<Button onClick={compressAll} disabled={isCompressing} className="gap-2">{isCompressing ? (<><Loader2 className="h-4 w-4 animate-spin" />{t("compressing")}</>) : (<><Sparkles className="h-4 w-4" />{t("compressAll")}</>)}</Button>)}
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
                    {(file.isCompressing || file.isAnalyzing) && (<div className="absolute inset-0 bg-background/80 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.file.size)}</span>
                      {file.result && (<><span>→</span><span className="text-green-600 dark:text-green-400">{formatFileSize(file.result.compressedSize)}</span><span className="text-green-600 dark:text-green-400 font-medium">-{file.result.savingsPercentage}%</span></>)}
                      {file.error && (<span className="text-red-500">{file.error}</span>)}
                    </div>
                    {file.analysis && !file.result && (<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground"><Sparkles className="h-3 w-3" /><span>{t("suggestedQuality")}: {file.analysis.suggestedQuality}% ({t(file.analysis.category)})</span></div>)}
                    {file.result?.qualityWarning && (<div className="flex items-center gap-1 mt-1 text-xs text-yellow-600 dark:text-yellow-400"><AlertTriangle className="h-3 w-3" /><span>{t("qualityWarning")}</span></div>)}
                    {file.result && (<p className="text-xs text-muted-foreground mt-1">{file.result.dimensions.width} × {file.result.dimensions.height}px • {t("qualityUsed")}: {file.result.qualityUsed}%</p>)}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.result ? (<><Check className="h-5 w-5 text-green-500" /><Button variant="outline" size="sm" onClick={() => downloadSingle(file)} className="gap-1"><Download className="h-4 w-4" />{t("downloadSingle")}</Button></>) : file.error ? (<X className="h-5 w-5 text-red-500" />) : null}
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
          <CardHeader><CardTitle className="flex items-center gap-2"><Check className="h-5 w-5 text-green-500" aria-hidden="true" />{t("results")}</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 rounded-lg bg-muted"><dt className="text-xs text-muted-foreground mb-1">{isRTL ? "عدد الصور" : "Images"}</dt><dd className="text-lg font-bold">{totals.count}</dd></div>
              <div className="text-center p-3 rounded-lg bg-muted"><dt className="text-xs text-muted-foreground mb-1">{t("originalSize")}</dt><dd className="text-lg font-bold">{formatFileSize(totals.totalOriginal)}</dd></div>
              <div className="text-center p-3 rounded-lg bg-muted"><dt className="text-xs text-muted-foreground mb-1">{t("compressedSize")}</dt><dd className="text-lg font-bold text-green-600 dark:text-green-400">{formatFileSize(totals.totalCompressed)}</dd></div>
              <div className="text-center p-3 rounded-lg bg-primary/10 border-2 border-primary"><dt className="text-xs text-muted-foreground mb-1">{t("totalSavings")}</dt><dd className="text-lg font-bold text-primary">{totals.totalSavings}%</dd></div>
            </dl>
            {totals.count > 1 && (<div className="flex justify-center"><Button onClick={downloadAllAsZip} disabled={isDownloadingZip} className="gap-2" size="lg">{isDownloadingZip ? (<><Loader2 className="h-5 w-5 animate-spin" />{isRTL ? "جاري الإنشاء..." : "Creating..."}</>) : (<><Archive className="h-5 w-5" />{t("downloadAll")}</>)}</Button></div>)}
          </CardContent>
        </Card>
      )}
      {hasCompressedFiles && (<ExportButtons data={exportData} filename="image-compression" title={t("title")} copyText={copyText} />)}
      {files.length === 0 && (<p className="text-sm text-muted-foreground text-center" role="status">{t("noImages")}</p>)}
      <SEOContent toolSlug="imageCompressor" />
    </div>
  );
}
