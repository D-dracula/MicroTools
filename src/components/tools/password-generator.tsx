"use client";

import { useState, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { KeyRound, Copy, Check, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { 
  generatePassword, 
  DEFAULT_PASSWORD_OPTIONS,
  type PasswordOptions, 
  type PasswordResult,
  type PasswordStrength 
} from "@/lib/calculators/password-generator";
import { ShareButtons } from "./shared/share-buttons";
import { SEOContent } from "./shared/seo-content";

const STRENGTH_COLORS: Record<PasswordStrength, string> = {
  'weak': 'bg-red-500',
  'fair': 'bg-orange-500',
  'good': 'bg-yellow-500',
  'strong': 'bg-green-500',
  'very-strong': 'bg-emerald-500',
};

const STRENGTH_LABELS: Record<PasswordStrength, { en: string; ar: string }> = {
  'weak': { en: 'Weak', ar: 'ضعيفة' },
  'fair': { en: 'Fair', ar: 'مقبولة' },
  'good': { en: 'Good', ar: 'جيدة' },
  'strong': { en: 'Strong', ar: 'قوية' },
  'very-strong': { en: 'Very Strong', ar: 'قوية جداً' },
};

export function PasswordGenerator() {
  const t = useTranslations("tools.passwordGenerator");
  const locale = useLocale() as 'ar' | 'en';
  const isRTL = locale === 'ar';
  
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_PASSWORD_OPTIONS);
  const [result, setResult] = useState<PasswordResult | null>(null);
  const [showPassword, setShowPassword] = useState(true);
  const [justCopied, setJustCopied] = useState(false);
  
  const resultCardRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    const generated = generatePassword(options);
    setResult(generated);
    
    if (!generated.isValid && generated.error) {
      toast.error(generated.error);
    }
  };

  const handleCopy = async () => {
    if (!result?.password) return;
    
    try {
      await navigator.clipboard.writeText(result.password);
      setJustCopied(true);
      toast.success(isRTL ? 'تم النسخ!' : 'Copied!');
      setTimeout(() => setJustCopied(false), 2000);
    } catch {
      toast.error(isRTL ? 'فشل النسخ' : 'Failed to copy');
    }
  };

  const handleLengthChange = (value: string) => {
    const length = parseInt(value, 10);
    if (!isNaN(length)) {
      setOptions(prev => ({ ...prev, length: Math.max(8, Math.min(128, length)) }));
    }
  };

  const getCopyText = () => {
    if (!result?.password) return '';
    return result.password;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Options Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Length Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="length-input">{t("length")}</Label>
              <Input
                id="length-input"
                type="number"
                min={8}
                max={128}
                value={options.length}
                onChange={(e) => handleLengthChange(e.target.value)}
                className="w-20 text-center"
              />
            </div>
            <input
              type="range"
              min={8}
              max={128}
              value={options.length}
              onChange={(e) => handleLengthChange(e.target.value)}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>8</span>
              <span>128</span>
            </div>
          </div>

          {/* Character Type Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label htmlFor="uppercase" className="cursor-pointer">
                {t("uppercase")} (A-Z)
              </Label>
              <Switch
                id="uppercase"
                checked={options.includeUppercase}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeUppercase: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label htmlFor="lowercase" className="cursor-pointer">
                {t("lowercase")} (a-z)
              </Label>
              <Switch
                id="lowercase"
                checked={options.includeLowercase}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeLowercase: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label htmlFor="numbers" className="cursor-pointer">
                {t("numbers")} (0-9)
              </Label>
              <Switch
                id="numbers"
                checked={options.includeNumbers}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeNumbers: checked }))}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label htmlFor="symbols" className="cursor-pointer">
                {t("symbols")} (!@#$)
              </Label>
              <Switch
                id="symbols"
                checked={options.includeSymbols}
                onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeSymbols: checked }))}
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button onClick={handleGenerate} className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("generate")}
          </Button>
        </CardContent>
      </Card>

      {/* Result Section */}
      {result && result.isValid && (
        <Card ref={resultCardRef}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("generatedPassword")}</span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1"
                >
                  {justCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Password Display */}
            <div className="p-4 rounded-lg bg-muted/50 font-mono text-lg break-all">
              {showPassword ? result.password : '•'.repeat(result.password.length)}
            </div>

            {/* Strength Indicator */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t("strength")}</Label>
                <span className={`text-sm font-medium ${
                  result.strength === 'weak' ? 'text-red-500' :
                  result.strength === 'fair' ? 'text-orange-500' :
                  result.strength === 'good' ? 'text-yellow-500' :
                  result.strength === 'strong' ? 'text-green-500' :
                  'text-emerald-500'
                }`}>
                  {STRENGTH_LABELS[result.strength][locale]}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${STRENGTH_COLORS[result.strength]}`}
                  style={{ width: `${result.strengthScore}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {result.strengthScore}/100
              </p>
            </div>

            {/* Regenerate Button */}
            <Button onClick={handleGenerate} variant="outline" className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              {t("regenerate")}
            </Button>

            {/* Share Buttons */}
            <ShareButtons
              copyText={getCopyText()}
            />
          </CardContent>
        </Card>
      )}

      {/* SEO Content */}
      <SEOContent toolSlug="passwordGenerator" />
    </div>
  );
}
