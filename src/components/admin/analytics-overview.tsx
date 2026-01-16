"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import {
  Calculator,
  Users,
  FileText,
  TrendingUp,
  Activity,
  Clock,
  BarChart3,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Analytics Overview Component
 * 
 * Displays key platform metrics, charts, and activity feed
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

// Types
interface DashboardMetrics {
  totalTools: number;
  totalCalculations: number;
  totalUsers: number;
  totalArticles: number;
  calculationsToday: number;
  newUsersThisMonth: number;
}

interface ChartDataPoint {
  date: string;
  calculations: number;
}

interface TopTool {
  slug: string;
  name: string;
  usageCount: number;
}

interface RecentActivity {
  id: string;
  type: "calculation" | "user_signup" | "article_created" | "error";
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface AnalyticsData {
  metrics: DashboardMetrics;
  chartData: ChartDataPoint[];
  topTools: TopTool[];
  recentActivity: RecentActivity[];
  dateRange: {
    start: string;
    end: string;
    label: string;
  };
}

interface AnalyticsOverviewProps {
  locale?: string;
}

export function AnalyticsOverview({ locale: propLocale }: AnalyticsOverviewProps) {
  const locale = propLocale || useLocale();
  const isRTL = locale === "ar";

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("7d");

  // Translations
  const t = {
    title: isRTL ? "نظرة عامة على التحليلات" : "Analytics Overview",
    dateRange: isRTL ? "الفترة الزمنية" : "Date Range",
    ranges: {
      "1d": isRTL ? "يوم واحد" : "1 Day",
      "7d": isRTL ? "7 أيام" : "7 Days",
      "30d": isRTL ? "30 يوم" : "30 Days",
      "90d": isRTL ? "90 يوم" : "90 Days",
    },
    metrics: {
      totalTools: isRTL ? "إجمالي الأدوات" : "Total Tools",
      totalCalculations: isRTL ? "إجمالي الحسابات" : "Total Calculations",
      totalUsers: isRTL ? "إجمالي المستخدمين" : "Total Users",
      totalArticles: isRTL ? "إجمالي المقالات" : "Total Articles",
      calculationsToday: isRTL ? "حسابات اليوم" : "Today's Calculations",
      newUsersThisMonth: isRTL ? "مستخدمون جدد هذا الشهر" : "New Users This Month",
    },
    sections: {
      calculationsChart: isRTL ? "الحسابات خلال الفترة" : "Calculations Over Time",
      topTools: isRTL ? "أكثر الأدوات استخداماً" : "Top 5 Tools",
      recentActivity: isRTL ? "النشاط الأخير" : "Recent Activity",
    },
    activityTypes: {
      calculation: isRTL ? "حساب" : "Calculation",
      user_signup: isRTL ? "تسجيل مستخدم" : "User Signup",
      article_created: isRTL ? "مقال جديد" : "Article Created",
      error: isRTL ? "خطأ" : "Error",
    },
    loading: isRTL ? "جاري التحميل..." : "Loading...",
    error: isRTL ? "حدث خطأ أثناء تحميل البيانات" : "Error loading data",
    retry: isRTL ? "إعادة المحاولة" : "Retry",
    refresh: isRTL ? "تحديث" : "Refresh",
    noData: isRTL ? "لا توجد بيانات" : "No data available",
    uses: isRTL ? "استخدام" : "uses",
  };

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/analytics?range=${dateRange}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch analytics");
      }

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || "Invalid response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Format timestamp for activity
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return isRTL ? "الآن" : "Just now";
    if (diffMins < 60) return isRTL ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    return isRTL ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
  };

  // Get activity icon and color
  const getActivityStyle = (type: RecentActivity["type"]) => {
    switch (type) {
      case "calculation":
        return { icon: Calculator, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "user_signup":
        return { icon: Users, color: "text-green-500", bg: "bg-green-500/10" };
      case "article_created":
        return { icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" };
      case "error":
        return { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" };
      default:
        return { icon: Activity, color: "text-gray-500", bg: "bg-gray-500/10" };
    }
  };

  // Calculate max value for chart scaling
  const maxChartValue = data?.chartData
    ? Math.max(...data.chartData.map((d) => d.calculations), 1)
    : 1;

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">{t.loading}</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{t.error}</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchAnalytics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t.retry}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">{t.noData}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-semibold">{t.title}</h2>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t.dateRange} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">{t.ranges["1d"]}</SelectItem>
              <SelectItem value="7d">{t.ranges["7d"]}</SelectItem>
              <SelectItem value="30d">{t.ranges["30d"]}</SelectItem>
              <SelectItem value="90d">{t.ranges["90d"]}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards - Requirement 7.1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title={t.metrics.totalTools}
          value={data.metrics.totalTools}
          icon={Calculator}
          color="text-blue-500"
          bgColor="bg-blue-500/10"
        />
        <MetricCard
          title={t.metrics.totalCalculations}
          value={data.metrics.totalCalculations}
          icon={TrendingUp}
          color="text-green-500"
          bgColor="bg-green-500/10"
        />
        <MetricCard
          title={t.metrics.totalUsers}
          value={data.metrics.totalUsers}
          icon={Users}
          color="text-purple-500"
          bgColor="bg-purple-500/10"
        />
        <MetricCard
          title={t.metrics.totalArticles}
          value={data.metrics.totalArticles}
          icon={FileText}
          color="text-orange-500"
          bgColor="bg-orange-500/10"
        />
        <MetricCard
          title={t.metrics.calculationsToday}
          value={data.metrics.calculationsToday}
          icon={Activity}
          color="text-cyan-500"
          bgColor="bg-cyan-500/10"
        />
        <MetricCard
          title={t.metrics.newUsersThisMonth}
          value={data.metrics.newUsersThisMonth}
          icon={Users}
          color="text-pink-500"
          bgColor="bg-pink-500/10"
        />
      </div>

      {/* Charts and Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculations Chart - Requirement 7.2 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              {t.sections.calculationsChart}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end gap-1">
              {data.chartData.map((point, index) => (
                <div
                  key={point.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                    style={{
                      height: `${Math.max((point.calculations / maxChartValue) * 160, 4)}px`,
                    }}
                    title={`${point.calculations} calculations`}
                  />
                  {(index === 0 ||
                    index === data.chartData.length - 1 ||
                    index === Math.floor(data.chartData.length / 2)) && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(point.date)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Tools - Requirement 7.3 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              {t.sections.topTools}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topTools.length > 0 ? (
              <div className="space-y-3">
                {data.topTools.map((tool, index) => (
                  <div
                    key={tool.slug}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-5">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium truncate max-w-[180px]">
                        {tool.name}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {tool.usageCount} {t.uses}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {t.noData}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Requirement 7.4 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {t.sections.recentActivity}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {data.recentActivity.map((activity) => {
                const style = getActivityStyle(activity.type);
                const Icon = style.icon;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 py-2 border-b last:border-0"
                  >
                    <div className={`p-2 rounded-lg ${style.bg}`}>
                      <Icon className={`h-4 w-4 ${style.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {t.activityTypes[activity.type]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {t.noData}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

function MetricCard({ title, value, icon: Icon, color, bgColor }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${bgColor}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
        </div>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground truncate">{title}</p>
      </CardContent>
    </Card>
  );
}

export default AnalyticsOverview;
