"use client";

/**
 * API Keys Manager Component
 * 
 * Admin component for managing API keys with:
 * - Display list of API keys grouped by category
 * - Show masked values with reveal toggle
 * - Test button for testable keys
 * - Validation status and warnings for missing/invalid keys
 * 
 * Requirements: 10.1, 10.2, 10.4, 10.5, 10.6, 10.7
 */

import { useState, useEffect, useCallback } from "react";
import {
  Key,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Shield,
  Database,
  Bot,
  Settings,
  Info,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// Types
// ============================================================================

interface ApiKeyConfig {
  id: string;
  name: string;
  description: string;
  category: "ai" | "database" | "auth" | "other";
  envVar: string;
  isSet: boolean;
  maskedValue: string | null;
  isValid: boolean | null;
  lastUpdated: string | null;
  testable: boolean;
  required: boolean;
}

interface KeysSummary {
  total: number;
  configured: number;
  missing: number;
  invalid: number;
}

interface KeysData {
  keys: ApiKeyConfig[];
  summary: KeysSummary;
}

interface KeysManagerProps {
  locale: string;
}

// ============================================================================
// Translations
// ============================================================================

function getTranslations(isRTL: boolean) {
  return {
    title: isRTL ? "إدارة مفاتيح API" : "API Keys Manager",
    subtitle: isRTL ? "إدارة مفاتيح API ومتغيرات البيئة" : "Manage API keys and environment variables",
    
    // Actions
    actions: {
      refresh: isRTL ? "تحديث" : "Refresh",
      refreshing: isRTL ? "جاري التحديث..." : "Refreshing...",
      test: isRTL ? "اختبار" : "Test",
      testing: isRTL ? "جاري الاختبار..." : "Testing...",
      reveal: isRTL ? "إظهار" : "Reveal",
      hide: isRTL ? "إخفاء" : "Hide",
    },
    
    // Categories
    categories: {
      ai: isRTL ? "خدمات الذكاء الاصطناعي" : "AI Services",
      database: isRTL ? "قاعدة البيانات" : "Database",
      auth: isRTL ? "المصادقة" : "Authentication",
      other: isRTL ? "أخرى" : "Other",
    },
    
    // Status
    status: {
      configured: isRTL ? "مُهيأ" : "Configured",
      notSet: isRTL ? "غير مُعيّن" : "Not Set",
      valid: isRTL ? "صالح" : "Valid",
      invalid: isRTL ? "غير صالح" : "Invalid",
      required: isRTL ? "مطلوب" : "Required",
      optional: isRTL ? "اختياري" : "Optional",
      testable: isRTL ? "قابل للاختبار" : "Testable",
    },
    
    // Summary
    summary: {
      total: isRTL ? "إجمالي المفاتيح" : "Total Keys",
      configured: isRTL ? "مُهيأة" : "Configured",
      missing: isRTL ? "مفقودة" : "Missing",
      invalid: isRTL ? "غير صالحة" : "Invalid",
    },
    
    // Fields
    fields: {
      envVar: isRTL ? "متغير البيئة" : "Environment Variable",
      value: isRTL ? "القيمة" : "Value",
      lastUpdated: isRTL ? "آخر تحديث" : "Last Updated",
      never: isRTL ? "أبداً" : "Never",
    },
    
    // Messages
    messages: {
      testSuccess: isRTL ? "المفتاح صالح" : "Key is valid",
      testFailed: isRTL ? "فشل التحقق من المفتاح" : "Key validation failed",
      notConfigured: isRTL ? "المفتاح غير مُهيأ" : "Key is not configured",
    },
    
    // States
    states: {
      loading: isRTL ? "جاري التحميل..." : "Loading...",
      error: isRTL ? "حدث خطأ" : "An error occurred",
      retry: isRTL ? "إعادة المحاولة" : "Retry",
      noKeys: isRTL ? "لا توجد مفاتيح" : "No keys found",
    },
    
    // Warnings
    warnings: {
      missingRequired: isRTL 
        ? "بعض المفاتيح المطلوبة غير مُهيأة. قد لا تعمل بعض الميزات بشكل صحيح."
        : "Some required keys are not configured. Some features may not work properly.",
      securityNote: isRTL
        ? "ملاحظة: لا يمكن تعديل المفاتيح من هذه الواجهة. يرجى تحديث متغيرات البيئة مباشرة."
        : "Note: Keys cannot be modified from this interface. Please update environment variables directly.",
    },
    
    // Info
    info: {
      howToUpdate: isRTL
        ? "لتحديث المفاتيح، قم بتعديل ملف .env أو متغيرات البيئة في Vercel"
        : "To update keys, modify your .env file or Vercel environment variables",
    },
  };
}

// ============================================================================
// Helper Components
// ============================================================================

function CategoryIcon({ category }: { category: string }) {
  switch (category) {
    case "ai":
      return <Bot className="h-4 w-4" />;
    case "database":
      return <Database className="h-4 w-4" />;
    case "auth":
      return <Shield className="h-4 w-4" />;
    default:
      return <Settings className="h-4 w-4" />;
  }
}

function StatusBadge({ 
  isSet, 
  isValid, 
  required,
  isRTL 
}: { 
  isSet: boolean; 
  isValid: boolean | null;
  required: boolean;
  isRTL: boolean;
}) {
  const t = getTranslations(isRTL);
  
  if (!isSet) {
    return (
      <Badge 
        variant="outline" 
        className={`gap-1 ${required ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}`}
      >
        <AlertTriangle className="h-3 w-3" />
        {t.status.notSet}
      </Badge>
    );
  }
  
  if (isValid === true) {
    return (
      <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
        <CheckCircle className="h-3 w-3" />
        {t.status.valid}
      </Badge>
    );
  }
  
  if (isValid === false) {
    return (
      <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-600 border-red-500/20">
        <XCircle className="h-3 w-3" />
        {t.status.invalid}
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
      <CheckCircle className="h-3 w-3" />
      {t.status.configured}
    </Badge>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KeyCard({
  keyConfig,
  isRTL,
  onTest,
  testingKeyId,
  testResults,
}: {
  keyConfig: ApiKeyConfig;
  isRTL: boolean;
  onTest: (keyId: string) => void;
  testingKeyId: string | null;
  testResults: Record<string, { isValid: boolean; message: string }>;
}) {
  const t = getTranslations(isRTL);
  const [revealed, setRevealed] = useState(false);
  const isTesting = testingKeyId === keyConfig.id;
  const testResult = testResults[keyConfig.id];

  return (
    <Card className={`${!keyConfig.isSet && keyConfig.required ? "border-red-500/30" : ""}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`p-1.5 rounded-md ${
                keyConfig.category === "ai" ? "bg-purple-500/10 text-purple-500" :
                keyConfig.category === "database" ? "bg-blue-500/10 text-blue-500" :
                keyConfig.category === "auth" ? "bg-amber-500/10 text-amber-500" :
                "bg-gray-500/10 text-gray-500"
              }`}>
                <CategoryIcon category={keyConfig.category} />
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-sm truncate">{keyConfig.name}</h4>
                <p className="text-xs text-muted-foreground truncate">{keyConfig.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <StatusBadge 
                isSet={keyConfig.isSet} 
                isValid={testResult?.isValid ?? keyConfig.isValid}
                required={keyConfig.required}
                isRTL={isRTL}
              />
            </div>
          </div>

          {/* Environment Variable */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{t.fields.envVar}:</span>
            <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">
              {keyConfig.envVar}
            </code>
            {keyConfig.required ? (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {t.status.required}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {t.status.optional}
              </Badge>
            )}
          </div>

          {/* Value Display */}
          {keyConfig.isSet && keyConfig.maskedValue && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t.fields.value}:</span>
              <code className="px-2 py-1 rounded bg-muted font-mono text-xs flex-1 truncate">
                {revealed ? keyConfig.maskedValue : "••••••••••••••••"}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setRevealed(!revealed)}
              >
                {revealed ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${
              testResult.isValid 
                ? "bg-green-500/10 text-green-600" 
                : "bg-red-500/10 text-red-600"
            }`}>
              {testResult.isValid ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Actions */}
          {keyConfig.testable && keyConfig.isSet && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTest(keyConfig.id)}
                disabled={isTesting}
                className="h-7 text-xs"
              >
                {isTesting ? (
                  <>
                    <Loader2 className={`h-3 w-3 animate-spin ${isRTL ? "ml-1" : "mr-1"}`} />
                    {t.actions.testing}
                  </>
                ) : (
                  <>
                    <CheckCircle className={`h-3 w-3 ${isRTL ? "ml-1" : "mr-1"}`} />
                    {t.actions.test}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function KeysManager({ locale }: KeysManagerProps) {
  const isRTL = locale === "ar";
  const t = getTranslations(isRTL);

  // State
  const [keysData, setKeysData] = useState<KeysData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { isValid: boolean; message: string }>>({});

  // Fetch keys data
  const fetchKeysData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch("/api/admin/keys");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch keys data");
      }

      setKeysData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchKeysData();
  }, [fetchKeysData]);

  // Test a key
  const handleTestKey = async (keyId: string) => {
    setTestingKeyId(keyId);

    try {
      const response = await fetch("/api/admin/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyId,
          action: "test",
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.result) {
        setTestResults((prev) => ({
          ...prev,
          [keyId]: result.data.result,
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [keyId]: {
            isValid: false,
            message: result.error || "Test failed",
          },
        }));
      }
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [keyId]: {
          isValid: false,
          message: err instanceof Error ? err.message : "Test failed",
        },
      }));
    } finally {
      setTestingKeyId(null);
    }
  };

  // Group keys by category
  const groupedKeys = keysData?.keys.reduce((acc, key) => {
    if (!acc[key.category]) {
      acc[key.category] = [];
    }
    acc[key.category].push(key);
    return acc;
  }, {} as Record<string, ApiKeyConfig[]>) || {};

  const categoryOrder: Array<"ai" | "database" | "auth" | "other"> = ["ai", "database", "auth", "other"];

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            {t.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchKeysData(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"} ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? t.actions.refreshing : t.actions.refresh}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className={`text-muted-foreground ${isRTL ? "mr-2" : "ml-2"}`}>{t.states.loading}</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">{t.states.error}</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchKeysData()} variant="outline">
            <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t.states.retry}
          </Button>
        </div>
      )}

      {/* Keys Data */}
      {keysData && !isLoading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              title={t.summary.total}
              value={keysData.summary.total}
              icon={Key}
              color="text-primary"
              bgColor="bg-primary/10"
            />
            <SummaryCard
              title={t.summary.configured}
              value={keysData.summary.configured}
              icon={CheckCircle}
              color="text-green-500"
              bgColor="bg-green-500/10"
            />
            <SummaryCard
              title={t.summary.missing}
              value={keysData.summary.missing}
              icon={AlertTriangle}
              color="text-red-500"
              bgColor="bg-red-500/10"
            />
            <SummaryCard
              title={t.summary.invalid}
              value={Object.values(testResults).filter((r) => !r.isValid).length}
              icon={XCircle}
              color="text-amber-500"
              bgColor="bg-amber-500/10"
            />
          </div>

          {/* Warning for missing required keys */}
          {keysData.summary.missing > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-600">{t.warnings.missingRequired}</p>
              </div>
            </div>
          )}

          {/* Info Note */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-600">{t.warnings.securityNote}</p>
              <p className="text-xs text-blue-500/80 mt-1">{t.info.howToUpdate}</p>
            </div>
          </div>

          {/* Keys by Category */}
          {categoryOrder.map((category) => {
            const keys = groupedKeys[category];
            if (!keys || keys.length === 0) return null;

            return (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${
                    category === "ai" ? "bg-purple-500/10 text-purple-500" :
                    category === "database" ? "bg-blue-500/10 text-blue-500" :
                    category === "auth" ? "bg-amber-500/10 text-amber-500" :
                    "bg-gray-500/10 text-gray-500"
                  }`}>
                    <CategoryIcon category={category} />
                  </div>
                  {t.categories[category]}
                  <Badge variant="secondary" className="ml-2">
                    {keys.length}
                  </Badge>
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {keys.map((keyConfig) => (
                    <KeyCard
                      key={keyConfig.id}
                      keyConfig={keyConfig}
                      isRTL={isRTL}
                      onTest={handleTestKey}
                      testingKeyId={testingKeyId}
                      testResults={testResults}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
