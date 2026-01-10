"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QrCode, Download, AlertTriangle, Upload, X } from "lucide-react";
import { generateQRCode, type QRCodeResult } from "@/lib/calculators/qr-code";
import { toast } from "sonner";

export function QRCodeGenerator() {
  const t = useTranslations("tools.qrCodeGenerator");
  const locale = useLocale();
  
  const [content, setContent] = useState<string>("");
  const [foregroundColor, setForegroundColor] = useState<string>("#000000");
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [logo, setLogo] = useState<string>("");
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoSize, setLogoSize] = useState<number>(20);
  const [size, setSize] = useState<number>(256);
  const [result, setResult] = useState<QRCodeResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate QR code when inputs change
  useEffect(() => {
    const generateCode = async () => {
      if (!content.trim()) {
        setResult(null);
        return;
      }

      setIsGenerating(true);
      try {
        const qrResult = await generateQRCode({
          content: content.trim(),
          size,
          foregroundColor,
          backgroundColor,
          logo: logo || undefined,
          logoSize,
          errorCorrectionLevel: logo ? 'H' : 'M',
        });
        setResult(qrResult);
      } catch {
        setResult({
          dataUrl: '',
          svgString: '',
          isValid: false,
          error: locale === 'ar' ? 'فشل في إنشاء رمز QR' : 'Failed to generate QR code',
        });
      }
      setIsGenerating(false);
    };

    const debounceTimer = setTimeout(generateCode, 300);
    return () => clearTimeout(debounceTimer);
  }, [content, size, foregroundColor, backgroundColor, logo, logoSize, locale]);

  // Handle logo upload
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(locale === 'ar' ? 'يرجى اختيار ملف صورة' : 'Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(locale === 'ar' ? 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت' : 'Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogo(dataUrl);
      setLogoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }, [locale]);

  // Remove logo
  const handleRemoveLogo = useCallback(() => {
    setLogo("");
    setLogoPreview("");
  }, []);

  // Download PNG - Requirement 3.4
  const handleDownloadPNG = useCallback(() => {
    if (!result?.dataUrl) return;

    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = result.dataUrl;
    link.click();
    toast.success(locale === 'ar' ? 'تم تحميل PNG' : 'PNG downloaded');
  }, [result, locale]);

  // Download SVG - Requirement 3.4
  const handleDownloadSVG = useCallback(() => {
    if (!result?.svgString) return;

    const blob = new Blob([result.svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'qr-code.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(locale === 'ar' ? 'تم تحميل SVG' : 'SVG downloaded');
  }, [result, locale]);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Input - Requirement 3.1 */}
          <div className="space-y-2">
            <Label htmlFor="content">{t("content")} *</Label>
            <Input
              id="content"
              type="text"
              placeholder={locale === 'ar' ? 'أدخل رابط أو نص' : 'Enter URL or text'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="text-lg"
              dir="ltr"
            />
          </div>

          {/* Color Pickers - Requirement 3.3 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="foregroundColor">{t("foregroundColor")}</Label>
              <div className="flex gap-2">
                <Input
                  id="foregroundColor"
                  type="color"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  className="flex-1 font-mono"
                  dir="ltr"
                  placeholder="#000000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backgroundColor">{t("backgroundColor")}</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 font-mono"
                  dir="ltr"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>

          {/* Logo Upload - Requirement 3.2 */}
          <div className="space-y-2">
            <Label>{t("logo")}</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-16 h-16 object-contain border rounded"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleRemoveLogo}
                    aria-label={locale === 'ar' ? 'إزالة الشعار' : 'Remove logo'}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-16 h-16 border-2 border-dashed rounded cursor-pointer hover:border-primary transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              )}
              <div className="flex-1 space-y-2">
                <Label htmlFor="logoSize">{t("logoSize")} ({logoSize}%)</Label>
                <input
                  id="logoSize"
                  type="range"
                  min="10"
                  max="30"
                  value={logoSize}
                  onChange={(e) => setLogoSize(parseInt(e.target.value))}
                  className="w-full"
                  disabled={!logo}
                />
              </div>
            </div>
          </div>

          {/* Size Selection */}
          <div className="space-y-2">
            <Label htmlFor="size">{t("size")}</Label>
            <select
              id="size"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="128">128 x 128</option>
              <option value="256">256 x 256</option>
              <option value="512">512 x 512</option>
              <option value="1024">1024 x 1024</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {content.trim() && (
        <Card 
          className={result?.isValid ? "border-primary" : "border-destructive"}
          role="region"
          aria-label={locale === "ar" ? "النتيجة" : "Result"}
          aria-live="polite"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isGenerating ? (
                <span className="text-muted-foreground">{locale === 'ar' ? 'جاري الإنشاء...' : 'Generating...'}</span>
              ) : result?.isValid ? (
                <>
                  <QrCode className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="text-primary">{t("generatedQR")}</span>
                </>
              ) : (
                <span className="text-destructive">{t("error")}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result?.isValid ? (
              <>
                {/* Logo Warning - Requirement 3.6 */}
                {result.logoWarning && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{result.logoWarning}</p>
                  </div>
                )}

                {/* QR Code Display */}
                <div className="flex justify-center p-4 rounded-lg bg-muted">
                  <img
                    src={result.dataUrl}
                    alt="Generated QR Code"
                    className="max-w-full"
                    style={{ width: Math.min(size, 300), height: Math.min(size, 300) }}
                  />
                </div>

                {/* Download Buttons - Requirement 3.4 */}
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={handleDownloadPNG}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {t("downloadPNG")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadSVG}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {t("downloadSVG")}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-destructive text-center">{result?.error}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Validation Message */}
      {!content.trim() && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {t("enterContent")}
        </p>
      )}
    </div>
  );
}
