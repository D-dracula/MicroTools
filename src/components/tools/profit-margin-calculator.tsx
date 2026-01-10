"use client";

import { useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, TrendingDown, Save, LogIn } from "lucide-react";
import {
  calculateProfitMargin_Full,
  formatNumber,
  formatPercentage,
  type ProfitCalculationOutputs,
} from "@/lib/calculators/profit-margin";

interface ProfitMarginCalculatorProps {
  onSave?: (inputs: { costPrice: number; sellingPrice: number }, outputs: ProfitCalculationOutputs) => Promise<void>;
}

export function ProfitMarginCalculator({ onSave }: ProfitMarginCalculatorProps) {
  const t = useTranslations("tools.profitMarginCalculator");
  const locale = useLocale();
  const { data: session, status } = useSession();
  
  const [costPrice, setCostPrice] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Parse input values to numbers
  const parsedCostPrice = useMemo(() => {
    const value = parseFloat(costPrice);
    return isNaN(value) ? undefined : value;
  }, [costPrice]);

  const parsedSellingPrice = useMemo(() => {
    const value = parseFloat(sellingPrice);
    return isNaN(value) ? undefined : value;
  }, [sellingPrice]);

  // Calculate results in real-time (Requirement 6.8)
  const results = useMemo(() => {
    if (parsedCostPrice === undefined || parsedSellingPrice === undefined) {
      return null;
    }
    return calculateProfitMargin_Full({
      costPrice: parsedCostPrice,
      sellingPrice: parsedSellingPrice,
    });
  }, [parsedCostPrice, parsedSellingPrice]);

  // Handle save calculation (Requirement 8.2)
  const handleSave = useCallback(async () => {
    if (!results || !parsedCostPrice || !parsedSellingPrice || !onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(
        { costPrice: parsedCostPrice, sellingPrice: parsedSellingPrice },
        results
      );
    } finally {
      setIsSaving(false);
    }
  }, [results, parsedCostPrice, parsedSellingPrice, onSave]);

  const isAuthenticated = status === "authenticated" && session?.user;
  const hasValidInputs = parsedCostPrice !== undefined && parsedSellingPrice !== undefined;
  const showResults = results !== null;

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
        <CardContent className="space-y-4">
          {/* Cost Price Input (Requirement 6.1) */}
          <div className="space-y-2">
            <Label htmlFor="costPrice">{t("costPrice")}</Label>
            <Input
              id="costPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={costPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCostPrice(e.target.value)}
              className="text-lg"
              aria-describedby={!hasValidInputs && costPrice !== "" ? "validation-message" : undefined}
            />
          </div>

          {/* Selling Price Input (Requirement 6.2) */}
          <div className="space-y-2">
            <Label htmlFor="sellingPrice">{t("sellingPrice")}</Label>
            <Input
              id="sellingPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={sellingPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSellingPrice(e.target.value)}
              className="text-lg"
              aria-describedby={!hasValidInputs && sellingPrice !== "" ? "validation-message" : undefined}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && results && (
        <Card 
          className={results.isLoss ? "border-destructive" : "border-green-500"}
          role="region"
          aria-label={locale === "ar" ? "نتائج الحساب" : "Calculation results"}
          aria-live="polite"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.isLoss ? (
                <>
                  <TrendingDown className="h-5 w-5 text-destructive" aria-hidden="true" />
                  <span className="text-destructive">{t("loss")}</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-5 w-5 text-green-500" aria-hidden="true" />
                  <span className="text-green-500">{t("profit")}</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Profit Amount (Requirement 6.3) */}
              <div className="text-center p-4 rounded-lg bg-muted">
                <dt className="text-sm text-muted-foreground mb-1">{t("profit")}</dt>
                <dd className={`text-2xl font-bold ${results.isLoss ? "text-destructive" : "text-green-500"}`}>
                  {results.isLoss ? "-" : "+"}{formatNumber(Math.abs(results.profit))}
                </dd>
              </div>

              {/* Profit Margin (Requirement 6.4) */}
              <div className="text-center p-4 rounded-lg bg-muted">
                <dt className="text-sm text-muted-foreground mb-1">{t("profitMargin")}</dt>
                <dd className={`text-2xl font-bold ${results.isLoss ? "text-destructive" : "text-green-500"}`}>
                  {formatPercentage(results.profitMargin)}
                </dd>
              </div>

              {/* Markup (Requirement 6.5) */}
              <div className="text-center p-4 rounded-lg bg-muted">
                <dt className="text-sm text-muted-foreground mb-1">{t("markup")}</dt>
                <dd className={`text-2xl font-bold ${results.isLoss ? "text-destructive" : "text-green-500"}`}>
                  {formatPercentage(results.markup)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Validation Message */}
      {!hasValidInputs && (costPrice !== "" || sellingPrice !== "") && (
        <p id="validation-message" className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterValidNumbers")}
        </p>
      )}

      {/* Save Button Section (Requirement 8.2) */}
      {showResults && (
        <div className="flex justify-center">
          {isAuthenticated ? (
            <Button
              onClick={handleSave}
              disabled={isSaving || !onSave}
              className="gap-2"
              aria-busy={isSaving}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {isSaving ? "..." : t("saveCalculation")}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {t("loginToSave")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
