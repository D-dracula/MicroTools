"use client";

/**
 * System Health Component
 * 
 * Admin component for monitoring system health with:
 * - Service status cards with visual indicators
 * - API response times
 * - Resource usage display
 * - Alerts for failed health checks
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Database,
  Server,
  Shield,
  HardDrive,
  Cpu,
  MemoryStick,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  Globe,
  Lock,
  Cloud,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// Types
// ============================================================================

interface ServiceStatus {
  status: "healthy" | "degraded" | "down";
  responseTimeMs: number;
  lastChecked: string;
  message?: string;
}

interface ResourceUsage {
  used: number;
  total: number;
  percentage: number;
}

interface HealthCheckResult {
  database: ServiceStatus;
  supabase: ServiceStatus;
  api: ServiceStatus;
  auth: ServiceStatus;
  storage: ServiceStatus;
  cache: ServiceStatus;
}

interface SystemMetrics {
  uptime: number;
  memory?: ResourceUsage;
  cpu?: ResourceUsage;
  errorRate: number;
  averageResponseTime: number;
  totalErrors: number;
  activeAlerts: number;
}

interface HealthAlert {
  type: "error" | "warning" | "info";
  message: string;
  service?: string;
}

interface HealthData {
  overallStatus: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  environment: {
    current: string;
    configured: boolean;
    isolated: boolean;
    missingVariables: string[];
  };
  services: HealthCheckResult;
  metrics: SystemMetrics;
  alerts: HealthAlert[];
}

interface SystemHealthProps {
  locale: string;
}

// ============================================================================
// Translations
// ============================================================================

function getTranslations(isRTL: boolean) {
  return {
    title: isRTL ? "صحة النظام" : "System Health",
    subtitle: isRTL ? "مراقبة حالة الخدمات والموارد" : "Monitor services and resources status",
    
    // Actions
    actions: {
      refresh: isRTL ? "تحديث" : "Refresh",
      refreshing: isRTL ? "جاري التحديث..." : "Refreshing...",
    },
    
    // Status
    status: {
      healthy: isRTL ? "سليم" : "Healthy",
      degraded: isRTL ? "متدهور" : "Degraded",
      unhealthy: isRTL ? "غير سليم" : "Unhealthy",
      down: isRTL ? "متوقف" : "Down",
    },
    
    // Services
    services: {
      title: isRTL ? "حالة الخدمات" : "Service Status",
      database: isRTL ? "قاعدة البيانات" : "Database",
      supabase: isRTL ? "Supabase" : "Supabase",
      api: isRTL ? "واجهة API" : "API",
      auth: isRTL ? "المصادقة" : "Authentication",
      storage: isRTL ? "التخزين" : "Storage",
      cache: isRTL ? "الذاكرة المؤقتة" : "Cache",
      responseTime: isRTL ? "وقت الاستجابة" : "Response Time",
      lastChecked: isRTL ? "آخر فحص" : "Last Checked",
    },
    
    // Metrics
    metrics: {
      title: isRTL ? "مقاييس النظام" : "System Metrics",
      uptime: isRTL ? "وقت التشغيل" : "Uptime",
      memory: isRTL ? "الذاكرة" : "Memory",
      cpu: isRTL ? "المعالج" : "CPU",
      errorRate: isRTL ? "معدل الأخطاء" : "Error Rate",
      avgResponseTime: isRTL ? "متوسط وقت الاستجابة" : "Avg Response Time",
      totalErrors: isRTL ? "إجمالي الأخطاء" : "Total Errors",
      activeAlerts: isRTL ? "التنبيهات النشطة" : "Active Alerts",
      perMinute: isRTL ? "/دقيقة" : "/min",
    },
    
    // Environment
    environment: {
      title: isRTL ? "البيئة" : "Environment",
      current: isRTL ? "البيئة الحالية" : "Current Environment",
      configured: isRTL ? "مُهيأ" : "Configured",
      notConfigured: isRTL ? "غير مُهيأ" : "Not Configured",
      isolated: isRTL ? "معزول" : "Isolated",
      notIsolated: isRTL ? "غير معزول" : "Not Isolated",
      missingVars: isRTL ? "متغيرات مفقودة" : "Missing Variables",
      version: isRTL ? "الإصدار" : "Version",
    },
    
    // Alerts
    alerts: {
      title: isRTL ? "التنبيهات" : "Alerts",
      noAlerts: isRTL ? "لا توجد تنبيهات" : "No alerts",
      error: isRTL ? "خطأ" : "Error",
      warning: isRTL ? "تحذير" : "Warning",
      info: isRTL ? "معلومات" : "Info",
    },
    
    // States
    states: {
      loading: isRTL ? "جاري التحميل..." : "Loading...",
      error: isRTL ? "حدث خطأ" : "An error occurred",
      retry: isRTL ? "إعادة المحاولة" : "Retry",
    },
    
    // Time
    time: {
      days: isRTL ? "يوم" : "days",
      hours: isRTL ? "ساعة" : "hours",
      minutes: isRTL ? "دقيقة" : "minutes",
      seconds: isRTL ? "ثانية" : "seconds",
      ms: isRTL ? "مللي ثانية" : "ms",
      justNow: isRTL ? "الآن" : "Just now",
      ago: isRTL ? "منذ" : "ago",
    },
  };
}

// ============================================================================
// Helper Components
// ============================================================================

function StatusIndicator({ status, isRTL }: { status: "healthy" | "degraded" | "down" | "unhealthy"; isRTL: boolean }) {
  const t = getTranslations(isRTL);
  
  const config = {
    healthy: {
      icon: <CheckCircle className="h-4 w-4" />,
      className: "bg-green-500/10 text-green-600 border-green-500/20",
      label: t.status.healthy,
    },
    degraded: {
      icon: <AlertTriangle className="h-4 w-4" />,
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      label: t.status.degraded,
    },
    unhealthy: {
      icon: <XCircle className="h-4 w-4" />,
      className: "bg-red-500/10 text-red-600 border-red-500/20",
      label: t.status.unhealthy,
    },
    down: {
      icon: <XCircle className="h-4 w-4" />,
      className: "bg-red-500/10 text-red-600 border-red-500/20",
      label: t.status.down,
    },
  };

  const { icon, className, label } = config[status];

  return (
    <Badge variant="outline" className={`${className} gap-1`}>
      {icon}
      {label}
    </Badge>
  );
}

function ServiceCard({
  name,
  icon: Icon,
  status,
  isRTL,
  color,
}: {
  name: string;
  icon: React.ElementType;
  status: ServiceStatus;
  isRTL: boolean;
  color: string;
}) {
  const t = getTranslations(isRTL);

  const statusColors = {
    healthy: "border-green-500/30",
    degraded: "border-amber-500/30",
    down: "border-red-500/30",
  };

  return (
    <Card className={`${statusColors[status.status]} border-2`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-medium">{name}</span>
          </div>
          <StatusIndicator status={status.status} isRTL={isRTL} />
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t.services.responseTime}
            </span>
            <span className={`font-mono ${status.responseTimeMs > 500 ? "text-amber-600" : "text-foreground"}`}>
              {status.responseTimeMs}ms
            </span>
          </div>
          
          {status.message && (
            <p className="text-xs text-muted-foreground truncate" title={status.message}>
              {status.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  suffix,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  suffix?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          {trend && (
            <TrendingUp
              className={`h-3 w-3 ${
                trend === "up" ? "text-red-500" : trend === "down" ? "text-green-500" : "text-muted-foreground"
              }`}
            />
          )}
        </div>
        <p className="text-2xl font-bold">
          {value}
          {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
        </p>
        <p className="text-xs text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}

function ResourceBar({
  label,
  used,
  total,
  percentage,
  unit,
}: {
  label: string;
  used: number;
  total: number;
  percentage: number;
  unit: string;
}) {
  const getBarColor = (pct: number) => {
    if (pct >= 90) return "bg-red-500";
    if (pct >= 75) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">
          {used} / {total} {unit} ({percentage}%)
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(percentage)} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function AlertItem({ alert, isRTL }: { alert: HealthAlert; isRTL: boolean }) {
  const config = {
    error: {
      icon: <XCircle className="h-4 w-4" />,
      className: "bg-red-500/10 border-red-500/20 text-red-600",
    },
    warning: {
      icon: <AlertTriangle className="h-4 w-4" />,
      className: "bg-amber-500/10 border-amber-500/20 text-amber-600",
    },
    info: {
      icon: <AlertCircle className="h-4 w-4" />,
      className: "bg-blue-500/10 border-blue-500/20 text-blue-600",
    },
  };

  const { icon, className } = config[alert.type];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${className}`}>
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{alert.message}</p>
        {alert.service && (
          <p className="text-xs text-muted-foreground mt-1">
            {isRTL ? "الخدمة:" : "Service:"} {alert.service}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SystemHealth({ locale }: SystemHealthProps) {
  const isRTL = locale === "ar";
  const t = getTranslations(isRTL);

  // State
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch health data
  const fetchHealthData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch("/api/admin/health");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch health data");
      }

      setHealthData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealthData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchHealthData]);

  // Format uptime
  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} ${t.time.days} ${hours % 24} ${t.time.hours}`;
    }
    if (hours > 0) {
      return `${hours} ${t.time.hours} ${minutes % 60} ${t.time.minutes}`;
    }
    if (minutes > 0) {
      return `${minutes} ${t.time.minutes}`;
    }
    return `${seconds} ${t.time.seconds}`;
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffSecs < 60) return t.time.justNow;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} ${t.time.minutes} ${t.time.ago}`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} ${t.time.hours} ${t.time.ago}`;
  };

  // Service icon mapping
  const serviceIcons: Record<string, { icon: React.ElementType; color: string }> = {
    database: { icon: Database, color: "bg-blue-500/10 text-blue-500" },
    supabase: { icon: Cloud, color: "bg-emerald-500/10 text-emerald-500" },
    api: { icon: Globe, color: "bg-purple-500/10 text-purple-500" },
    auth: { icon: Lock, color: "bg-amber-500/10 text-amber-500" },
    storage: { icon: HardDrive, color: "bg-cyan-500/10 text-cyan-500" },
    cache: { icon: Zap, color: "bg-pink-500/10 text-pink-500" },
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            {t.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {healthData && (
            <StatusIndicator status={healthData.overallStatus} isRTL={isRTL} />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchHealthData(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"} ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? t.actions.refreshing : t.actions.refresh}
          </Button>
        </div>
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
          <Button onClick={() => fetchHealthData()} variant="outline">
            <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t.states.retry}
          </Button>
        </div>
      )}

      {/* Health Data */}
      {healthData && !isLoading && (
        <>
          {/* Overall Status Card */}
          <Card className={`border-2 ${
            healthData.overallStatus === "healthy" ? "border-green-500/30" :
            healthData.overallStatus === "degraded" ? "border-amber-500/30" :
            "border-red-500/30"
          }`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    healthData.overallStatus === "healthy" ? "bg-green-500/10" :
                    healthData.overallStatus === "degraded" ? "bg-amber-500/10" :
                    "bg-red-500/10"
                  }`}>
                    <Shield className={`h-6 w-6 ${
                      healthData.overallStatus === "healthy" ? "text-green-500" :
                      healthData.overallStatus === "degraded" ? "text-amber-500" :
                      "text-red-500"
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.environment.current}</p>
                    <p className="text-lg font-semibold capitalize">{healthData.environment.current}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t.environment.version}:</span>
                    <span className="font-mono">{healthData.version}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t.metrics.uptime}:</span>
                    <span className="font-mono">{formatUptime(healthData.metrics.uptime)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Grid - Requirements 8.1, 8.4 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Server className="h-5 w-5 text-muted-foreground" />
              {t.services.title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(healthData.services).map(([key, status]) => {
                const { icon, color } = serviceIcons[key] || { icon: Server, color: "bg-gray-500/10 text-gray-500" };
                const serviceName = t.services[key as keyof typeof t.services] || key;
                
                return (
                  <ServiceCard
                    key={key}
                    name={typeof serviceName === 'string' ? serviceName : key}
                    icon={icon}
                    status={status}
                    isRTL={isRTL}
                    color={color}
                  />
                );
              })}
            </div>
          </div>

          {/* Metrics Grid - Requirements 8.2, 8.3 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              {t.metrics.title}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title={t.metrics.errorRate}
                value={healthData.metrics.errorRate.toFixed(2)}
                icon={AlertTriangle}
                color="bg-red-500/10 text-red-500"
                suffix={t.metrics.perMinute}
                trend={healthData.metrics.errorRate > 5 ? "up" : "neutral"}
              />
              <MetricCard
                title={t.metrics.avgResponseTime}
                value={Math.round(healthData.metrics.averageResponseTime)}
                icon={Clock}
                color="bg-blue-500/10 text-blue-500"
                suffix="ms"
              />
              <MetricCard
                title={t.metrics.totalErrors}
                value={healthData.metrics.totalErrors}
                icon={XCircle}
                color="bg-amber-500/10 text-amber-500"
              />
              <MetricCard
                title={t.metrics.activeAlerts}
                value={healthData.metrics.activeAlerts}
                icon={Zap}
                color="bg-purple-500/10 text-purple-500"
              />
            </div>
          </div>

          {/* Resource Usage - Requirement 8.3 */}
          {(healthData.metrics.memory || healthData.metrics.cpu) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  {isRTL ? "استخدام الموارد" : "Resource Usage"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {healthData.metrics.memory && (
                  <ResourceBar
                    label={t.metrics.memory}
                    used={healthData.metrics.memory.used}
                    total={healthData.metrics.memory.total}
                    percentage={healthData.metrics.memory.percentage}
                    unit="MB"
                  />
                )}
                {healthData.metrics.cpu && (
                  <ResourceBar
                    label={t.metrics.cpu}
                    used={healthData.metrics.cpu.used}
                    total={healthData.metrics.cpu.total}
                    percentage={healthData.metrics.cpu.percentage}
                    unit="%"
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Alerts - Requirement 8.5 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t.alerts.title}
                {healthData.alerts.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {healthData.alerts.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthData.alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t.alerts.noAlerts}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {healthData.alerts.map((alert, index) => (
                    <AlertItem key={index} alert={alert} isRTL={isRTL} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Environment Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-4 w-4" />
                {t.environment.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.environment.current}</p>
                  <p className="font-medium capitalize">{healthData.environment.current}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{isRTL ? "التهيئة" : "Configuration"}</p>
                  <Badge variant={healthData.environment.configured ? "default" : "destructive"}>
                    {healthData.environment.configured ? t.environment.configured : t.environment.notConfigured}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{isRTL ? "العزل" : "Isolation"}</p>
                  <Badge variant={healthData.environment.isolated ? "default" : "secondary"}>
                    {healthData.environment.isolated ? t.environment.isolated : t.environment.notIsolated}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t.services.lastChecked}</p>
                  <p className="text-sm">{formatRelativeTime(healthData.timestamp)}</p>
                </div>
              </div>
              
              {healthData.environment.missingVariables.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm font-medium text-amber-600 mb-2">{t.environment.missingVars}:</p>
                  <div className="flex flex-wrap gap-2">
                    {healthData.environment.missingVariables.map((varName) => (
                      <Badge key={varName} variant="outline" className="font-mono text-xs">
                        {varName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
