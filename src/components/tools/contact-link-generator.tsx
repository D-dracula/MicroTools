"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Phone, Copy, Check, ExternalLink, QrCode } from "lucide-react";
import {
  generateContactLink,
  getSupportedPlatforms,
  getPlatformInfo,
  PLATFORMS,
  type ContactPlatform,
  type ContactLinkResult,
} from "@/lib/calculators/contact-link";
import { generateSimpleQRCode } from "@/lib/calculators/qr-code";
import { toast } from "sonner";

export function ContactLinkGenerator() {
  const t = useTranslations("tools.contactLinkGenerator");
  const locale = useLocale();
  
  const [platform, setPlatform] = useState<ContactPlatform>("whatsapp");
  const [contact, setContact] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");

  // Get platform info
  const platformInfo = useMemo(() => {
    return getPlatformInfo(platform, locale as 'ar' | 'en');
  }, [platform, locale]);

  // Generate contact link in real-time
  const result: ContactLinkResult = useMemo(() => {
    if (!contact.trim()) {
      return { link: '', platform, isValid: false };
    }
    
    return generateContactLink({
      platform,
      contact,
      message: message || undefined,
      subject: subject || undefined,
    });
  }, [platform, contact, message, subject]);

  // Generate QR code when link changes - Requirement 5.5
  useEffect(() => {
    const generateQR = async () => {
      if (result.isValid && result.link) {
        const qr = await generateSimpleQRCode(result.link, 200);
        setQrCode(qr);
      } else {
        setQrCode("");
      }
    };
    generateQR();
  }, [result]);

  // Copy to clipboard handler - Requirement 5.4
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

  // Open link
  const handleOpenLink = useCallback(() => {
    if (!result.isValid || !result.link) return;
    window.open(result.link, '_blank');
  }, [result]);

  // Reset form when platform changes
  const handlePlatformChange = useCallback((newPlatform: ContactPlatform) => {
    setPlatform(newPlatform);
    setContact("");
    setMessage("");
    setSubject("");
  }, []);

  const hasValidInput = contact.trim() !== '';
  const platforms = getSupportedPlatforms();

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Platform Selector - Requirement 5.1 */}
          <div className="space-y-2">
            <Label>{t("platform")}</Label>
            <div className="grid grid-cols-5 gap-2">
              {platforms.map((p) => {
                const info = PLATFORMS[p];
                return (
                  <Button
                    key={p}
                    variant={platform === p ? "default" : "outline"}
                    className="flex flex-col items-center gap-1 h-auto py-3"
                    onClick={() => handlePlatformChange(p)}
                  >
                    <span className="text-lg">{info.icon}</span>
                    <span className="text-xs">
                      {locale === 'ar' ? info.nameAr : info.name}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Contact Input - Requirement 5.2 */}
          <div className="space-y-2">
            <Label htmlFor="contact">{t("contact")} *</Label>
            <Input
              id="contact"
              type={platform === 'email' ? 'email' : 'text'}
              placeholder={platformInfo.displayPlaceholder}
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="text-lg"
              dir="ltr"
            />
          </div>

          {/* Subject (Email only) */}
          {platformInfo.supportsSubject && (
            <div className="space-y-2">
              <Label htmlFor="subject">{t("subject")}</Label>
              <Input
                id="subject"
                type="text"
                placeholder={locale === 'ar' ? 'موضوع الرسالة' : 'Email subject'}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          {/* Message (where supported) */}
          {platformInfo.supportsMessage && (
            <div className="space-y-2">
              <Label htmlFor="message">{t("message")}</Label>
              <textarea
                id="message"
                placeholder={locale === 'ar' ? 'رسالة مسبقة (اختياري)' : 'Pre-filled message (optional)'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {hasValidInput && (
        <Card 
          className={result.isValid ? "border-primary" : "border-destructive"}
          role="region"
          aria-label={locale === "ar" ? "النتيجة" : "Result"}
          aria-live="polite"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.isValid ? (
                <>
                  <span className="text-xl">{PLATFORMS[platform].icon}</span>
                  <span className="text-primary">{t("generatedLink")}</span>
                </>
              ) : (
                <span className="text-destructive">{t("error")}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.isValid ? (
              <>
                {/* Generated Link with Copy Button - Requirement 5.4 */}
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
                      aria-label={locale === 'ar' ? 'فتح الرابط' : 'Open link'}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* QR Code - Requirement 5.5 */}
                {qrCode && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      {t("qrCode")}
                    </Label>
                    <div className="flex justify-center p-4 rounded-lg bg-muted">
                      <img
                        src={qrCode}
                        alt="Contact QR Code"
                        className="w-48 h-48"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-destructive">{result.error}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Message */}
      {!hasValidInput && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterContact")}
        </p>
      )}
    </div>
  );
}
