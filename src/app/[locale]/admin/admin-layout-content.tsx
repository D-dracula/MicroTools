"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert, ShieldX } from "lucide-react";
import { useAdminAuth } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

interface AdminLayoutContentProps {
  children: React.ReactNode;
  locale: string;
}

/**
 * Admin Layout Content Component
 * 
 * Handles client-side authentication and authorization for admin pages.
 * - Verifies user is authenticated via NextAuth session
 * - Verifies user's email is in ADMIN_EMAILS environment variable
 * - Redirects unauthenticated users to login
 * - Shows unauthorized message for non-admin users
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export function AdminLayoutContent({ children, locale }: AdminLayoutContentProps) {
  const router = useRouter();
  const { isAdmin, isLoading, user, error } = useAdminAuth();
  
  const isRTL = locale === "ar";
  
  // Translations
  const t = {
    loading: isRTL ? "جاري التحقق من الصلاحيات..." : "Verifying permissions...",
    unauthorized: isRTL ? "غير مصرح" : "Unauthorized",
    unauthorizedMessage: isRTL 
      ? "ليس لديك صلاحية للوصول إلى لوحة الإدارة. يرجى تسجيل الدخول بحساب مسؤول."
      : "You don't have permission to access the admin dashboard. Please sign in with an admin account.",
    notAuthenticated: isRTL ? "غير مسجل الدخول" : "Not Authenticated",
    notAuthenticatedMessage: isRTL
      ? "يرجى تسجيل الدخول للوصول إلى لوحة الإدارة."
      : "Please sign in to access the admin dashboard.",
    goToLogin: isRTL ? "تسجيل الدخول" : "Sign In",
    goHome: isRTL ? "العودة للرئيسية" : "Go Home",
  };
  
  // Redirect unauthenticated users to login (Requirement 1.3)
  useEffect(() => {
    if (!isLoading && error === "not_authenticated") {
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/${locale}/auth/login?callbackUrl=${returnUrl}`);
    }
  }, [isLoading, error, router, locale]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }
  
  // Not authenticated - show message while redirecting (Requirement 1.3)
  if (error === "not_authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <ShieldAlert className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <CardTitle>{t.notAuthenticated}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{t.notAuthenticatedMessage}</p>
            <Button 
              onClick={() => router.push(`/${locale}/auth/login`)}
              className="w-full"
            >
              {t.goToLogin}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Not authorized - show unauthorized message (Requirement 1.4)
  if (error === "not_authorized" || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <ShieldX className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle>{t.unauthorized}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{t.unauthorizedMessage}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline"
                onClick={() => router.push(`/${locale}`)}
                className="flex-1"
              >
                {t.goHome}
              </Button>
              <Button 
                onClick={() => router.push(`/${locale}/auth/login`)}
                className="flex-1"
              >
                {t.goToLogin}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // User is admin - render children with sidebar and header
  return (
    <div className="min-h-screen bg-muted/30 flex" dir={isRTL ? "rtl" : "ltr"}>
      {/* Sidebar Navigation (Requirement 2.1, 2.2, 2.3) */}
      <AdminSidebar locale={locale} className="fixed h-screen" />
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${isRTL ? "mr-64" : "ml-64"}`}>
        {/* Header with section title and admin info (Requirement 1.5, 2.5) */}
        <AdminHeader
          locale={locale}
          user={{
            email: user?.email || "",
            name: user?.name,
            role: "admin",
          }}
          className="sticky top-0 z-10"
        />
        
        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
