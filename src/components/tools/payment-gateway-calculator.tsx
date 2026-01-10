"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Check } from "lucide-react";
import {
  calculatePaymentGatewayFee,
  formatNumber,
  formatPercentage,
  ALL_PROVIDERS,
  ALL_PAYMENT_METHODS,
  PROVIDER_NAMES,
  PAYMENT_METHOD_NAMES,
  type GatewayProvider,
  type PaymentMethod,
} from "@/lib/calculators/payment-gateway";
import { SEOContent, ResultCard, ShareButtons } from "@/components/tools/shared";

/**
 * Payment Gateway Fee Calculator Component
 * Calculates fees for local payment gateways (Tab, Paytabs, Moyasar, HyperPay)
 * Requirements: 3.1, 3.2, 3.3, 3.8
 */
export function PaymentGatewayCalculator() {
  const t = useTranslations("tools.paymentGatewayCalculator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states - Requirements 3.1, 3.2, 3.3
  const [amount, setAmount] = useState<string>("");
  const [provider, setProvider] = useState<GatewayProvider>("tab");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mada");

  // Parse input values
  const parsedAmount = useMemo(() => parseFloat(amount) || undefined, [amount]);

  // Calculate results in real-time
  const results = useMemo(() => {
    if (parsedAmount === undefined) return null;
    return calculatePaymentGatewayFee({
      amount: parsedAmount,
      provider,
      paymentMethod,
    });
  }, [parsedAmount, provider, paymentMethod]);

  const hasValidInputs = results !== null;
  const showResults = hasValidInputs && results;
  const hasAnyInput = amount !== "";


  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results || !parsedAmount) return "";
    const selectedResult = results.comparison.find(c => c.provider === provider);
    if (!selectedResult) return "";
    
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("amount")}: ${formatNumber(parsedAmount)} SAR
${t("provider")}: ${PROVIDER_NAMES[provider]}
${t("paymentMethod")}: ${PAYMENT_METHOD_NAMES[paymentMethod]}
━━━━━━━━━━━━━━━━━━
${t("fee")}: ${formatNumber(selectedResult.fee)} SAR
${t("netAmount")}: ${formatNumber(selectedResult.netAmount)} SAR
${t("feePercentage")}: ${formatPercentage(selectedResult.feePercentage)}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, parsedAmount, provider, paymentMethod, t, isRTL]);

  // Result card data for sharing
  const resultCardInputs = useMemo(() => ({
    amount: { label: t("amount"), value: `${formatNumber(parsedAmount || 0)} SAR` },
    provider: { label: t("provider"), value: PROVIDER_NAMES[provider] },
    paymentMethod: { label: t("paymentMethod"), value: PAYMENT_METHOD_NAMES[paymentMethod] },
  }), [parsedAmount, provider, paymentMethod, t]);

  const resultCardOutputs = useMemo((): Record<string, { label: string; value: string; highlight?: boolean }> => {
    if (!results) return {};
    return {
      fee: { label: t("fee"), value: `${formatNumber(results.fee)} SAR` },
      netAmount: { label: t("netAmount"), value: `${formatNumber(results.netAmount)} SAR`, highlight: true },
      feePercentage: { label: t("feePercentage"), value: formatPercentage(results.feePercentage) },
    };
  }, [results, t]);

  // Find cheapest provider for highlighting
  const cheapestProvider = useMemo(() => {
    if (!results) return null;
    return results.comparison.reduce((min, curr) => 
      curr.fee < min.fee ? curr : min
    );
  }, [results]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount Input - Requirement 3.1 */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t("amount")}</Label>
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

          {/* Provider Selection - Requirement 3.2 */}
          <div className="space-y-2">
            <Label>{t("provider")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PROVIDERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`p-3 rounded-lg border-2 transition-colors text-sm font-medium ${
                    provider === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/50"
                  }`}
                  aria-pressed={provider === p}
                >
                  {PROVIDER_NAMES[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selection - Requirement 3.3 */}
          <div className="space-y-2">
            <Label>{t("paymentMethod")}</Label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={`p-3 rounded-lg border-2 transition-colors text-sm font-medium ${
                    paymentMethod === pm
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/50"
                  }`}
                  aria-pressed={paymentMethod === pm}
                >
                  {PAYMENT_METHOD_NAMES[pm]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Results Section */}
      {showResults && results && (
        <>
          {/* Selected Provider Result */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
                {PROVIDER_NAMES[provider]} - {t("result")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Fee Amount */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("fee")}</dt>
                  <dd className="text-2xl font-bold text-orange-500">
                    {formatNumber(results.fee)} SAR
                  </dd>
                </div>

                {/* Net Amount */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("netAmount")}</dt>
                  <dd className="text-2xl font-bold text-green-500">
                    {formatNumber(results.netAmount)} SAR
                  </dd>
                </div>

                {/* Fee Percentage */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("feePercentage")}</dt>
                  <dd className="text-2xl font-bold text-blue-500">
                    {formatPercentage(results.feePercentage)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Comparison Table - Requirement 3.8 */}
          <Card>
            <CardHeader>
              <CardTitle>{t("comparison")}</CardTitle>
              <CardDescription>{t("comparisonDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start p-2 font-medium">{t("provider")}</th>
                      <th className="text-end p-2 font-medium">{t("fee")}</th>
                      <th className="text-end p-2 font-medium">{t("netAmount")}</th>
                      <th className="text-end p-2 font-medium">{t("feePercentage")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.comparison.map((comp) => {
                      const isCheapest = cheapestProvider && comp.provider === cheapestProvider.provider;
                      const isSelected = comp.provider === provider;
                      return (
                        <tr 
                          key={comp.provider}
                          className={`border-b last:border-0 ${
                            isSelected ? "bg-primary/5" : ""
                          } ${isCheapest ? "bg-green-50 dark:bg-green-950/20" : ""}`}
                        >
                          <td className="p-2 font-medium flex items-center gap-2">
                            {PROVIDER_NAMES[comp.provider]}
                            {isCheapest && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <Check className="h-3 w-3" />
                                {t("cheapest")}
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-end text-orange-500 font-medium">
                            {formatNumber(comp.fee)} SAR
                          </td>
                          <td className="p-2 text-end text-green-500 font-medium">
                            {formatNumber(comp.netAmount)} SAR
                          </td>
                          <td className="p-2 text-end text-blue-500">
                            {formatPercentage(comp.feePercentage)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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

          {/* Share Buttons */}
          <ShareButtons
            copyText={copyText}
          />
        </>
      )}

      {/* Validation Message */}
      {!hasValidInputs && hasAnyInput && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterValidAmount")}
        </p>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="paymentGatewayCalculator" />
    </div>
  );
}
