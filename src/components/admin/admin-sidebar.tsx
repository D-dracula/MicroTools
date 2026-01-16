"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Users,
  AlertTriangle,
  Database,
  Activity,
  Key,
  type LucideIcon,
} from "lucide-react";

/**
 * Admin Section Types
 * Defines all available admin sections for navigation
 */
export type AdminSection =
  | "overview"
  | "blog"
  | "users"
  | "errors"
  | "migrations"
  | "health"
  | "keys";

/**
 * Navigation Item Interface
 */
interface NavItem {
  id: AdminSection;
  icon: LucideIcon;
  labelKey: string;
  href: string;
  color: string;
  bgColor: string;
}

/**
 * Admin Sidebar Props
 */
interface AdminSidebarProps {
  locale: string;
  className?: string;
}

/**
 * Get translations for admin sidebar
 */
function getTranslations(isRTL: boolean) {
  return {
    adminPanel: isRTL ? "لوحة الإدارة" : "Admin Panel",
    sections: {
      overview: isRTL ? "نظرة عامة" : "Overview",
      blog: isRTL ? "إدارة المقالات" : "Blog Manager",
      users: isRTL ? "إدارة المستخدمين" : "User Manager",
      errors: isRTL ? "مراقبة الأخطاء" : "Error Monitor",
      migrations: isRTL ? "إدارة الترحيل" : "Migrations",
      health: isRTL ? "صحة النظام" : "System Health",
      keys: isRTL ? "مفاتيح API" : "API Keys",
    },
  };
}

/**
 * Admin Sidebar Component
 *
 * Provides navigation for all admin sections with:
 * - Icons and labels for each section
 * - Active state highlighting based on current route
 * - RTL/LTR support based on locale
 *
 * Requirements: 2.1, 2.2, 2.3
 */
export function AdminSidebar({ locale, className }: AdminSidebarProps) {
  const pathname = usePathname();
  const isRTL = locale === "ar";
  const t = getTranslations(isRTL);

  // Define navigation items with icons and colors
  const navItems: NavItem[] = [
    {
      id: "overview",
      icon: LayoutDashboard,
      labelKey: t.sections.overview,
      href: `/${locale}/admin`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      id: "blog",
      icon: FileText,
      labelKey: t.sections.blog,
      href: `/${locale}/admin/blog`,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      id: "users",
      icon: Users,
      labelKey: t.sections.users,
      href: `/${locale}/admin/users`,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      id: "errors",
      icon: AlertTriangle,
      labelKey: t.sections.errors,
      href: `/${locale}/admin/errors`,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      id: "migrations",
      icon: Database,
      labelKey: t.sections.migrations,
      href: `/${locale}/admin/migrations`,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      id: "health",
      icon: Activity,
      labelKey: t.sections.health,
      href: `/${locale}/admin/health`,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      id: "keys",
      icon: Key,
      labelKey: t.sections.keys,
      href: `/${locale}/admin/keys`,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  /**
   * Check if a nav item is currently active
   * Handles exact match for overview and prefix match for other sections
   */
  const isActive = (item: NavItem): boolean => {
    if (item.id === "overview") {
      // Exact match for overview (admin root)
      return pathname === `/${locale}/admin` || pathname === `/${locale}/admin/`;
    }
    // Prefix match for other sections
    return pathname.startsWith(item.href);
  };

  return (
    <aside
      className={cn(
        "w-64 bg-card border-e flex flex-col h-full",
        isRTL ? "border-l border-r-0" : "border-r border-l-0",
        className
      )}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold text-lg">{t.adminPanel}</span>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "hover:bg-accent/50 group",
                active && "bg-accent shadow-sm"
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  active ? item.bgColor : "bg-transparent group-hover:bg-muted"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    active ? item.color : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {item.labelKey}
              </span>
              {/* Active indicator */}
              {active && (
                <div
                  className={cn(
                    "w-1 h-4 rounded-full bg-primary",
                    isRTL ? "mr-auto" : "ml-auto"
                  )}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>← {isRTL ? "العودة للموقع" : "Back to Site"}</span>
        </Link>
      </div>
    </aside>
  );
}

/**
 * Get the current admin section from pathname
 * Utility function for determining active section
 */
export function getAdminSectionFromPath(pathname: string, locale: string): AdminSection {
  const basePath = `/${locale}/admin`;
  
  if (pathname === basePath || pathname === `${basePath}/`) {
    return "overview";
  }
  
  const sectionPath = pathname.replace(basePath, "").split("/")[1];
  
  const sectionMap: Record<string, AdminSection> = {
    blog: "blog",
    users: "users",
    errors: "errors",
    migrations: "migrations",
    health: "health",
    keys: "keys",
  };
  
  return sectionMap[sectionPath] || "overview";
}
