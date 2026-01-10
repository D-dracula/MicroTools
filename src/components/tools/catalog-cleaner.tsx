"use client";

/**
 * AI Catalog Cleaner Component
 * Translates and cleans supplier product catalogs using AI
 * 
 * Requirements: 4.5, 4.6, 4.7
 */

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Loader2,
  FileText,
  Download,
  Eye,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Tag,
  Languages,
} from "lucide-react";
import { toast } from "sonner";
import { ParsedFile } from "@/lib/ai-tools/file-parser";
import {
  cleanCatalog,
  detectSourceLanguage,
  estimateBatchTokens,
  exportToCsv,
  type CatalogCleanerResult,
  type CatalogInput,
  type CleanedProduct,
  type CleaningProgress,
  type ProductRecord,
} from "@/lib/ai-tools/catalog-cleaner";
import { 
  SEOContent, 
  ExportButtons, 
  ApiKeyManager, 
  AIFileUpload,
  AIPreferencesSelector,
  ExampleFileDownload,
  useResponseLanguage,
  type ExportData 
} from "@/components/tools/shared";

type ProcessingStatus = 'idle' | 'parsing' | 'processing' | 'complete' | 'error';


export function CatalogCleaner() {
  const t = useTranslations("tools.catalogCleaner");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // State
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [catalogInput, setCatalogInput] = useState<CatalogInput | null>(null);
  const [results, setResults] = useState<CatalogCleanerResult | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [estimatedTokens, setEstimatedTokens] = useState<number>(0);
  const [progress, setProgress] = useState<CleaningProgress>({ current: 0, total: 0, status: 'idle' });
  const [previewProduct, setPreviewProduct] = useState<CleanedProduct | null>(null);

  // Language preferences
  const { responseLanguage } = useResponseLanguage();

  // Handle file processed - start analysis directly
  const handleFileProcessed = useCallback(async (result: ParsedFile) => {
    setResults(null);
    setStatus('idle');
    setErrorMessage('');
    setPreviewProduct(null);
    
    // If API key is available, start analysis immediately
    if (apiKey && result.success && result.data && result.headers) {
      await startCleaning(result);
    }
  }, [apiKey]);

  // Start cleaning directly
  const startCleaning = useCallback(async (fileToUse?: ParsedFile) => {
    const file = fileToUse || { success: true, data: catalogInput?.products || [], headers: [] };
    if (!apiKey || !file?.success || !file.data) return;

    setStatus('processing');
    setErrorMessage('');
    
    try {
      const headers = Array.isArray(file.headers) 
        ? file.headers 
        : Object.keys(file.headers || {});
      
      const cleaningResults = await cleanCatalog(
        apiKey,
        file.data,
        headers,
        {
          locale: responseLanguage,
          onProgress: (prog) => setProgress(prog)
        }
      );
      
      setResults(cleaningResults);
      setStatus('complete');
      toast.success(isRTL ? 'تم تنظيف الكتالوج بنجاح' : 'Catalog cleaned successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Processing failed';
      setErrorMessage(message);
      setStatus('error');
      toast.error(message);
    }
  }, [apiKey, catalogInput, responseLanguage, isRTL]);

  // Handle file error
  const handleFileError = useCallback((error: string) => {
    setErrorMessage(error);
    setStatus('error');
    toast.error(error);
  }, []);

  // Auto-start cleaning when API key becomes available
  useEffect(() => {
    if (isApiKeyValid && catalogInput && status === 'idle') {
      startCleaning();
    }
  }, [isApiKeyValid, catalogInput, status, startCleaning]);

  // Reset
  const resetCleaning = useCallback(() => {
    setCatalogInput(null);
    setResults(null);
    setStatus('idle');
    setErrorMessage('');
    setEstimatedTokens(0);
    setProgress({ current: 0, total: 0, status: 'idle' });
    setPreviewProduct(null);
  }, []);

  // Download cleaned catalog
  const downloadCatalog = useCallback(() => {
    if (!results) return;
    
    const csv = exportToCsv(results.cleanedProducts);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cleaned-catalog-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(isRTL ? 'تم تحميل الملف' : 'File downloaded');
  }, [results, isRTL]);

  // Generate copy text
  const copyText = useMemo(() => {
    if (!results) return "";
    const stats = results.processingStats;
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("totalProducts")}: ${stats.totalProducts}
${t("translated")}: ${stats.translated}
${t("cleaned")}: ${stats.cleaned}
${t("keywordsGenerated")}: ${stats.keywordsGenerated}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, t, isRTL]);

  // Export data
  const exportData: ExportData = useMemo(() => ({
    inputs: catalogInput ? {
      [t("totalProducts")]: String(catalogInput.products.length),
      [t("sourceLanguage")]: catalogInput.sourceLanguage,
    } : {},
    results: results ? {
      [t("translated")]: String(results.processingStats.translated),
      [t("cleaned")]: String(results.processingStats.cleaned),
      [t("keywordsGenerated")]: String(results.processingStats.keywordsGenerated),
      [t("processingTime")]: `${(results.processingTime / 1000).toFixed(1)}s`,
    } : {},
    metadata: {
      toolName: t("title"),
      date: new Date().toLocaleDateString(locale),
      locale,
    },
  }), [catalogInput, results, t, locale]);

  const canProcess = isApiKeyValid && catalogInput && catalogInput.products.length > 0;
  const showResults = status === 'complete' && results;


  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* API Key Section */}
      <ApiKeyManager
        onApiKeyChange={setApiKey}
        onValidationChange={setIsApiKeyValid}
        estimatedTokens={estimatedTokens}
      />

      {/* Language Preferences */}
      <AIPreferencesSelector showCurrency={false} />

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
            {t("uploadCatalog")}
          </CardTitle>
          <CardDescription>{t("uploadDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Example File Download */}
          <ExampleFileDownload
            toolName="catalog-cleaner"
            requiredColumns={[
              'SKU', 'ProductTitle', 'Description', 'Category', 'SupplierPrice', 'SellingPrice'
            ]}
            optionalColumns={['Brand', 'Stock', 'Supplier', 'Tags', 'Weight', 'Dimensions']}
          />
          
          <AIFileUpload
            onFileProcessed={handleFileProcessed}
            onError={handleFileError}
            toolType="catalog"
            accept=".csv,.xlsx,.xls"
          />

          {/* File Info */}
          {catalogInput && catalogInput.products.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("totalProducts")}:</span>
                <span className="font-medium">{catalogInput.products.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("sourceLanguage")}:</span>
                <span className="font-medium capitalize">
                  {catalogInput.sourceLanguage === 'ar' ? (isRTL ? 'عربي' : 'Arabic') :
                   catalogInput.sourceLanguage === 'en' ? (isRTL ? 'إنجليزي' : 'English') :
                   (isRTL ? 'مختلط' : 'Mixed')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("estimatedTime")}:</span>
                <span className="font-medium">
                  ~{Math.ceil(catalogInput.products.length * 2)} {isRTL ? 'ثانية' : 'seconds'}
                </span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {status === 'processing' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progress.currentProduct}</span>
                <span className="font-medium">{progress.current} / {progress.total}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Process Button */}
          <div className="flex gap-2">
            <Button
              onClick={() => startCleaning()}
              disabled={!canProcess || status === 'processing'}
              className="flex-1"
            >
              {status === 'processing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  {t("processing")}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 me-2" />
                  {t("cleanButton")}
                </>
              )}
            </Button>
            {(catalogInput || results) && (
              <Button variant="outline" onClick={resetCleaning}>
                {commonT("reset")}
              </Button>
            )}
          </div>

          {/* Error Message */}
          {status === 'error' && errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="text-sm text-destructive">{errorMessage}</span>
            </div>
          )}
        </CardContent>
      </Card>


      {/* Results Section */}
      {showResults && results && (
        <>
          {/* Stats Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                {t("processingComplete")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{results.processingStats.totalProducts}</p>
                  <p className="text-sm text-muted-foreground">{t("totalProducts")}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Languages className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-600">{results.processingStats.translated}</p>
                  <p className="text-sm text-muted-foreground">{t("translated")}</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <Sparkles className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">{results.processingStats.cleaned}</p>
                  <p className="text-sm text-muted-foreground">{t("cleaned")}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <Tag className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold text-purple-600">{results.processingStats.keywordsGenerated}</p>
                  <p className="text-sm text-muted-foreground">{t("keywordsGenerated")}</p>
                </div>
              </div>

              {/* Download Button */}
              <div className="mt-6 flex justify-center">
                <Button onClick={downloadCatalog} size="lg" className="gap-2">
                  <Download className="h-5 w-5" />
                  {t("downloadCatalog")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t("preview")}
              </CardTitle>
              <CardDescription>{t("previewDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Product List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.cleanedProducts.slice(0, 20).map((product, index) => (
                  <div
                    key={product.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      previewProduct?.id === product.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setPreviewProduct(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.cleanedTitle}</p>
                        <p className="text-sm text-muted-foreground truncate">{product.originalTitle}</p>
                      </div>
                      <div className="flex items-center gap-2 ms-2">
                        {product.seoKeywords.length > 0 && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                            {product.seoKeywords.length} SEO
                          </span>
                        )}
                        {product.changes.length > 0 && (
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                            {product.changes.length} {isRTL ? 'تغيير' : 'changes'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {results.cleanedProducts.length > 20 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    +{results.cleanedProducts.length - 20} {isRTL ? 'منتج آخر' : 'more products'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>


          {/* Product Detail Preview */}
          {previewProduct && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-lg">{t("productDetail")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Title Comparison */}
                <div>
                  <h4 className="font-medium mb-2">{t("titleComparison")}</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-xs text-red-600 mb-1">{t("original")}</p>
                      <p className="text-sm">{previewProduct.originalTitle}</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-600 mb-1">{t("cleaned")}</p>
                      <p className="text-sm">{previewProduct.cleanedTitle}</p>
                    </div>
                  </div>
                </div>

                {/* Description Comparison */}
                <div>
                  <h4 className="font-medium mb-2">{t("descriptionComparison")}</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800 max-h-32 overflow-y-auto">
                      <p className="text-xs text-red-600 mb-1">{t("original")}</p>
                      <p className="text-sm">{previewProduct.originalDescription || '-'}</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 max-h-32 overflow-y-auto">
                      <p className="text-xs text-green-600 mb-1">{t("cleaned")}</p>
                      <p className="text-sm">{previewProduct.cleanedDescription || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* SEO Keywords */}
                {previewProduct.seoKeywords.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Tag className="h-4 w-4 text-purple-500" />
                      {t("seoKeywords")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {previewProduct.seoKeywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Changes Made */}
                {previewProduct.changes.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">{t("changesMade")}</h4>
                    <ul className="space-y-1">
                      {previewProduct.changes.map((change, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <ArrowRight className="h-3 w-3 text-green-500" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Hidden result card for export */}
          <div className="sr-only" ref={resultCardRef}>
            <div className="p-4 bg-white">
              <h2>{t("title")}</h2>
              <p>{t("totalProducts")}: {results.processingStats.totalProducts}</p>
            </div>
          </div>

          {/* Export Buttons */}
          <ExportButtons
            data={exportData}
            filename="catalog-cleaner"
            title={t("title")}
            copyText={copyText}
          />
        </>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="catalogCleaner" />
    </div>
  );
}

export default CatalogCleaner;
