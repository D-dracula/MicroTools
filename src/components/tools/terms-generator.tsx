"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollText, Copy, Download, Check, Store, Globe, Mail, FileText } from "lucide-react";
import {
  generateTermsOfService,
  getClauseOptions,
  type TermsClause,
  type TermsResult,
} from "@/lib/calculators/terms-generator";

export function TermsGenerator() {
  const t = useTranslations("tools.termsGenerator");
  const locale = useLocale() as 'ar' | 'en';
  
  const [storeName, setStoreName] = useState<string>("");
  const [storeUrl, setStoreUrl] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [clauses, setClauses] = useState<TermsClause[]>(['payment', 'delivery', 'liability', 'privacy']);
  const [customTerms, setCustomTerms] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const clauseOptions = useMemo(() => getClauseOptions(locale), [locale]);

  // Generate terms in real-time
  const result: TermsResult | null = useMemo(() => {
    if (!storeName.trim() || !storeUrl.trim() || !contactEmail.trim()) return null;
    if (clauses.length === 0) return null;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) return null;

    return generateTermsOfService({
      storeName: storeName.trim(),
      storeUrl: storeUrl.trim(),
      contactEmail: contactEmail.trim(),
      clauses,
      customTerms: customTerms.trim() || undefined,
      language: locale,
    });
  }, [storeName, storeUrl, contactEmail, clauses, customTerms, locale]);

  const handleClauseToggle = (clause: TermsClause) => {
    setClauses(prev => 
      prev.includes(clause)
        ? prev.filter(c => c !== clause)
        : [...prev, clause]
    );
  };

  const handleCopy = async () => {
    if (!result?.document) return;
    try {
      await navigator.clipboard.writeText(result.document);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    if (!result?.document) return;
    const blob = new Blob([result.document], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terms-of-service-${storeName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasValidInputs = storeName.trim() !== '' && storeUrl.trim() !== '' && contactEmail.trim() !== '' && clauses.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" aria-hidden="true" />
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

          {/* Store URL Input */}
          <div className="space-y-2">
            <Label htmlFor="storeUrl" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t("storeUrl")}
            </Label>
            <Input
              id="storeUrl"
              type="url"
              placeholder="https://example.com"
              value={storeUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStoreUrl(e.target.value)}
              className="text-lg"
              dir="ltr"
            />
          </div>

          {/* Contact Email Input */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t("contactEmail")}
            </Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="support@example.com"
              value={contactEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactEmail(e.target.value)}
              className="text-lg"
              dir="ltr"
            />
          </div>

          {/* Clause Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t("selectClauses")}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {clauseOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                    clauses.includes(option.value)
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted/50 border-transparent hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={clauses.includes(option.value)}
                      onChange={() => handleClauseToggle(option.value)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mr-7">
                    {option.description}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Terms (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="customTerms">
              {t("customTerms")}
              <span className="text-muted-foreground text-xs ml-1">
                ({locale === 'ar' ? 'اختياري' : 'optional'})
              </span>
            </Label>
            <textarea
              id="customTerms"
              placeholder={locale === 'ar' 
                ? 'أضف شروطاً إضافية خاصة بمتجرك...'
                : 'Add additional terms specific to your store...'
              }
              value={customTerms}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomTerms(e.target.value)}
              className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm resize-y"
            />
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' 
                ? 'يمكنك إضافة شروط مخصصة ستظهر في قسم منفصل'
                : 'You can add custom terms that will appear in a separate section'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Generated Terms Section */}
      {result?.isComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("generatedTerms")}</span>
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
                {result.document}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Message */}
      {!hasValidInputs && (storeName !== "" || storeUrl !== "" || contactEmail !== "") && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {locale === 'ar' 
            ? 'يرجى إدخال جميع المعلومات المطلوبة واختيار بند واحد على الأقل'
            : 'Please enter all required information and select at least one clause'
          }
        </p>
      )}
    </div>
  );
}
