"use client";

/**
 * Error Monitor Component
 * 
 * Admin component for monitoring and managing system errors with:
 * - Error metrics cards
 * - Error list with severity indicators
 * - Filter controls (severity, time range, status)
 * - Error detail modal
 * - Acknowledge/resolve actions
 * - System health status display
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Info,
  Search,
  RefreshCw,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
  Eye,
  CheckCheck,
  Zap,
  TrendingUp,
  Users,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// Types
// ============================================================================

type Severity = "critical" | "error" | "warning" | "all";
type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d";
type AlertStatus = "all" | "unresolved" | "resolved" | "unacknowledged";

interface ErrorMetrics {
  totalErrors: number;
  criticalErrors: number;
  highErrors: number;
  mediumErrors: number;
  lowErrors: number;
  errorRate: number;
  resolvedToday: number;
  averageResponseTime: number;
}

interface ErrorListItem {
  id: string;
  severity: "critical" | "error" | "warning" | "low" | "medium" | "high";
  message: string;
  stackTrace?: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: string;
  pattern?: string;
  affectedUsers?: number;
  endpoints?: string[];
}

interface ErrorPattern {
  pattern: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  severity: string;
  affectedUsers: number;
  endpoints: string[];
}

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  activeAlerts: number;
  criticalPatterns: number;
}

interface PaginatedErrors {
  items: ErrorListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ErrorMonitorProps {
  locale: string;
}

// ============================================================================
// Translations
// ============================================================================

function getTranslations(isRTL: boolean) {
  return {
    title: isRTL ? "مراقبة الأخطاء" : "Error Monitor",
    subtitle: isRTL ? "مراقبة وإدارة أخطاء النظام" : "Monitor and manage system errors",
    
    // Actions
    actions: {
      refresh: isRTL ? "تحديث" : "Refresh",
      acknowledge: isRTL ? "تأكيد" : "Acknowledge",
      resolve: isRTL ? "حل" : "Resolve",
      viewDetails: isRTL ? "عرض التفاصيل" : "View Details",
      close: isRTL ? "إغلاق" : "Close",
      acknowledgeAll: isRTL ? "تأكيد الكل" : "Acknowledge All",
      resolveAll: isRTL ? "حل الكل" : "Resolve All",
    },
    
    // Filters
    filters: {
      severity: isRTL ? "الخطورة" : "Severity",
      timeRange: isRTL ? "الفترة الزمنية" : "Time Range",
      status: isRTL ? "الحالة" : "Status",
      search: isRTL ? "بحث في الأخطاء..." : "Search errors...",
      all: isRTL ? "الكل" : "All",
      critical: isRTL ? "حرج" : "Critical",
      error: isRTL ? "خطأ" : "Error",
      warning: isRTL ? "تحذير" : "Warning",
      unresolved: isRTL ? "غير محلول" : "Unresolved",
      resolved: isRTL ? "محلول" : "Resolved",
      unacknowledged: isRTL ? "غير مؤكد" : "Unacknowledged",
    },
    
    // Time ranges
    timeRanges: {
      "1h": isRTL ? "ساعة واحدة" : "1 Hour",
      "6h": isRTL ? "6 ساعات" : "6 Hours",
      "24h": isRTL ? "24 ساعة" : "24 Hours",
      "7d": isRTL ? "7 أيام" : "7 Days",
      "30d": isRTL ? "30 يوم" : "30 Days",
    },
    
    // Metrics
    metrics: {
      totalErrors: isRTL ? "إجمالي الأخطاء" : "Total Errors",
      criticalErrors: isRTL ? "أخطاء حرجة" : "Critical Errors",
      errorRate: isRTL ? "معدل الأخطاء" : "Error Rate",
      resolvedToday: isRTL ? "تم حلها اليوم" : "Resolved Today",
      perMinute: isRTL ? "/دقيقة" : "/min",
    },
    
    // Health Status
    health: {
      title: isRTL ? "حالة النظام" : "System Health",
      healthy: isRTL ? "سليم" : "Healthy",
      degraded: isRTL ? "متدهور" : "Degraded",
      unhealthy: isRTL ? "غير سليم" : "Unhealthy",
      activeAlerts: isRTL ? "تنبيهات نشطة" : "Active Alerts",
      criticalPatterns: isRTL ? "أنماط حرجة" : "Critical Patterns",
    },
    
    // Table
    table: {
      error: isRTL ? "الخطأ" : "Error",
      severity: isRTL ? "الخطورة" : "Severity",
      timestamp: isRTL ? "الوقت" : "Time",
      status: isRTL ? "الحالة" : "Status",
      actions: isRTL ? "الإجراءات" : "Actions",
      affectedUsers: isRTL ? "المستخدمون المتأثرون" : "Affected Users",
      endpoints: isRTL ? "نقاط النهاية" : "Endpoints",
    },
    
    // States
    states: {
      loading: isRTL ? "جاري التحميل..." : "Loading...",
      error: isRTL ? "حدث خطأ" : "An error occurred",
      noErrors: isRTL ? "لا توجد أخطاء" : "No errors found",
      retry: isRTL ? "إعادة المحاولة" : "Retry",
      processing: isRTL ? "جاري المعالجة..." : "Processing...",
    },
    
    // Modal
    modal: {
      errorDetails: isRTL ? "تفاصيل الخطأ" : "Error Details",
      errorId: isRTL ? "معرف الخطأ" : "Error ID",
      pattern: isRTL ? "النمط" : "Pattern",
      stackTrace: isRTL ? "تتبع المكدس" : "Stack Trace",
      firstSeen: isRTL ? "أول ظهور" : "First Seen",
      lastSeen: isRTL ? "آخر ظهور" : "Last Seen",
      occurrences: isRTL ? "عدد المرات" : "Occurrences",
    },
    
    // Pagination
    page: isRTL ? "صفحة" : "Page",
    of: isRTL ? "من" : "of",
    previous: isRTL ? "السابق" : "Previous",
    next: isRTL ? "التالي" : "Next",
    
    // Messages
    messages: {
      acknowledged: isRTL ? "تم تأكيد الخطأ بنجاح" : "Error acknowledged successfully",
      resolved: isRTL ? "تم حل الخطأ بنجاح" : "Error resolved successfully",
      failed: isRTL ? "فشلت العملية" : "Operation failed",
    },
    
    // Recommendations
    recommendations: {
      title: isRTL ? "التوصيات" : "Recommendations",
    },
  };
}

// ============================================================================
// Helper Components
// ============================================================================

function SeverityBadge({ severity, isRTL }: { severity: string; isRTL: boolean }) {
  const config: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
    critical: {
      icon: <AlertOctagon className="h-3 w-3" />,
      className: "bg-red-500/10 text-red-600 border-red-500/20",
      label: isRTL ? "حرج" : "Critical",
    },
    high: {
      icon: <AlertTriangle className="h-3 w-3" />,
      className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      label: isRTL ? "عالي" : "High",
    },
    error: {
      icon: <AlertTriangle className="h-3 w-3" />,
      className: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      label: isRTL ? "خطأ" : "Error",
    },
    medium: {
      icon: <AlertCircle className="h-3 w-3" />,
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      label: isRTL ? "متوسط" : "Medium",
    },
    warning: {
      icon: <AlertCircle className="h-3 w-3" />,
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      label: isRTL ? "تحذير" : "Warning",
    },
    low: {
      icon: <Info className="h-3 w-3" />,
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      label: isRTL ? "منخفض" : "Low",
    },
  };

  const { icon, className, label } = config[severity] || config.low;

  return (
    <Badge variant="outline" className={`${className} gap-1`}>
      {icon}
      {label}
    </Badge>
  );
}

function StatusBadge({ acknowledged, resolved, isRTL }: { acknowledged: boolean; resolved: boolean; isRTL: boolean }) {
  if (resolved) {
    return (
      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
        <CheckCircle className="h-3 w-3" />
        {isRTL ? "محلول" : "Resolved"}
      </Badge>
    );
  }
  if (acknowledged) {
    return (
      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 gap-1">
        <Eye className="h-3 w-3" />
        {isRTL ? "مؤكد" : "Acknowledged"}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20 gap-1">
      <Clock className="h-3 w-3" />
      {isRTL ? "جديد" : "New"}
    </Badge>
  );
}

function HealthStatusIndicator({ status, isRTL }: { status: "healthy" | "degraded" | "unhealthy"; isRTL: boolean }) {
  const config = {
    healthy: {
      icon: <ShieldCheck className="h-5 w-5" />,
      className: "text-green-600 bg-green-500/10",
      label: isRTL ? "سليم" : "Healthy",
    },
    degraded: {
      icon: <ShieldAlert className="h-5 w-5" />,
      className: "text-amber-600 bg-amber-500/10",
      label: isRTL ? "متدهور" : "Degraded",
    },
    unhealthy: {
      icon: <Shield className="h-5 w-5" />,
      className: "text-red-600 bg-red-500/10",
      label: isRTL ? "غير سليم" : "Unhealthy",
    },
  };

  const { icon, className, label } = config[status];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${className}`}>
      {icon}
      <span className="font-medium">{label}</span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ErrorMonitor({ locale }: ErrorMonitorProps) {
  const isRTL = locale === "ar";
  const t = getTranslations(isRTL);

  // State
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null);
  const [errors, setErrors] = useState<ErrorListItem[]>([]);
  const [patterns, setPatterns] = useState<ErrorPattern[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Filters
  const [severity, setSeverity] = useState<Severity>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [status, setStatus] = useState<AlertStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Modal
  const [selectedError, setSelectedError] = useState<ErrorListItem | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<ErrorPattern | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch errors
  const fetchErrors = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        timeRange,
        severity,
        status,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const response = await fetch(`/api/admin/errors?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch errors");
      }

      setMetrics(result.data.metrics);
      setErrors(result.data.errors.items);
      setTotal(result.data.errors.total);
      setTotalPages(result.data.errors.totalPages);
      setPatterns(result.data.patterns);
      setHealthStatus(result.data.healthStatus);
      setRecommendations(result.data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, severity, status, page, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchErrors();
  }, [fetchErrors]);

  // Handle acknowledge
  const handleAcknowledge = async (errorItem: ErrorListItem) => {
    if (errorItem.acknowledged) return;

    setIsProcessing(errorItem.id);

    try {
      const response = await fetch("/api/admin/errors?action=acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: errorItem.id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || t.messages.failed);
      }

      // Update local state
      setErrors((prev) =>
        prev.map((e) =>
          e.id === errorItem.id ? { ...e, acknowledged: true } : e
        )
      );

      if (selectedError?.id === errorItem.id) {
        setSelectedError({ ...selectedError, acknowledged: true });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : t.messages.failed);
    } finally {
      setIsProcessing(null);
    }
  };

  // Handle resolve
  const handleResolve = async (errorItem: ErrorListItem) => {
    if (errorItem.resolved) return;

    setIsProcessing(errorItem.id);

    try {
      const response = await fetch("/api/admin/errors?action=resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: errorItem.id }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || t.messages.failed);
      }

      // Update local state
      setErrors((prev) =>
        prev.map((e) =>
          e.id === errorItem.id
            ? { ...e, resolved: true, resolvedAt: new Date().toISOString() }
            : e
        )
      );

      if (selectedError?.id === errorItem.id) {
        setSelectedError({
          ...selectedError,
          resolved: true,
          resolvedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : t.messages.failed);
    } finally {
      setIsProcessing(null);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isRTL ? "الآن" : "Just now";
    if (diffMins < 60) return isRTL ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7) return isRTL ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            {t.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {healthStatus && (
            <HealthStatusIndicator status={healthStatus.status} isRTL={isRTL} />
          )}
          <Button variant="outline" size="sm" onClick={fetchErrors}>
            <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t.actions.refresh}
          </Button>
        </div>
      </div>

      {/* Metrics Cards - Requirement 5.1 */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">{metrics.totalErrors}</p>
              <p className="text-xs text-muted-foreground">{t.metrics.totalErrors}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-red-500/10">
                  <AlertOctagon className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600">{metrics.criticalErrors}</p>
              <p className="text-xs text-muted-foreground">{t.metrics.criticalErrors}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600">
                {metrics.errorRate}
                <span className="text-sm font-normal text-muted-foreground">{t.metrics.perMinute}</span>
              </p>
              <p className="text-xs text-muted-foreground">{t.metrics.errorRate}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">{metrics.resolvedToday}</p>
              <p className="text-xs text-muted-foreground">{t.metrics.resolvedToday}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Health Status Card - Requirement 5.7 */}
      {healthStatus && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t.health.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <HealthStatusIndicator status={healthStatus.status} isRTL={isRTL} />
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">{t.health.activeAlerts}:</span>
                <span className="font-medium">{healthStatus.activeAlerts}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertOctagon className="h-4 w-4 text-red-500" />
                <span className="text-muted-foreground">{t.health.criticalPatterns}:</span>
                <span className="font-medium">{healthStatus.criticalPatterns}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters - Requirement 5.4 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
              <Input
                placeholder={t.filters.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={isRTL ? "pr-10" : "pl-10"}
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value as Severity);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">{t.filters.all}</option>
                <option value="critical">{t.filters.critical}</option>
                <option value="error">{t.filters.error}</option>
                <option value="warning">{t.filters.warning}</option>
              </select>
            </div>

            {/* Time Range Filter */}
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value as TimeRange);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="1h">{t.timeRanges["1h"]}</option>
              <option value="6h">{t.timeRanges["6h"]}</option>
              <option value="24h">{t.timeRanges["24h"]}</option>
              <option value="7d">{t.timeRanges["7d"]}</option>
              <option value="30d">{t.timeRanges["30d"]}</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as AlertStatus);
                setPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">{t.filters.all}</option>
              <option value="unresolved">{t.filters.unresolved}</option>
              <option value="resolved">{t.filters.resolved}</option>
              <option value="unacknowledged">{t.filters.unacknowledged}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Error List - Requirement 5.2 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t.table.error}</CardTitle>
            <span className="text-sm text-muted-foreground">
              {total} {isRTL ? "خطأ" : "errors"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className={`text-muted-foreground ${isRTL ? "mr-2" : "ml-2"}`}>{t.states.loading}</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive mb-4">{t.states.error}</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchErrors} variant="outline">
                <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {t.states.retry}
              </Button>
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500/50 mx-auto mb-4" />
              <p className="text-muted-foreground">{t.states.noErrors}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {errors.map((errorItem) => (
                <div
                  key={errorItem.id}
                  className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedError(errorItem)}
                >
                  {/* Severity Icon */}
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    errorItem.severity === "critical" ? "bg-red-500/10" :
                    errorItem.severity === "high" || errorItem.severity === "error" ? "bg-orange-500/10" :
                    errorItem.severity === "medium" || errorItem.severity === "warning" ? "bg-amber-500/10" :
                    "bg-blue-500/10"
                  }`}>
                    {errorItem.severity === "critical" ? (
                      <AlertOctagon className="h-5 w-5 text-red-500" />
                    ) : errorItem.severity === "high" || errorItem.severity === "error" ? (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    ) : errorItem.severity === "medium" || errorItem.severity === "warning" ? (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Info className="h-5 w-5 text-blue-500" />
                    )}
                  </div>

                  {/* Error Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SeverityBadge severity={errorItem.severity} isRTL={isRTL} />
                      <StatusBadge
                        acknowledged={errorItem.acknowledged}
                        resolved={errorItem.resolved}
                        isRTL={isRTL}
                      />
                    </div>
                    <p className="font-medium mt-2 line-clamp-2">{errorItem.message}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(errorItem.timestamp)}
                      </span>
                      {errorItem.affectedUsers !== undefined && errorItem.affectedUsers > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {errorItem.affectedUsers} {isRTL ? "مستخدم" : "users"}
                        </span>
                      )}
                      {errorItem.endpoints && errorItem.endpoints.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {errorItem.endpoints.length} {isRTL ? "نقطة" : "endpoints"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions - Requirements 5.5, 5.6 */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!errorItem.acknowledged && !errorItem.resolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledge(errorItem);
                        }}
                        disabled={isProcessing === errorItem.id}
                      >
                        {isProcessing === errorItem.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Eye className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                            {t.actions.acknowledge}
                          </>
                        )}
                      </Button>
                    )}
                    {!errorItem.resolved && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolve(errorItem);
                        }}
                        disabled={isProcessing === errorItem.id}
                      >
                        {isProcessing === errorItem.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCheck className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                            {t.actions.resolve}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {t.page} {page} {t.of} {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t.previous}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t.next}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              {t.recommendations.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Error Detail Modal - Requirement 5.3 */}
      {selectedError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedError(null)}
          />

          {/* Modal */}
          <Card className="relative z-10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t.modal.errorDetails}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedError(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Severity and Status */}
              <div className="flex items-center gap-2">
                <SeverityBadge severity={selectedError.severity} isRTL={isRTL} />
                <StatusBadge
                  acknowledged={selectedError.acknowledged}
                  resolved={selectedError.resolved}
                  isRTL={isRTL}
                />
              </div>

              {/* Message */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t.table.error}</p>
                <p className="font-medium">{selectedError.message}</p>
              </div>

              {/* Details */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t.modal.errorId}</span>
                  <span className="text-sm font-mono truncate max-w-[200px]">{selectedError.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t.table.timestamp}</span>
                  <span className="text-sm">{formatDate(selectedError.timestamp)}</span>
                </div>
                {selectedError.pattern && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t.modal.pattern}</span>
                    <span className="text-sm truncate max-w-[200px]">{selectedError.pattern}</span>
                  </div>
                )}
                {selectedError.affectedUsers !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{t.table.affectedUsers}</span>
                    <span className="text-sm">{selectedError.affectedUsers}</span>
                  </div>
                )}
                {selectedError.resolvedAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{isRTL ? "تم الحل في" : "Resolved At"}</span>
                    <span className="text-sm">{formatDate(selectedError.resolvedAt)}</span>
                  </div>
                )}
              </div>

              {/* Endpoints */}
              {selectedError.endpoints && selectedError.endpoints.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">{t.table.endpoints}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedError.endpoints.map((endpoint, index) => (
                      <Badge key={index} variant="secondary" className="font-mono text-xs">
                        {endpoint}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Stack Trace */}
              {selectedError.stackTrace && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">{t.modal.stackTrace}</p>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-40">
                    {selectedError.stackTrace}
                  </pre>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {!selectedError.acknowledged && !selectedError.resolved && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleAcknowledge(selectedError)}
                    disabled={isProcessing === selectedError.id}
                  >
                    {isProcessing === selectedError.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    {t.actions.acknowledge}
                  </Button>
                )}
                {!selectedError.resolved && (
                  <Button
                    className="flex-1"
                    onClick={() => handleResolve(selectedError)}
                    disabled={isProcessing === selectedError.id}
                  >
                    {isProcessing === selectedError.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCheck className="h-4 w-4 mr-2" />
                    )}
                    {t.actions.resolve}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedError(null)}
                >
                  {t.actions.close}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ErrorMonitor;
