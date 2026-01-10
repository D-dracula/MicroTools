"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Upload, 
  FileSpreadsheet,
  X,
  AlertTriangle
} from "lucide-react";
import {
  calculateRealNetProfit,
  formatCurrency,
  formatPercentage,
  type RealNetProfitInput,
  type RealNetProfitResult,
} from "@/lib/calculators/real-net-profit";
import { parseAdCSV, type ParsedCSVResult } from "@/lib/calculators/csv-parser";
import { SEOContent, ResultCard, ExportButtons, type ExportData } from "@/components/tools/shared";

/**
 * Real Net Profit Calculator Component
 * Calculates true profit after all expenses including ad spend, shipping, and returns
 * Requirements: 1.2, 1.7
 */
export function RealNetProfitCalculator() {
  const t = useTranslations("tools.realNetProfitCalculator");
  const commonT = useTranslations("common");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Input states
  const [revenue, setRevenue] = useState<string>("");
  const [productCost, setProductCost] = useState<string>("");
  const [adSpend, setAdSpend] = useState<string>("");
  const [shippingCost, setShippingCost] = useState<string>("");
  const [returnRate, setReturnRate] = useState<string>("");
  const [otherCosts, setOtherCosts] = useState<string>("");

  // CSV upload states
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvResult, setCsvResult] = useState<ParsedCSVResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Parse input values
  const parsedInputs = useMemo((): Partial<RealNetProfitInput> => ({
    revenue: parseFloat(revenue) || undefined,
    productCost: parseFloat(productCost) || undefined,
    adSpend: csvResult?.success ? csvResult.totalSpend : (parseFloat(adSpend) || undefined),
    shippingCost: parseFloat(shippingCost) || undefined,
    returnRate: parseFloat(returnRate) || undefined,
    otherCosts: parseFloat(otherCosts) || undefined,
  }), [revenue, productCost, adSpend, shippingCost, returnRate, otherCosts, csvResult]);

  // Calculate results
  const results: RealNetProfitResult | null = useMemo(() => {
    const { revenue, productCost, adSpend, shippingCost, returnRate } = parsedInputs;
    if (revenue === undefined || revenue <= 0) return null;
    
    return calculateRealNetProfit({
      revenue,
      productCost: productCost || 0,
      adSpend: adSpend || 0,
      shippingCost: shippingCost || 0,
      returnRate: returnRate || 0,
      otherCosts: parsedInputs.otherCosts || 0,
    });
  }, [parsedInputs]);

  const hasValidInputs = results !== null;
  const showResults = hasValidInputs && results;

  // Handle CSV file upload
  const handleFileUpload = useCallback(async (file: File) => {
    setCsvError(null);
    
    if (!file.name.endsWith('.csv')) {
      setCsvError(t("csvErrors.invalidFormat"));
      return;
    }

    try {
      const content = await file.text();
      const result = parseAdCSV(content);
      
      if (result.success) {
        setCsvFile(file);
        setCsvResult(result);
        // Auto-fill ad spend from CSV
        setAdSpend(result.totalSpend?.toFixed(2) || "0");
      } else {
        setCsvError(result.error || t("csvErrors.invalidFormat"));
        setCsvResult(null);
      }
    } catch {
      setCsvError(t("csvErrors.invalidFormat"));
    }
  }, [t]);

  // Drag and drop handlers
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
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const clearCsvFile = useCallback(() => {
    setCsvFile(null);
    setCsvResult(null);
    setCsvError(null);
    setAdSpend("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results || !parsedInputs.revenue) return "";
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("revenue")}: ${formatCurrency(parsedInputs.revenue)}
${t("productCost")}: ${formatCurrency(parsedInputs.productCost || 0)}
${t("adSpend")}: ${formatCurrency(parsedInputs.adSpend || 0)}
${t("shippingCost")}: ${formatCurrency(parsedInputs.shippingCost || 0)}
${t("returnRate")}: ${formatPercentage(parsedInputs.returnRate || 0)}
${t("otherCosts")}: ${formatCurrency(parsedInputs.otherCosts || 0)}
━━━━━━━━━━━━━━━━━━
${t("netProfit")}: ${formatCurrency(results.netProfit)}
${t("netProfitMargin")}: ${formatPercentage(results.netProfitMargin)}
${t("returnLosses")}: ${formatCurrency(results.returnLosses)}
${t("totalCosts")}: ${formatCurrency(results.totalCosts)}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, parsedInputs, t, isRTL]);

  // Export data for buttons
  const exportData: ExportData = useMemo(() => ({
    inputs: {
      [t("revenue")]: formatCurrency(parsedInputs.revenue || 0),
      [t("productCost")]: formatCurrency(parsedInputs.productCost || 0),
      [t("adSpend")]: formatCurrency(parsedInputs.adSpend || 0),
      [t("shippingCost")]: formatCurrency(parsedInputs.shippingCost || 0),
      [t("returnRate")]: formatPercentage(parsedInputs.returnRate || 0),
      [t("otherCosts")]: formatCurrency(parsedInputs.otherCosts || 0),
    },
    results: results ? {
      [t("netProfit")]: formatCurrency(results.netProfit),
      [t("netProfitMargin")]: formatPercentage(results.netProfitMargin),
      [t("returnLosses")]: formatCurrency(results.returnLosses),
      [t("totalCosts")]: formatCurrency(results.totalCosts),
    } : {},
    metadata: {
      toolName: t("title"),
      date: new Date().toLocaleDateString(locale),
      locale,
    },
  }), [parsedInputs, results, t, locale]);

  // Result card data
  const resultCardInputs = useMemo(() => ({
    revenue: { label: t("revenue"), value: formatCurrency(parsedInputs.revenue || 0) },
    productCost: { label: t("productCost"), value: formatCurrency(parsedInputs.productCost || 0) },
    adSpend: { label: t("adSpend"), value: formatCurrency(parsedInputs.adSpend || 0) },
    shippingCost: { label: t("shippingCost"), value: formatCurrency(parsedInputs.shippingCost || 0) },
    returnRate: { label: t("returnRate"), value: formatPercentage(parsedInputs.returnRate || 0) },
  }), [parsedInputs, t]);

  const resultCardOutputs = useMemo(() => {
    if (!results) return {};
    return {
      netProfit: { 
        label: t("netProfit"), 
        value: formatCurrency(results.netProfit), 
        highlight: true 
      },
      netProfitMargin: { 
        label: t("netProfitMargin"), 
        value: formatPercentage(results.netProfitMargin) 
      },
      returnLosses: { 
        label: t("returnLosses"), 
        value: formatCurrency(results.returnLosses) 
      },
    };
  }, [results, t]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CSV Upload Section - Requirement 1.2 */}
          <div className="space-y-2">
            <Label>{t("uploadCsv")}</Label>
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
                ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
                ${csvFile ? "bg-green-50 dark:bg-green-950/20 border-green-500" : ""}
                hover:border-primary/50 cursor-pointer
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label={t("dropZoneLabel")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
                aria-hidden="true"
              />
              
              {csvFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" aria-hidden="true" />
                  <div className="text-start">
                    <p className="font-medium text-green-700 dark:text-green-400">{csvFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {csvResult?.platform && `${t("platform")}: ${csvResult.platform}`}
                      {csvResult?.rowCount && ` • ${csvResult.rowCount} ${t("rows")}`}
                      {csvResult?.totalSpend !== undefined && ` • ${t("totalAdSpend")}: ${formatCurrency(csvResult.totalSpend)}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearCsvFile();
                    }}
                    aria-label={commonT("remove")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">
                    {t("dragDropCsv")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("supportedFormats")}
                  </p>
                </div>
              )}
            </div>
            
            {csvError && (
              <p className="text-sm text-destructive flex items-center gap-1" role="alert">
                <AlertTriangle className="h-4 w-4" />
                {csvError}
              </p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t("orEnterManually")}</span>
            </div>
          </div>

          {/* Manual Input Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Revenue Input */}
            <div className="space-y-2">
              <Label htmlFor="revenue">{t("revenue")}</Label>
              <Input
                id="revenue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
              />
            </div>

            {/* Product Cost Input */}
            <div className="space-y-2">
              <Label htmlFor="productCost">{t("productCost")}</Label>
              <Input
                id="productCost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={productCost}
                onChange={(e) => setProductCost(e.target.value)}
              />
            </div>

            {/* Ad Spend Input */}
            <div className="space-y-2">
              <Label htmlFor="adSpend">
                {t("adSpend")}
                {csvResult?.success && (
                  <span className="text-xs text-green-600 ms-1">({t("fromCsv")})</span>
                )}
              </Label>
              <Input
                id="adSpend"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={adSpend}
                onChange={(e) => setAdSpend(e.target.value)}
                disabled={csvResult?.success}
              />
            </div>

            {/* Shipping Cost Input */}
            <div className="space-y-2">
              <Label htmlFor="shippingCost">{t("shippingCost")}</Label>
              <Input
                id="shippingCost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
              />
            </div>

            {/* Return Rate Input */}
            <div className="space-y-2">
              <Label htmlFor="returnRate">{t("returnRate")}</Label>
              <Input
                id="returnRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="0"
                value={returnRate}
                onChange={(e) => setReturnRate(e.target.value)}
              />
            </div>

            {/* Other Costs Input */}
            <div className="space-y-2">
              <Label htmlFor="otherCosts">{t("otherCosts")}</Label>
              <Input
                id="otherCosts"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={otherCosts}
                onChange={(e) => setOtherCosts(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section - Requirement 1.7 */}
      {showResults && results && (
        <>
          {/* Main Result Card */}
          <Card 
            className={results.isProfitable ? "border-green-500" : "border-destructive"}
            role="region"
            aria-label={isRTL ? "نتائج الحساب" : "Calculation results"}
            aria-live="polite"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {results.isProfitable ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-500" aria-hidden="true" />
                    <span className="text-green-500">{t("profit")}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-5 w-5 text-destructive" aria-hidden="true" />
                    <span className="text-destructive">{t("loss")}</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Net Profit Display */}
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-1">{t("netProfit")}</p>
                <p className={`text-4xl font-bold ${results.isProfitable ? "text-green-500" : "text-destructive"}`}>
                  {results.netProfit < 0 ? "-" : "+"}{formatCurrency(Math.abs(results.netProfit))}
                </p>
                <p className={`text-lg ${results.isProfitable ? "text-green-600" : "text-destructive"}`}>
                  {formatPercentage(results.netProfitMargin)} {t("margin")}
                </p>
              </div>

              {/* Cost Breakdown Chart - Requirement 1.6 */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">{t("costBreakdown")}</h4>
                
                {/* Visual Bar Chart */}
                <div className="space-y-3">
                  {/* Product Cost */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{t("productCost")}</span>
                      <span className="font-medium">
                        {formatCurrency(results.costBreakdown.productCost.amount)} 
                        <span className="text-muted-foreground ms-1">
                          ({formatPercentage(results.costBreakdown.productCost.percentage)})
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          results.largestCostContributor === "productCost" && !results.isProfitable 
                            ? "bg-destructive" 
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${Math.min(results.costBreakdown.productCost.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Ad Spend */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{t("adSpend")}</span>
                      <span className="font-medium">
                        {formatCurrency(results.costBreakdown.adSpend.amount)}
                        <span className="text-muted-foreground ms-1">
                          ({formatPercentage(results.costBreakdown.adSpend.percentage)})
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          results.largestCostContributor === "adSpend" && !results.isProfitable 
                            ? "bg-destructive" 
                            : "bg-purple-500"
                        }`}
                        style={{ width: `${Math.min(results.costBreakdown.adSpend.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Shipping Cost */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{t("shippingCost")}</span>
                      <span className="font-medium">
                        {formatCurrency(results.costBreakdown.shippingCost.amount)}
                        <span className="text-muted-foreground ms-1">
                          ({formatPercentage(results.costBreakdown.shippingCost.percentage)})
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          results.largestCostContributor === "shippingCost" && !results.isProfitable 
                            ? "bg-destructive" 
                            : "bg-orange-500"
                        }`}
                        style={{ width: `${Math.min(results.costBreakdown.shippingCost.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Return Losses */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{t("returnLosses")}</span>
                      <span className="font-medium">
                        {formatCurrency(results.costBreakdown.returnLosses.amount)}
                        <span className="text-muted-foreground ms-1">
                          ({formatPercentage(results.costBreakdown.returnLosses.percentage)})
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          results.largestCostContributor === "returnLosses" && !results.isProfitable 
                            ? "bg-destructive" 
                            : "bg-yellow-500"
                        }`}
                        style={{ width: `${Math.min(results.costBreakdown.returnLosses.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Other Costs */}
                  {results.costBreakdown.otherCosts.amount > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{t("otherCosts")}</span>
                        <span className="font-medium">
                          {formatCurrency(results.costBreakdown.otherCosts.amount)}
                          <span className="text-muted-foreground ms-1">
                            ({formatPercentage(results.costBreakdown.otherCosts.percentage)})
                          </span>
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            results.largestCostContributor === "otherCosts" && !results.isProfitable 
                              ? "bg-destructive" 
                              : "bg-gray-500"
                          }`}
                          style={{ width: `${Math.min(results.costBreakdown.otherCosts.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Total Costs Summary */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between font-medium">
                    <span>{t("totalCosts")}</span>
                    <span>{formatCurrency(results.totalCosts)}</span>
                  </div>
                </div>

                {/* Warning for unprofitable - Requirement 1.7 */}
                {!results.isProfitable && (
                  <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-destructive">{t("unprofitableWarning")}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("largestCostIs")} <span className="font-medium">{t(results.largestCostContributor)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shareable Result Card (hidden, used for image generation) */}
          <div className="sr-only">
            <ResultCard
              ref={resultCardRef}
              toolName={t("title")}
              inputs={resultCardInputs}
              outputs={resultCardOutputs}
            />
          </div>

          {/* Export Buttons */}
          <ExportButtons
            data={exportData}
            filename="real-net-profit"
            title={t("title")}
            copyText={copyText}
          />
        </>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="realNetProfitCalculator" />
    </div>
  );
}
