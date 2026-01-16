"use client";

/**
 * Migration Manager Component
 * 
 * Admin component for managing database migrations with:
 * - Migration statistics cards
 * - Migration list with status badges
 * - Run migrations button (with dry run support)
 * - Rollback options
 * - Execution results display
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { useState, useEffect, useCallback } from "react";
import {
  Database,
  RefreshCw,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileCode,
  Layers,
  Timer,
  Hash,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// Types
// ============================================================================

interface MigrationStats {
  total: number;
  executed: number;
  pending: number;
  failed: number;
  rolledBack: number;
}

interface MigrationItem {
  name: string;
  status: "executed" | "pending" | "failed" | "rolled_back";
  executedAt?: string;
  executionTimeMs?: number;
  batchId?: string;
  errorMessage?: string;
  checksum?: string;
}

interface ExecutionResult {
  success: boolean;
  executed?: string[];
  failed?: string[];
  skipped?: string[];
  rolledBack?: string[];
  totalTimeMs: number;
  batchId?: string;
  message: string;
}

interface MigrationManagerProps {
  locale: string;
}

// ============================================================================
// Translations
// ============================================================================

function getTranslations(isRTL: boolean) {
  return {
    title: isRTL ? "إدارة الترحيل" : "Migration Manager",
    subtitle: isRTL ? "إدارة ترحيل قاعدة البيانات" : "Manage database schema migrations",
    
    // Actions
    actions: {
      refresh: isRTL ? "تحديث" : "Refresh",
      runMigrations: isRTL ? "تشغيل الترحيل" : "Run Migrations",
      dryRun: isRTL ? "تشغيل تجريبي" : "Dry Run",
      rollback: isRTL ? "التراجع" : "Rollback",
      rollbackLast: isRTL ? "التراجع عن الأخير" : "Rollback Last",
      rollbackCount: (n: number) => isRTL ? `التراجع عن ${n}` : `Rollback ${n}`,
      close: isRTL ? "إغلاق" : "Close",
      confirm: isRTL ? "تأكيد" : "Confirm",
      cancel: isRTL ? "إلغاء" : "Cancel",
    },
    
    // Stats
    stats: {
      total: isRTL ? "إجمالي الترحيلات" : "Total Migrations",
      executed: isRTL ? "تم التنفيذ" : "Executed",
      pending: isRTL ? "قيد الانتظار" : "Pending",
      failed: isRTL ? "فشل" : "Failed",
      rolledBack: isRTL ? "تم التراجع" : "Rolled Back",
    },
    
    // Status
    status: {
      executed: isRTL ? "تم التنفيذ" : "Executed",
      pending: isRTL ? "قيد الانتظار" : "Pending",
      failed: isRTL ? "فشل" : "Failed",
      rolledBack: isRTL ? "تم التراجع" : "Rolled Back",
    },
    
    // Table
    table: {
      migration: isRTL ? "الترحيل" : "Migration",
      status: isRTL ? "الحالة" : "Status",
      executedAt: isRTL ? "تاريخ التنفيذ" : "Executed At",
      duration: isRTL ? "المدة" : "Duration",
      batch: isRTL ? "الدفعة" : "Batch",
      checksum: isRTL ? "التحقق" : "Checksum",
    },
    
    // States
    states: {
      loading: isRTL ? "جاري التحميل..." : "Loading...",
      error: isRTL ? "حدث خطأ" : "An error occurred",
      noMigrations: isRTL ? "لا توجد ترحيلات" : "No migrations found",
      retry: isRTL ? "إعادة المحاولة" : "Retry",
      processing: isRTL ? "جاري المعالجة..." : "Processing...",
      running: isRTL ? "جاري التشغيل..." : "Running...",
    },
    
    // Results
    results: {
      title: isRTL ? "نتيجة العملية" : "Operation Result",
      success: isRTL ? "نجاح" : "Success",
      failed: isRTL ? "فشل" : "Failed",
      executed: isRTL ? "تم التنفيذ" : "Executed",
      skipped: isRTL ? "تم التخطي" : "Skipped",
      rolledBack: isRTL ? "تم التراجع" : "Rolled Back",
      totalTime: isRTL ? "الوقت الإجمالي" : "Total Time",
      batchId: isRTL ? "معرف الدفعة" : "Batch ID",
    },
    
    // Confirmations
    confirm: {
      rollback: isRTL 
        ? "هل أنت متأكد من التراجع عن هذه الترحيلات؟ هذا الإجراء لا يمكن التراجع عنه."
        : "Are you sure you want to rollback these migrations? This action cannot be undone.",
      runMigrations: isRTL
        ? "هل أنت متأكد من تشغيل الترحيلات المعلقة؟"
        : "Are you sure you want to run pending migrations?",
    },
    
    // Guidelines
    guidelines: {
      title: isRTL ? "إرشادات الترحيل" : "Migration Guidelines",
      items: isRTL ? [
        "قم دائماً بتشغيل تجريبي أولاً لمعاينة التغييرات",
        "يتم تنفيذ الترحيلات بترتيب اسم الملف",
        "يتم التراجع بترتيب عكسي",
        "كل ترحيل ينشئ SQL للتراجع تلقائياً",
        "استخدم CLI للنشر في الإنتاج",
      ] : [
        "Always run a dry run first to preview changes",
        "Migrations are executed in filename order",
        "Rollbacks are performed in reverse order",
        "Each migration generates automatic rollback SQL",
        "Use the CLI for production deployments",
      ],
    },
  };
}

// ============================================================================
// Helper Components
// ============================================================================

function StatusBadge({ status, isRTL }: { status: MigrationItem["status"]; isRTL: boolean }) {
  const config: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
    executed: {
      icon: <CheckCircle className="h-3 w-3" />,
      className: "bg-green-500/10 text-green-600 border-green-500/20",
      label: isRTL ? "تم التنفيذ" : "Executed",
    },
    pending: {
      icon: <Clock className="h-3 w-3" />,
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      label: isRTL ? "قيد الانتظار" : "Pending",
    },
    failed: {
      icon: <XCircle className="h-3 w-3" />,
      className: "bg-red-500/10 text-red-600 border-red-500/20",
      label: isRTL ? "فشل" : "Failed",
    },
    rolled_back: {
      icon: <RotateCcw className="h-3 w-3" />,
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      label: isRTL ? "تم التراجع" : "Rolled Back",
    },
  };

  const { icon, className, label } = config[status] || config.pending;

  return (
    <Badge variant="outline" className={`${className} gap-1`}>
      {icon}
      {label}
    </Badge>
  );
}

function StatCard({ 
  icon: Icon, 
  value, 
  label, 
  color,
  bgColor,
}: { 
  icon: React.ElementType; 
  value: number; 
  label: string; 
  color: string;
  bgColor: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${bgColor}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function ResultDisplay({ 
  result, 
  isRTL, 
  t,
  onClose,
}: { 
  result: ExecutionResult; 
  isRTL: boolean;
  t: ReturnType<typeof getTranslations>;
  onClose: () => void;
}) {
  return (
    <Card className={`border-2 ${result.success ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            {t.results.title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className={`font-medium ${result.success ? "text-green-600" : "text-red-600"}`}>
          {result.message}
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {result.executed && result.executed.length > 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{t.results.executed}: {result.executed.length}</span>
            </div>
          )}
          {result.failed && result.failed.length > 0 && (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>{t.results.failed}: {result.failed.length}</span>
            </div>
          )}
          {result.skipped && result.skipped.length > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>{t.results.skipped}: {result.skipped.length}</span>
            </div>
          )}
          {result.rolledBack && result.rolledBack.length > 0 && (
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-amber-500" />
              <span>{t.results.rolledBack}: {result.rolledBack.length}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
          <span className="flex items-center gap-1">
            <Timer className="h-3 w-3" />
            {t.results.totalTime}: {result.totalTimeMs}ms
          </span>
          {result.batchId && (
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {t.results.batchId}: {result.batchId.slice(0, 20)}...
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MigrationManager({ locale }: MigrationManagerProps) {
  const isRTL = locale === "ar";
  const t = getTranslations(isRTL);

  // State
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [migrations, setMigrations] = useState<MigrationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null);
  const [expandedMigration, setExpandedMigration] = useState<string | null>(null);
  const [showRollbackOptions, setShowRollbackOptions] = useState(false);

  // Fetch migrations
  const fetchMigrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/migrations?action=status");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch migrations");
      }

      setStats(result.data.stats);
      setMigrations(result.data.migrations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMigrations();
  }, [fetchMigrations]);

  // Run migrations
  const handleRunMigrations = async (dryRun: boolean = false) => {
    if (!dryRun && !confirm(t.confirm.runMigrations)) {
      return;
    }

    setIsProcessing(true);
    setLastResult(null);

    try {
      const response = await fetch("/api/admin/migrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "migrate", options: { dryRun } }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Migration failed");
      }

      setLastResult(result.result);

      // Refresh migrations list if not dry run
      if (!dryRun) {
        await fetchMigrations();
      }
    } catch (err) {
      setLastResult({
        success: false,
        totalTimeMs: 0,
        message: err instanceof Error ? err.message : "Migration failed",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Rollback migrations
  const handleRollback = async (count: number) => {
    if (!confirm(t.confirm.rollback)) {
      return;
    }

    setIsProcessing(true);
    setLastResult(null);
    setShowRollbackOptions(false);

    try {
      const response = await fetch("/api/admin/migrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback", options: { count } }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Rollback failed");
      }

      setLastResult(result.result);
      await fetchMigrations();
    } catch (err) {
      setLastResult({
        success: false,
        totalTimeMs: 0,
        message: err instanceof Error ? err.message : "Rollback failed",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format duration
  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-500" />
            {t.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMigrations} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"} ${isLoading ? "animate-spin" : ""}`} />
          {t.actions.refresh}
        </Button>
      </div>

      {/* Statistics Cards - Requirement 6.1, 6.2 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            icon={Layers}
            value={stats.total}
            label={t.stats.total}
            color="text-foreground"
            bgColor="bg-muted"
          />
          <StatCard
            icon={CheckCircle}
            value={stats.executed}
            label={t.stats.executed}
            color="text-green-600"
            bgColor="bg-green-500/10"
          />
          <StatCard
            icon={Clock}
            value={stats.pending}
            label={t.stats.pending}
            color="text-blue-600"
            bgColor="bg-blue-500/10"
          />
          <StatCard
            icon={XCircle}
            value={stats.failed}
            label={t.stats.failed}
            color="text-red-600"
            bgColor="bg-red-500/10"
          />
          <StatCard
            icon={RotateCcw}
            value={stats.rolledBack}
            label={t.stats.rolledBack}
            color="text-amber-600"
            bgColor="bg-amber-500/10"
          />
        </div>
      )}

      {/* Action Buttons - Requirements 6.3, 6.4, 6.5 */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            {/* Run Migrations Button */}
            <Button
              onClick={() => handleRunMigrations(false)}
              disabled={isProcessing || !stats || stats.pending === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? (
                <RefreshCw className={`h-4 w-4 animate-spin ${isRTL ? "ml-2" : "mr-2"}`} />
              ) : (
                <Play className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              )}
              {isProcessing ? t.states.running : t.actions.runMigrations}
              {stats && stats.pending > 0 && !isProcessing && (
                <Badge variant="secondary" className={`${isRTL ? "mr-2" : "ml-2"} bg-white/20`}>
                  {stats.pending}
                </Badge>
              )}
            </Button>

            {/* Dry Run Button */}
            <Button
              variant="outline"
              onClick={() => handleRunMigrations(true)}
              disabled={isProcessing || !stats || stats.pending === 0}
            >
              <Zap className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {t.actions.dryRun}
            </Button>

            {/* Rollback Dropdown */}
            <div className="relative">
              <Button
                variant="destructive"
                onClick={() => setShowRollbackOptions(!showRollbackOptions)}
                disabled={isProcessing || !stats || stats.executed === 0}
              >
                <RotateCcw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {t.actions.rollback}
                {showRollbackOptions ? (
                  <ChevronUp className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2"}`} />
                ) : (
                  <ChevronDown className={`h-4 w-4 ${isRTL ? "mr-2" : "ml-2"}`} />
                )}
              </Button>

              {showRollbackOptions && (
                <div className={`absolute top-full mt-1 ${isRTL ? "right-0" : "left-0"} z-10 bg-card border rounded-lg shadow-lg p-2 min-w-[160px]`}>
                  <button
                    onClick={() => handleRollback(1)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                  >
                    {t.actions.rollbackCount(1)}
                  </button>
                  {stats && stats.executed >= 3 && (
                    <button
                      onClick={() => handleRollback(3)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                    >
                      {t.actions.rollbackCount(3)}
                    </button>
                  )}
                  {stats && stats.executed >= 5 && (
                    <button
                      onClick={() => handleRollback(5)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                    >
                      {t.actions.rollbackCount(5)}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution Result - Requirement 6.6 */}
      {lastResult && (
        <ResultDisplay
          result={lastResult}
          isRTL={isRTL}
          t={t}
          onClose={() => setLastResult(null)}
        />
      )}

      {/* Migration List - Requirement 6.1 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              {t.table.migration}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {migrations.length} {isRTL ? "ترحيل" : "migrations"}
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
              <Button onClick={fetchMigrations} variant="outline">
                <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {t.states.retry}
              </Button>
            </div>
          ) : migrations.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">{t.states.noMigrations}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {migrations.map((migration, index) => (
                <div
                  key={migration.name}
                  className={`border rounded-lg transition-colors ${
                    expandedMigration === migration.name ? "bg-accent/50" : "hover:bg-accent/30"
                  }`}
                >
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedMigration(
                      expandedMigration === migration.name ? null : migration.name
                    )}
                  >
                    {/* Index */}
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded min-w-[32px] text-center">
                      {index + 1}
                    </span>

                    {/* Migration Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{migration.name}</p>
                      {migration.status === "executed" && migration.executedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(migration.executedAt)}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <StatusBadge status={migration.status} isRTL={isRTL} />

                    {/* Duration */}
                    {migration.executionTimeMs && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {formatDuration(migration.executionTimeMs)}
                      </span>
                    )}

                    {/* Expand Icon */}
                    {expandedMigration === migration.name ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedMigration === migration.name && (
                    <div className="px-4 pb-4 pt-0 border-t bg-muted/30">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">{t.table.status}</p>
                          <StatusBadge status={migration.status} isRTL={isRTL} />
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">{t.table.executedAt}</p>
                          <p className="font-medium">{formatDate(migration.executedAt)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">{t.table.duration}</p>
                          <p className="font-medium">{formatDuration(migration.executionTimeMs)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">{t.table.batch}</p>
                          <p className="font-medium font-mono text-xs">
                            {migration.batchId ? migration.batchId.slice(0, 15) + "..." : "-"}
                          </p>
                        </div>
                      </div>

                      {migration.checksum && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-muted-foreground text-xs mb-1">{t.table.checksum}</p>
                          <p className="font-mono text-xs break-all">{migration.checksum}</p>
                        </div>
                      )}

                      {migration.errorMessage && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-red-600 text-xs mb-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Error
                          </p>
                          <p className="text-sm text-red-600">{migration.errorMessage}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card className="bg-purple-500/5 border-purple-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <Info className="h-4 w-4" />
            {t.guidelines.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-1">
            {t.guidelines.items.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-purple-500">•</span>
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
