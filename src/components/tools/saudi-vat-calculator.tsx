"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  calculateSaudiVAT,
  formatNumber,
  SAUDI_VAT_RATE,
  type VATMode,
} from "@/lib/calculators/saudi-vat";
import { SEOContent, ResultCard, ShareButtons } from "@/components/tools/shared";

/**
 * Saudi VAT Calculator Component
 * Calculates VAT with add/extract modes for Saudi Arabia (15%)
 * Requirements: 8.1, 8.2
 */
export function SaudiVATCalculator() {
  const t = useTranslations("tools.saudiVATCalculator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states - Requirements 8.1, 8.2
  const [amount, setAmount] = useState<string>("");
  const [mode, setMode] = useState<VATMode>("add");

  // Parse input values to numbers
  const parsedAmount = useMemo(() => {
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? undefined : parsed;
  }, [amount]);

  // Calculate results in real-time
  const results = useMemo(() => {
    if (parsedAmount === undefined) {
      return null;
    }
    return calculateSaudiVAT({
      amount: parsedAmount,
      mode,
    });
  }, [parsedAmount, mode]);

  const hasValidInputs = results !== null;
  const showResults = hasValidInputs && results;
  const hasAnyInput = amount !== "";

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results || parsedAmount === undefined) return "";
    const modeLabel = mode === "add" ? t("addVAT") : t("extractVAT");
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("mode")}: ${modeLabel}
${t("amount")}: ${formatNumber(parsedAmount)} SAR
━━━━━━━━━━━━━━━━━━
${t("amountBeforeVAT")}: ${formatNumber(results.amountBeforeVAT)} SAR
${t("vatAmount")} (${SAUDI_VAT_RATE}%): ${formatNumber(results.vatAmount)} SAR
${t("totalWithVAT")}: ${formatNumber(results.totalWithVAT)} SAR
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, parsedAmount, mode, t, isRTL]);

  // Result card data for sharing
  const resultCardInputs = useMemo(() => ({
    mode: { label: t("mode"), value: mode === "add" ? t("addVAT") : t("extractVAT") },
    amount: { label: t("amount"), value: `${formatNumber(parsedAmount || 0)} SAR` },
  }), [parsedAmount, mode, t]);

  const resultCardOutputs = useMemo(() => {
    if (!results) return {};
    return {
      amountBeforeVAT: { label: t("amountBeforeVAT"), value: `${formatNumber(results.amountBeforeVAT)} SAR` },
      vatAmount: { label: `${t("vatAmount")} (${SAUDI_VAT_RATE}%)`, value: `${formatNumber(results.vatAmount)} SAR` },
      totalWithVAT: { label: t("totalWithVAT"), value: `${formatNumber(results.totalWithVAT)} SAR`, highlight: true },
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
        <CardContent className="space-y-4">
          {/* Mode Toggle - Requirement 8.2 */}
          <div className="space-y-2">
            <Label>{t("mode")}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "add" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setMode("add")}
                aria-pressed={mode === "add"}
              >
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                {t("addVAT")}
              </Button>
              <Button
                type="button"
                variant={mode === "extract" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setMode("extract")}
                aria-pressed={mode === "extract"}
              >
                <Minus className="h-4 w-4 mr-2" aria-hidden="true" />
                {t("extractVAT")}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {mode === "add" ? t("addVATDescription") : t("extractVATDescription")}
            </p>
          </div>

          {/* Amount Input - Requirement 8.1 */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              {mode === "add" ? t("amountBeforeVAT") : t("amountWithVAT")}
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
              className="text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && results && (
        <>
          <Card 
            className="border-green-500"
            role="region"
            aria-label={isRTL ? "نتائج الحساب" : "Calculation results"}
            aria-live="polite"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-green-500" aria-hidden="true" />
                <span className="text-green-500">{t("results")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Amount Before VAT - Requirement 8.6 */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("amountBeforeVAT")}</dt>
                  <dd className="text-2xl font-bold">
                    {formatNumber(results.amountBeforeVAT)} <span className="text-sm">SAR</span>
                  </dd>
                </div>

                {/* VAT Amount - Requirement 8.5 */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">
                    {t("vatAmount")} ({SAUDI_VAT_RATE}%)
                  </dt>
                  <dd className="text-2xl font-bold text-orange-500">
                    {formatNumber(results.vatAmount)} <span className="text-sm">SAR</span>
                  </dd>
                </div>

                {/* Total With VAT - Requirement 8.7 */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("totalWithVAT")}</dt>
                  <dd className="text-2xl font-bold text-green-500">
                    {formatNumber(results.totalWithVAT)} <span className="text-sm">SAR</span>
                  </dd>
                </div>
              </dl>
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

          {/* Share Buttons */}
          <ShareButtons
            copyText={copyText}
          />
        </>
      )}

      {/* Validation Message */}
      {!hasValidInputs && hasAnyInput && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterValidNumbers")}
        </p>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="saudiVATCalculator" />
    </div>
  );
}
