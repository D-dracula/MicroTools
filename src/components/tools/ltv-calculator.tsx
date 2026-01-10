"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, AlertTriangle, CheckCircle, TrendingUp, DollarSign } from "lucide-react";
import {
  calculateLTV,
  formatCurrency,
  formatRatio,
  getStatusColor,
  getRatioStatus,
  LTV_CAC_BENCHMARKS,
  type LTVResult,
} from "@/lib/calculators/ltv-calculator";

export function LTVCalculator() {
  const t = useTranslations("tools.ltvCalculator");
  const locale = useLocale();
  
  const [averageOrderValue, setAverageOrderValue] = useState<string>("");
  const [purchaseFrequency, setPurchaseFrequency] = useState<string>("");
  const [customerLifespan, setCustomerLifespan] = useState<string>("");
  const [customerAcquisitionCost, setCustomerAcquisitionCost] = useState<string>("");

  // Parse input values to numbers
  const parsedAOV = useMemo(() => {
    const value = parseFloat(averageOrderValue);
    return isNaN(value) || value <= 0 ? undefined : value;
  }, [averageOrderValue]);

  const parsedFrequency = useMemo(() => {
    const value = parseFloat(purchaseFrequency);
    return isNaN(value) || value <= 0 ? undefined : value;
  }, [purchaseFrequency]);

  const parsedLifespan = useMemo(() => {
    const value = parseFloat(customerLifespan);
    return isNaN(value) || value <= 0 ? undefined : value;
  }, [customerLifespan]);

  const parsedCAC = useMemo(() => {
    const value = parseFloat(customerAcquisitionCost);
    return isNaN(value) || value <= 0 ? undefined : value;
  }, [customerAcquisitionCost]);

  // Calculate results in real-time
  const results = useMemo(() => {
    if (parsedAOV === undefined || parsedFrequency === undefined || parsedLifespan === undefined) {
      return null;
    }
    const result = calculateLTV(
      { 
        averageOrderValue: parsedAOV, 
        purchaseFrequency: parsedFrequency, 
        customerLifespan: parsedLifespan,
        customerAcquisitionCost: parsedCAC,
      },
      locale as 'ar' | 'en'
    );
    
    if ('isValid' in result && result.isValid === false) {
      return null;
    }
    return result as LTVResult;
  }, [parsedAOV, parsedFrequency, parsedLifespan, parsedCAC, locale]);

  const hasValidInputs = parsedAOV !== undefined && parsedFrequency !== undefined && parsedLifespan !== undefined;
  const showResults = results !== null;
  const ratioStatus = results?.ltvCacRatio ? getRatioStatus(results.ltvCacRatio) : undefined;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Average Order Value Input */}
          <div className="space-y-2">
            <Label htmlFor="averageOrderValue">{t("averageOrderValue")}</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="averageOrderValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={averageOrderValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAverageOrderValue(e.target.value)}
                className="text-lg pl-10"
                dir="ltr"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'متوسط قيمة الطلب الواحد' : 'Average value per order'}
            </p>
          </div>

          {/* Purchase Frequency Input */}
          <div className="space-y-2">
            <Label htmlFor="purchaseFrequency">{t("purchaseFrequency")}</Label>
            <Input
              id="purchaseFrequency"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              value={purchaseFrequency}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPurchaseFrequency(e.target.value)}
              className="text-lg"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'عدد مرات الشراء في السنة' : 'Number of purchases per year'}
            </p>
          </div>

          {/* Customer Lifespan Input */}
          <div className="space-y-2">
            <Label htmlFor="customerLifespan">{t("customerLifespan")}</Label>
            <Input
              id="customerLifespan"
              type="number"
              min="0"
              step="0.1"
              placeholder="0"
              value={customerLifespan}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerLifespan(e.target.value)}
              className="text-lg"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'متوسط فترة بقاء العميل بالسنوات' : 'Average customer lifespan in years'}
            </p>
          </div>

          {/* Customer Acquisition Cost Input (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="customerAcquisitionCost">
              {t("customerAcquisitionCost")} 
              <span className="text-muted-foreground text-xs ml-1">
                ({locale === 'ar' ? 'اختياري' : 'optional'})
              </span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="customerAcquisitionCost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={customerAcquisitionCost}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerAcquisitionCost(e.target.value)}
                className="text-lg pl-10"
                dir="ltr"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'تكلفة اكتساب عميل جديد' : 'Cost to acquire a new customer'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && results && (
        <>
          {/* Warning Banner */}
          {results.warning && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-destructive font-medium">{results.warning}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Results */}
          <Card 
            className={`border-2 ${
              !results.isHealthy ? 'border-red-500' :
              ratioStatus === 'excellent' ? 'border-green-500' :
              ratioStatus === 'good' ? 'border-blue-500' :
              ratioStatus === 'minimum' ? 'border-yellow-500' :
              'border-gray-300'
            }`}
            role="region"
            aria-label={locale === "ar" ? "نتائج الحساب" : "Calculation results"}
            aria-live="polite"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" aria-hidden="true" />
                {t("results")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* LTV Value */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t("customerLifetimeValue")}
                  </div>
                  <div className={`text-3xl font-bold ${results.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(results.ltv, locale)}
                  </div>
                </div>

                {/* LTV:CAC Ratio */}
                {results.ltvCacRatio !== undefined && (
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <div className="text-sm text-muted-foreground mb-1">
                      {t("ltvCacRatio")}
                    </div>
                    <div className={`text-3xl font-bold ${ratioStatus ? getStatusColor(ratioStatus) : ''}`}>
                      {formatRatio(results.ltvCacRatio)}
                    </div>
                  </div>
                )}
              </div>

              {/* Ratio Benchmark */}
              {results.ltvCacRatio !== undefined && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    {t("ratioBenchmark")}
                  </h4>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between text-xs">
                      <span>{locale === 'ar' ? 'ضعيف (<1)' : 'Poor (<1)'}</span>
                      <span>{locale === 'ar' ? 'الحد الأدنى (3)' : 'Minimum (3)'}</span>
                      <span>{locale === 'ar' ? 'جيد (4)' : 'Good (4)'}</span>
                      <span>{locale === 'ar' ? 'ممتاز (5+)' : 'Excellent (5+)'}</span>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-muted">
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${(LTV_CAC_BENCHMARKS.poor / LTV_CAC_BENCHMARKS.excellent) * 100}%` }}
                      />
                      <div 
                        className="bg-yellow-500" 
                        style={{ width: `${((LTV_CAC_BENCHMARKS.minimum - LTV_CAC_BENCHMARKS.poor) / LTV_CAC_BENCHMARKS.excellent) * 100}%` }}
                      />
                      <div 
                        className="bg-blue-500" 
                        style={{ width: `${((LTV_CAC_BENCHMARKS.good - LTV_CAC_BENCHMARKS.minimum) / LTV_CAC_BENCHMARKS.excellent) * 100}%` }}
                      />
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${((LTV_CAC_BENCHMARKS.excellent - LTV_CAC_BENCHMARKS.good) / LTV_CAC_BENCHMARKS.excellent) * 100}%` }}
                      />
                    </div>
                    {/* Marker for current ratio */}
                    <div 
                      className="absolute top-6 w-0.5 h-4 bg-foreground transform -translate-x-1/2"
                      style={{ 
                        left: `${Math.min((results.ltvCacRatio / LTV_CAC_BENCHMARKS.excellent) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-center mt-4">
                    {locale === 'ar' 
                      ? 'النسبة المثالية هي 3:1 أو أعلى'
                      : 'Ideal ratio is 3:1 or higher'
                    }
                  </div>
                </div>
              )}

              {/* Formula Display */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">
                  {locale === 'ar' ? 'المعادلة' : 'Formula'}
                </h4>
                <p className="text-sm font-mono">
                  LTV = AOV × Frequency × Lifespan
                </p>
                <p className="text-sm font-mono mt-1">
                  LTV = {formatCurrency(parsedAOV || 0, locale)} × {parsedFrequency} × {parsedLifespan} = {formatCurrency(results.ltv, locale)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {results.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("recommendations")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {results.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Validation Message */}
      {!hasValidInputs && (averageOrderValue !== "" || purchaseFrequency !== "" || customerLifespan !== "") && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterValidNumbers")}
        </p>
      )}
    </div>
  );
}
