"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MessageCircle, Copy, Check, QrCode, ExternalLink } from "lucide-react";
import {
  generateWhatsAppLink,
  COUNTRY_CODES,
  type WhatsAppLinkResult,
} from "@/lib/calculators/whatsapp-link";
import { toast } from "sonner";

export function WhatsAppLinkGenerator() {
  const t = useTranslations("tools.whatsappLinkGenerator");
  const locale = useLocale();
  
  const [countryCode, setCountryCode] = useState<string>("966");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [productName, setProductName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Parse numeric values
  const parsedPrice = useMemo(() => {
    const value = parseFloat(price);
    return isNaN(value) ? undefined : value;
  }, [price]);

  const parsedQuantity = useMemo(() => {
    const value = parseInt(quantity, 10);
    return isNaN(value) ? undefined : value;
  }, [quantity]);

  // Generate WhatsApp link in real-time
  const result: WhatsAppLinkResult = useMemo(() => {
    if (!phoneNumber || !productName) {
      return { link: '', message: '', isValid: false };
    }
    
    return generateWhatsAppLink({
      phoneNumber,
      countryCode,
      productName,
      price: parsedPrice,
      quantity: parsedQuantity,
      customMessage: customMessage || undefined,
      language: locale as 'ar' | 'en',
    });
  }, [phoneNumber, countryCode, productName, parsedPrice, parsedQuantity, customMessage, locale]);

  // Copy to clipboard handler - Requirement 1.4
  const handleCopy = useCallback(async () => {
    if (!result.isValid || !result.link) return;
    
    try {
      await navigator.clipboard.writeText(result.link);
      setCopied(true);
      toast.success(locale === 'ar' ? 'تم نسخ الرابط' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(locale === 'ar' ? 'فشل النسخ' : 'Failed to copy');
    }
  }, [result, locale]);

  // Open WhatsApp link
  const handleOpenLink = useCallback(() => {
    if (!result.isValid || !result.link) return;
    window.open(result.link, '_blank');
  }, [result]);

  const hasValidInputs = phoneNumber.trim() !== '' && productName.trim() !== '';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Country Code and Phone Number */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="countryCode">{t("countryCode")}</Label>
              <select
                id="countryCode"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {COUNTRY_CODES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} +{country.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="phoneNumber">{t("phoneNumber")}</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder={locale === 'ar' ? '5XXXXXXXX' : '5XXXXXXXX'}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-lg"
                dir="ltr"
              />
            </div>
          </div>

          {/* Product Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="productName">{t("productName")} *</Label>
            <Input
              id="productName"
              type="text"
              placeholder={locale === 'ar' ? 'اسم المنتج' : 'Product name'}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">{t("price")}</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">{t("quantity")}</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="customMessage">{t("customMessage")}</Label>
            <textarea
              id="customMessage"
              placeholder={locale === 'ar' ? 'رسالة مخصصة (اختياري)' : 'Custom message (optional)'}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {hasValidInputs && (
        <Card 
          className={result.isValid ? "border-green-500" : "border-destructive"}
          role="region"
          aria-label={locale === "ar" ? "النتيجة" : "Result"}
          aria-live="polite"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.isValid ? (
                <>
                  <QrCode className="h-5 w-5 text-green-500" aria-hidden="true" />
                  <span className="text-green-500">{t("generatedLink")}</span>
                </>
              ) : (
                <span className="text-destructive">{t("error")}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.isValid ? (
              <>
                {/* Generated Link */}
                <div className="space-y-2">
                  <Label>{t("link")}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={result.link}
                      readOnly
                      className="font-mono text-sm"
                      dir="ltr"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      aria-label={locale === 'ar' ? 'نسخ الرابط' : 'Copy link'}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleOpenLink}
                      aria-label={locale === 'ar' ? 'فتح في واتساب' : 'Open in WhatsApp'}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Message Preview */}
                <div className="space-y-2">
                  <Label>{t("messagePreview")}</Label>
                  <div className="p-4 rounded-lg bg-muted whitespace-pre-wrap text-sm">
                    {result.message}
                  </div>
                </div>

                {/* QR Code Placeholder - Requirement 1.5 */}
                <div className="space-y-2">
                  <Label>{t("qrCode")}</Label>
                  <div className="flex justify-center p-4 rounded-lg bg-muted">
                    <div className="text-center text-muted-foreground">
                      <QrCode className="h-32 w-32 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{locale === 'ar' ? 'سيتم إضافة رمز QR قريباً' : 'QR code coming soon'}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-destructive">{result.error}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Message */}
      {!hasValidInputs && (phoneNumber !== '' || productName !== '') && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterRequiredFields")}
        </p>
      )}
    </div>
  );
}
