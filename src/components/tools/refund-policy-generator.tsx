"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Copy, Download, Check, Store, Calendar, Settings } from "lucide-react";
import {
  generateRefundPolicy,
  getConditionOptions,
  getRefundMethodOptions,
  type RefundCondition,
  type RefundMethod,
  type RefundPolicyResult,
} from "@/lib/calculators/policy-generator";

export function RefundPolicyGenerator() {
  const t = useTranslations("tools.refundPolicyGenerator");
  const locale = useLocale() as 'ar' | 'en';
  
  const [storeName, setStoreName] = useState<string>("");
  const [returnWindow, setReturnWindow] = useState<string>("14");
  const [conditions, setConditions] = useState<RefundCondition[]>(['unused', 'original_packaging', 'with_receipt']);
  const [refundMethod, setRefundMethod] = useState<RefundMethod>('original');
  const [productCategories, setProductCategories] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const conditionOptions = useMemo(() => getConditionOptions(locale), [locale]);
  const refundMethodOptions = useMemo(() => getRefundMethodOptions(locale), [locale]);

  // Parse categories from comma-separated string
  const parsedCategories = useMemo(() => {
    if (!productCategories.trim()) return [];
    return productCategories.split(',').map(c => c.trim()).filter(c => c.length > 0);
  }, [productCategories]);

  // Generate policy in real-time
  const result: RefundPolicyResult | null = useMemo(() => {
    if (!storeName.trim()) return null;
    
    const windowDays = parseInt(returnWindow, 10);
    if (isNaN(windowDays) || windowDays < 0) return null;
    if (conditions.length === 0) return null;

    return generateRefundPolicy({
      storeName: storeName.trim(),
      returnWindow: windowDays,
      conditions,
      refundMethod,
      productCategories: parsedCategories.length > 0 ? parsedCategories : undefined,
      language: locale,
    });
  }, [storeName, returnWindow, conditions, refundMethod, parsedCategories, locale]);

  const handleConditionToggle = (condition: RefundCondition) => {
    setConditions(prev => 
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    );
  };

  const handleCopy = async () => {
    if (!result?.policy) return;
    try {
      await navigator.clipboard.writeText(result.policy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    if (!result?.policy) return;
    const blob = new Blob([result.policy], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refund-policy-${storeName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasValidInputs = storeName.trim() !== '' && conditions.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Store Name Input */}
          <div className="space-y-2">
            <Label htmlFor="storeName" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              {t("storeName")}
            </Label>
            <Input
              id="storeName"
              type="text"
              placeholder={locale === 'ar' ? 'اسم متجرك' : 'Your store name'}
              value={storeName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoreName(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Return Window Input */}
          <div className="space-y-2">
            <Label htmlFor="returnWindow" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t("returnWindow")}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="returnWindow"
                type="number"
                min="0"
                max="365"
                value={returnWindow}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnWindow(e.target.value)}
                className="w-24 text-lg"
                dir="ltr"
              />
              <span className="text-muted-foreground">
                {locale === 'ar' ? 'يوم' : 'days'}
              </span>
            </div>
          </div>

          {/* Return Conditions */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t("conditions")}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {conditionOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    conditions.includes(option.value)
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted/50 border-transparent hover:bg-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={conditions.includes(option.value)}
                    onChange={() => handleConditionToggle(option.value)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Refund Method */}
          <div className="space-y-3">
            <Label>{t("refundMethod")}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {refundMethodOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    refundMethod === option.value
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted/50 border-transparent hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="refundMethod"
                    checked={refundMethod === option.value}
                    onChange={() => setRefundMethod(option.value)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Product Categories (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="productCategories">
              {t("productCategories")}
              <span className="text-muted-foreground text-xs ml-1">
                ({locale === 'ar' ? 'اختياري' : 'optional'})
              </span>
            </Label>
            <Input
              id="productCategories"
              type="text"
              placeholder={locale === 'ar' ? 'إلكترونيات، ملابس، مستحضرات تجميل' : 'Electronics, Clothing, Cosmetics'}
              value={productCategories}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductCategories(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' 
                ? 'أدخل فئات المنتجات مفصولة بفواصل لإضافة استثناءات خاصة'
                : 'Enter product categories separated by commas to add special exceptions'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Generated Policy Section */}
      {result?.isComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("generatedPolicy")}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      {locale === 'ar' ? 'تم النسخ' : 'Copied'}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t("copy")}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t("download")}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                {result.policy}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Message */}
      {!hasValidInputs && storeName !== "" && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {locale === 'ar' 
            ? 'يرجى إدخال اسم المتجر واختيار شرط واحد على الأقل'
            : 'Please enter a store name and select at least one condition'
          }
        </p>
      )}
    </div>
  );
}
