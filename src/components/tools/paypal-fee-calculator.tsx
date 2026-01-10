"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, ArrowRight, AlertCircle } from "lucide-react";
import {
  calculatePayPalFees,
  formatPercentage,
  formatCurrency,
  ALL_CURRENCIES,
  ALL_TRANSACTION_TYPES,
  CURRENCY_NAMES,
  TRANSACTION_TYPE_NAMES,
  CONVERSION_FEE_PERCENTAGE,
  type Currency,
  type TransactionType,
} from "@/lib/calculators/paypal-fee";
import { SEOContent, ResultCard, ShareButtons } from "@/components/tools/shared";

/**
 * PayPal Fee Calculator Component
 * Calculates PayPal fees for international transactions
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export function PayPalFeeCalculator() {
  const t = useTranslations("tools.paypalFeeCalculator");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const resultCardRef = useRef<HTMLDivElement>(null);

  // Input states - Requirements 5.1, 5.2, 5.3, 5.4
  const [amount, setAmount] = useState<string>("");
  const [senderCurrency, setSenderCurrency] = useState<Currency>("USD");
  const [receiverCurrency, setReceiverCurrency] = useState<Currency>("USD");
  const [transactionType, setTransactionType] = useState<TransactionType>("goods_services");

  // Parse input values
  const parsedAmount = useMemo(() => parseFloat(amount) || undefined, [amount]);

  // Calculate results in real-time
  const results = useMemo(() => {
    if (parsedAmount === undefined) return null;
    return calculatePayPalFees({
      amount: parsedAmount,
      senderCurrency,
      receiverCurrency,
      transactionType,
    });
  }, [parsedAmount, senderCurrency, receiverCurrency, transactionType]);

  const hasValidInputs = results !== null;
  const showResults = hasValidInputs && results;
  const hasAnyInput = amount !== "";
  const hasCurrencyConversion = senderCurrency !== receiverCurrency;

  // Generate copy text for sharing
  const copyText = useMemo(() => {
    if (!results || !parsedAmount) return "";
    
    return `${t("title")}
━━━━━━━━━━━━━━━━━━
${t("amount")}: ${formatCurrency(parsedAmount, senderCurrency)}
${t("senderCurrency")}: ${CURRENCY_NAMES[senderCurrency]}
${t("receiverCurrency")}: ${CURRENCY_NAMES[receiverCurrency]}
${t("transactionType")}: ${TRANSACTION_TYPE_NAMES[transactionType]}
━━━━━━━━━━━━━━━━━━
${t("paypalFee")}: ${formatCurrency(results.paypalFee, receiverCurrency)}
${hasCurrencyConversion ? `${t("conversionFee")}: ${formatCurrency(results.conversionFee, receiverCurrency)}\n` : ""}${t("totalFees")}: ${formatCurrency(results.totalFees, receiverCurrency)}
${t("netAmount")}: ${formatCurrency(results.netAmount, receiverCurrency)}
${t("effectiveFeePercentage")}: ${formatPercentage(results.effectiveFeePercentage)}
━━━━━━━━━━━━━━━━━━
${isRTL ? "أدوات التجارة" : "Micro Tools"}`;
  }, [results, parsedAmount, senderCurrency, receiverCurrency, transactionType, hasCurrencyConversion, t, isRTL]);

  // Result card data for sharing
  const resultCardInputs = useMemo(() => ({
    amount: { label: t("amount"), value: formatCurrency(parsedAmount || 0, senderCurrency) },
    senderCurrency: { label: t("senderCurrency"), value: CURRENCY_NAMES[senderCurrency] },
    receiverCurrency: { label: t("receiverCurrency"), value: CURRENCY_NAMES[receiverCurrency] },
    transactionType: { label: t("transactionType"), value: TRANSACTION_TYPE_NAMES[transactionType] },
  }), [parsedAmount, senderCurrency, receiverCurrency, transactionType, t]);

  const resultCardOutputs = useMemo((): Record<string, { label: string; value: string; highlight?: boolean }> => {
    if (!results) return {};
    const outputs: Record<string, { label: string; value: string; highlight?: boolean }> = {
      paypalFee: { label: t("paypalFee"), value: formatCurrency(results.paypalFee, receiverCurrency) },
    };
    
    if (hasCurrencyConversion) {
      outputs.conversionFee = { label: t("conversionFee"), value: formatCurrency(results.conversionFee, receiverCurrency) };
    }
    
    outputs.totalFees = { label: t("totalFees"), value: formatCurrency(results.totalFees, receiverCurrency) };
    outputs.netAmount = { label: t("netAmount"), value: formatCurrency(results.netAmount, receiverCurrency), highlight: true };
    outputs.effectiveFeePercentage = { label: t("effectiveFeePercentage"), value: formatPercentage(results.effectiveFeePercentage) };
    
    return outputs;
  }, [results, receiverCurrency, hasCurrencyConversion, t]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount Input - Requirement 5.1 */}
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

          {/* Currency Selection - Requirements 5.2, 5.3 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sender Currency */}
            <div className="space-y-2">
              <Label htmlFor="senderCurrency">{t("senderCurrency")}</Label>
              <select
                id="senderCurrency"
                value={senderCurrency}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSenderCurrency(e.target.value as Currency)}
                className="w-full p-3 rounded-lg border-2 border-muted bg-background text-sm font-medium focus:border-primary focus:outline-none"
              >
                {ALL_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {CURRENCY_NAMES[currency]}
                  </option>
                ))}
              </select>
            </div>

            {/* Arrow indicator */}
            <div className="hidden sm:flex items-end justify-center pb-3">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Receiver Currency */}
            <div className="space-y-2 sm:col-start-2">
              <Label htmlFor="receiverCurrency">{t("receiverCurrency")}</Label>
              <select
                id="receiverCurrency"
                value={receiverCurrency}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReceiverCurrency(e.target.value as Currency)}
                className="w-full p-3 rounded-lg border-2 border-muted bg-background text-sm font-medium focus:border-primary focus:outline-none"
              >
                {ALL_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {CURRENCY_NAMES[currency]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Currency Conversion Notice */}
          {hasCurrencyConversion && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{t("conversionNotice", { rate: CONVERSION_FEE_PERCENTAGE })}</span>
            </div>
          )}

          {/* Transaction Type Selection - Requirement 5.4 */}
          <div className="space-y-2">
            <Label>{t("transactionType")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_TRANSACTION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTransactionType(type)}
                  className={`p-3 rounded-lg border-2 transition-colors text-sm font-medium ${
                    transactionType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-muted hover:border-primary/50"
                  }`}
                  aria-pressed={transactionType === type}
                >
                  {TRANSACTION_TYPE_NAMES[type]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {showResults && results && (
        <>
          {/* Fee Results */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" aria-hidden="true" />
                {t("result")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PayPal Fee */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("paypalFee")}</dt>
                  <dd className="text-2xl font-bold text-orange-500">
                    {formatCurrency(results.paypalFee, receiverCurrency)}
                  </dd>
                </div>

                {/* Conversion Fee (if applicable) */}
                {hasCurrencyConversion && (
                  <div className="text-center p-4 rounded-lg bg-muted">
                    <dt className="text-sm text-muted-foreground mb-1">{t("conversionFee")}</dt>
                    <dd className="text-2xl font-bold text-amber-500">
                      {formatCurrency(results.conversionFee, receiverCurrency)}
                    </dd>
                  </div>
                )}

                {/* Total Fees */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("totalFees")}</dt>
                  <dd className="text-2xl font-bold text-red-500">
                    {formatCurrency(results.totalFees, receiverCurrency)}
                  </dd>
                </div>

                {/* Net Amount */}
                <div className="text-center p-4 rounded-lg bg-muted">
                  <dt className="text-sm text-muted-foreground mb-1">{t("netAmount")}</dt>
                  <dd className="text-2xl font-bold text-green-500">
                    {formatCurrency(results.netAmount, receiverCurrency)}
                  </dd>
                </div>

                {/* Effective Fee Percentage */}
                <div className={`text-center p-4 rounded-lg bg-muted ${hasCurrencyConversion ? "" : "sm:col-span-2"}`}>
                  <dt className="text-sm text-muted-foreground mb-1">{t("effectiveFeePercentage")}</dt>
                  <dd className="text-2xl font-bold text-blue-500">
                    {formatPercentage(results.effectiveFeePercentage)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Fee Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t("breakdown")}</CardTitle>
              <CardDescription>{t("breakdownDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm" role="table">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start p-2 font-medium">{t("item")}</th>
                      <th className="text-end p-2 font-medium">{t("amountLabel")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">{t("originalAmount")}</td>
                      <td className="p-2 text-end font-medium">
                        {formatCurrency(parsedAmount || 0, senderCurrency)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-orange-500">{t("paypalFee")}</td>
                      <td className="p-2 text-end font-medium text-orange-500">
                        -{formatCurrency(results.paypalFee, receiverCurrency)}
                      </td>
                    </tr>
                    {hasCurrencyConversion && (
                      <tr className="border-b">
                        <td className="p-2 text-amber-500">{t("conversionFee")} ({CONVERSION_FEE_PERCENTAGE}%)</td>
                        <td className="p-2 text-end font-medium text-amber-500">
                          -{formatCurrency(results.conversionFee, receiverCurrency)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b bg-muted/50">
                      <td className="p-2 font-medium">{t("totalFees")}</td>
                      <td className="p-2 text-end font-bold text-red-500">
                        -{formatCurrency(results.totalFees, receiverCurrency)}
                      </td>
                    </tr>
                    <tr className="bg-green-50 dark:bg-green-950/20">
                      <td className="p-2 font-medium text-green-600 dark:text-green-400">{t("netAmount")}</td>
                      <td className="p-2 text-end font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(results.netAmount, receiverCurrency)}
                      </td>
                    </tr>
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
      <SEOContent toolSlug="paypalFeeCalculator" />
    </div>
  );
}
