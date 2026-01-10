"use client";

import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Copy, Check, RefreshCw, Store, Utensils, Shirt, Cpu, Briefcase, Package } from "lucide-react";
import { toast } from "sonner";
import { generateBusinessNames, type BusinessCategory, type NameGeneratorResult } from "@/lib/calculators/business-name-generator";
import { ShareButtons } from "./shared/share-buttons";
import { SEOContent } from "./shared/seo-content";

const CATEGORY_ICONS: Record<BusinessCategory, React.ReactNode> = {
  retail: <Store className="h-4 w-4" />,
  food: <Utensils className="h-4 w-4" />,
  fashion: <Shirt className="h-4 w-4" />,
  technology: <Cpu className="h-4 w-4" />,
  services: <Briefcase className="h-4 w-4" />,
  general: <Package className="h-4 w-4" />,
};

export function BusinessNameGenerator() {
  const t = useTranslations("tools.businessNameGenerator");
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';
  
  const [keywords, setKeywords] = useState<string>("");
  const [category, setCategory] = useState<BusinessCategory>("general");
  const [result, setResult] = useState<NameGeneratorResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const resultCardRef = useRef<HTMLDivElement>(null);

  const categories: { key: BusinessCategory; label: string }[] = [
    { key: 'retail', label: t('categories.retail') },
    { key: 'food', label: t('categories.food') },
    { key: 'fashion', label: t('categories.fashion') },
    { key: 'technology', label: t('categories.technology') },
    { key: 'services', label: t('categories.services') },
    { key: 'general', label: t('categories.general') },
  ];

  const handleGenerate = () => {
    if (!keywords.trim()) {
      toast.error(isRTL ? 'الرجاء إدخال كلمة مفتاحية' : 'Please enter a keyword');
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate a brief delay for better UX
    setTimeout(() => {
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
      const generated = generateBusinessNames({
        keywords: keywordList,
        category,
        language: locale,
      });
      setResult(generated);
      setIsGenerating(false);
    }, 300);
  };

  const handleCopyName = async (name: string, index: number) => {
    try {
      await navigator.clipboard.writeText(name);
      setCopiedIndex(index);
      toast.success(isRTL ? 'تم النسخ!' : 'Copied!');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error(isRTL ? 'فشل النسخ' : 'Failed to copy');
    }
  };

  const getCopyText = () => {
    if (!result) return '';
    return `${t("title")}:\n${result.names.map(n => n.name).join('\n')}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Keywords Input */}
          <div className="space-y-2">
            <Label htmlFor="keywords-input">
              {t("enterKeywords")}
            </Label>
            <Input
              id="keywords-input"
              placeholder={isRTL 
                ? 'أدخل الكلمات المفتاحية (مفصولة بفاصلة)...'
                : 'Enter keywords (comma separated)...'
              }
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'مثال: قهوة، عربي' : 'Example: coffee, arabic'}
            </p>
          </div>

          {/* Category Selector */}
          <div className="space-y-2">
            <Label>{t("selectCategory")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map(({ key, label }) => (
                <Button
                  key={key}
                  variant={category === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCategory(key)}
                  className="gap-2 justify-start"
                >
                  {CATEGORY_ICONS[key]}
                  <span className="truncate">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !keywords.trim()}
            className="w-full gap-2"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {t("generate")}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && result.names.length > 0 && (
        <Card ref={resultCardRef}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("suggestions")}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                {t("regenerate")}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {result.names.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <span className="font-medium" dir={isRTL ? 'rtl' : 'ltr'}>
                      {item.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({item.pattern})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyName(item.name, index)}
                    className="gap-1 shrink-0"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>

            {/* Share Buttons */}
            <ShareButtons
              copyText={getCopyText()}
            />
          </CardContent>
        </Card>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="businessNameGenerator" />
    </div>
  );
}
