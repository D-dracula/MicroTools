"use client";

import { useLocale } from "next-intl";
import { 
  FileText, 
  Users, 
  AlertTriangle, 
  Database,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AnalyticsOverview } from "@/components/admin";

/**
 * Admin Overview Content Component
 * 
 * Displays the main admin dashboard overview with:
 * - Analytics overview (metrics, charts, activity)
 * - Quick action buttons
 * 
 * Requirements: 9.1, 9.2, 9.3
 * Note: Admin user info is now displayed in AdminHeader component (Requirement 1.5)
 */
export function AdminOverviewContent() {
  const locale = useLocale();
  
  const isRTL = locale === "ar";
  
  // Translations
  const t = {
    quickActions: isRTL ? "إجراءات سريعة" : "Quick Actions",
    actions: {
      generateArticle: isRTL ? "إنشاء مقال" : "Generate Article",
      viewErrors: isRTL ? "عرض الأخطاء" : "View Errors",
      runMigrations: isRTL ? "تشغيل الترحيل" : "Run Migrations",
      viewUsers: isRTL ? "عرض المستخدمين" : "View Users",
    },
  };
  
  // Quick action buttons - Requirement 9.2
  const quickActions = [
    {
      id: "generate-article",
      icon: Plus,
      label: t.actions.generateArticle,
      href: `/${locale}/admin/blog`,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      hoverBg: "hover:bg-blue-500/20",
    },
    {
      id: "view-errors",
      icon: AlertTriangle,
      label: t.actions.viewErrors,
      href: `/${locale}/admin/errors`,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      hoverBg: "hover:bg-red-500/20",
    },
    {
      id: "run-migrations",
      icon: Database,
      label: t.actions.runMigrations,
      href: `/${locale}/admin/migrations`,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      hoverBg: "hover:bg-purple-500/20",
    },
    {
      id: "view-users",
      icon: Users,
      label: t.actions.viewUsers,
      href: `/${locale}/admin/users`,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      hoverBg: "hover:bg-green-500/20",
    },
  ];
  
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Quick Actions Section - Requirements 9.1, 9.2, 9.3 */}
      <section>
        <h2 className="text-lg font-semibold mb-4">{t.quickActions}</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.id} href={action.href}>
                <Button
                  variant="outline"
                  className={`${action.bgColor} ${action.hoverBg} border-0`}
                >
                  <Icon className={`h-4 w-4 ${action.color} mr-2`} />
                  <span>{action.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </section>
      
      {/* Analytics Overview - Requirements 7.1, 7.2, 7.3, 7.4, 7.5 */}
      <section>
        <AnalyticsOverview locale={locale} />
      </section>
    </div>
  );
}
