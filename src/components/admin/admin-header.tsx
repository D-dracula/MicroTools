"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  FileText,
  Users,
  AlertTriangle,
  Database,
  Activity,
  Key,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { type AdminSection, getAdminSectionFromPath } from "./admin-sidebar";

/**
 * Admin Header Props
 */
interface AdminHeaderProps {
  locale: string;
  user: {
    email: string;
    name?: string | null;
    role: string;
  };
  className?: string;
}

/**
 * Section configuration with icons and colors
 */
interface SectionConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

/**
 * Get translations for admin header
 */
function getTranslations(isRTL: boolean) {
  return {
    sections: {
      overview: isRTL ? "نظرة عامة" : "Overview",
      blog: isRTL ? "إدارة المقالات" : "Blog Manager",
      users: isRTL ? "إدارة المستخدمين" : "User Manager",
      errors: isRTL ? "مراقبة الأخطاء" : "Error Monitor",
      migrations: isRTL ? "إدارة الترحيل" : "Migrations",
      health: isRTL ? "صحة النظام" : "System Health",
      keys: isRTL ? "مفاتيح API" : "API Keys",
    },
    descriptions: {
      overview: isRTL ? "لوحة التحكم الرئيسية" : "Main dashboard overview",
      blog: isRTL ? "إنشاء وتعديل وحذف المقالات" : "Create, edit, and delete articles",
      users: isRTL ? "عرض وإدارة المستخدمين" : "View and manage users",
      errors: isRTL ? "مراقبة أخطاء النظام" : "Monitor system errors",
      migrations: isRTL ? "إدارة ترحيل قاعدة البيانات" : "Manage database migrations",
      health: isRTL ? "مراقبة صحة النظام" : "Monitor system health",
      keys: isRTL ? "إدارة مفاتيح API" : "Manage API keys",
    },
    admin: isRTL ? "مسؤول" : "Admin",
  };
}

/**
 * Section configurations with icons and colors
 */
const sectionConfigs: Record<AdminSection, SectionConfig> = {
  overview: {
    icon: LayoutDashboard,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  blog: {
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  users: {
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  errors: {
    icon: AlertTriangle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  migrations: {
    icon: Database,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  health: {
    icon: Activity,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  keys: {
    icon: Key,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
};

/**
 * Admin Header Component
 *
 * Displays the header for admin pages with:
 * - Current section title with icon
 * - Section description
 * - Admin user email and role badge
 *
 * Requirements: 1.5, 2.5
 */
export function AdminHeader({ locale, user, className }: AdminHeaderProps) {
  const pathname = usePathname();
  const isRTL = locale === "ar";
  const t = getTranslations(isRTL);

  // Get current section from pathname
  const currentSection = getAdminSectionFromPath(pathname, locale);
  const sectionConfig = sectionConfigs[currentSection];
  const SectionIcon = sectionConfig.icon;

  // Get section title and description
  const sectionTitle = t.sections[currentSection];
  const sectionDescription = t.descriptions[currentSection];

  return (
    <header
      className={cn(
        "bg-card border-b px-6 py-4",
        className
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between">
        {/* Section Info */}
        <div className="flex items-center gap-4">
          {/* Section Icon */}
          <div className={cn("p-2.5 rounded-lg", sectionConfig.bgColor)}>
            <SectionIcon className={cn("h-5 w-5", sectionConfig.color)} />
          </div>

          {/* Section Title and Description */}
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {sectionTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              {sectionDescription}
            </p>
          </div>
        </div>

        {/* Admin User Info (Requirement 1.5) */}
        <div className="flex items-center gap-3">
          {/* User Info */}
          <div className={cn("text-right", isRTL && "text-left")}>
            <p className="text-sm font-medium text-foreground">
              {user.name || user.email}
            </p>
            <p className="text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>

          {/* Admin Badge */}
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <Shield className="h-3 w-3" />
              <span>{t.admin}</span>
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Get section title for a given admin section
 * Utility function for external use
 */
export function getAdminSectionTitle(section: AdminSection, locale: string): string {
  const isRTL = locale === "ar";
  const t = getTranslations(isRTL);
  return t.sections[section];
}

/**
 * Get section description for a given admin section
 * Utility function for external use
 */
export function getAdminSectionDescription(section: AdminSection, locale: string): string {
  const isRTL = locale === "ar";
  const t = getTranslations(isRTL);
  return t.descriptions[section];
}
