"use client";

/**
 * User Manager Component
 * 
 * Admin component for managing platform users with:
 * - User list with pagination
 * - Search input
 * - User statistics cards
 * - User detail modal
 * - Confirm email action
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  RefreshCw,
  AlertCircle,
  Mail,
  MailCheck,
  Calendar,
  Clock,
  Calculator,
  UserCheck,
  UserPlus,
  UserX,
  X,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ============================================================================
// Types
// ============================================================================

interface UserListItem {
  id: string;
  email: string;
  emailConfirmed: boolean;
  createdAt: string;
  lastSignIn: string | null;
  calculationCount: number;
  name?: string | null;
  image?: string | null;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  unconfirmedUsers: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface UserManagerProps {
  locale: string;
}

// ============================================================================
// Translations
// ============================================================================

function getTranslations(isRTL: boolean) {
  return {
    title: isRTL ? "إدارة المستخدمين" : "User Manager",
    subtitle: isRTL ? "عرض وإدارة مستخدمي المنصة" : "View and manage platform users",
    
    // Search
    search: isRTL ? "بحث بالبريد الإلكتروني..." : "Search by email...",
    
    // Actions
    actions: {
      refresh: isRTL ? "تحديث" : "Refresh",
      confirmEmail: isRTL ? "تأكيد البريد" : "Confirm Email",
      viewDetails: isRTL ? "عرض التفاصيل" : "View Details",
      close: isRTL ? "إغلاق" : "Close",
    },
    
    // Stats
    stats: {
      totalUsers: isRTL ? "إجمالي المستخدمين" : "Total Users",
      activeUsers: isRTL ? "المستخدمون النشطون" : "Active Users",
      newThisMonth: isRTL ? "جدد هذا الشهر" : "New This Month",
      unconfirmed: isRTL ? "غير مؤكدين" : "Unconfirmed",
    },
    
    // Table
    table: {
      user: isRTL ? "المستخدم" : "User",
      email: isRTL ? "البريد الإلكتروني" : "Email",
      status: isRTL ? "الحالة" : "Status",
      registered: isRTL ? "تاريخ التسجيل" : "Registered",
      lastSignIn: isRTL ? "آخر تسجيل دخول" : "Last Sign In",
      calculations: isRTL ? "الحسابات" : "Calculations",
      actions: isRTL ? "الإجراءات" : "Actions",
    },
    
    // Status
    status: {
      confirmed: isRTL ? "مؤكد" : "Confirmed",
      unconfirmed: isRTL ? "غير مؤكد" : "Unconfirmed",
      active: isRTL ? "نشط" : "Active",
      inactive: isRTL ? "غير نشط" : "Inactive",
    },
    
    // States
    states: {
      loading: isRTL ? "جاري التحميل..." : "Loading...",
      error: isRTL ? "حدث خطأ" : "An error occurred",
      noUsers: isRTL ? "لا يوجد مستخدمون" : "No users found",
      retry: isRTL ? "إعادة المحاولة" : "Retry",
      confirming: isRTL ? "جاري التأكيد..." : "Confirming...",
    },
    
    // Modal
    modal: {
      userDetails: isRTL ? "تفاصيل المستخدم" : "User Details",
      userId: isRTL ? "معرف المستخدم" : "User ID",
      emailStatus: isRTL ? "حالة البريد" : "Email Status",
      registrationDate: isRTL ? "تاريخ التسجيل" : "Registration Date",
      lastActivity: isRTL ? "آخر نشاط" : "Last Activity",
      totalCalculations: isRTL ? "إجمالي الحسابات" : "Total Calculations",
      never: isRTL ? "لم يسجل دخول بعد" : "Never signed in",
    },
    
    // Pagination
    page: isRTL ? "صفحة" : "Page",
    of: isRTL ? "من" : "of",
    previous: isRTL ? "السابق" : "Previous",
    next: isRTL ? "التالي" : "Next",
    
    // Messages
    messages: {
      emailConfirmed: isRTL ? "تم تأكيد البريد الإلكتروني بنجاح" : "Email confirmed successfully",
      confirmFailed: isRTL ? "فشل تأكيد البريد الإلكتروني" : "Failed to confirm email",
    },
  };
}

// ============================================================================
// Component
// ============================================================================

export function UserManager({ locale }: UserManagerProps) {
  const isRTL = locale === "ar";
  const t = getTranslations(isRTL);

  // State
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState<string | null>(null);
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  
  // Modal
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch users");
      }

      setUsers(result.data.users.items);
      setTotal(result.data.users.total);
      setTotalPages(result.data.users.totalPages);
      setStats(result.data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle confirm email
  const handleConfirmEmail = async (user: UserListItem) => {
    if (user.emailConfirmed) return;
    
    setIsConfirming(user.id);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: user.id,
          action: "confirm_email",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || t.messages.confirmFailed);
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, emailConfirmed: true } : u
        )
      );
      
      // Update stats
      if (stats) {
        setStats({
          ...stats,
          unconfirmedUsers: Math.max(0, stats.unconfirmedUsers - 1),
        });
      }
      
      // Update selected user if modal is open
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, emailConfirmed: true });
      }

      alert(t.messages.emailConfirmed);
    } catch (err) {
      alert(err instanceof Error ? err.message : t.messages.confirmFailed);
    } finally {
      setIsConfirming(null);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return t.modal.never;
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return isRTL ? "اليوم" : "Today";
    if (diffDays === 1) return isRTL ? "أمس" : "Yesterday";
    if (diffDays < 7) return isRTL ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;
    if (diffDays < 30) return isRTL ? `منذ ${Math.floor(diffDays / 7)} أسابيع` : `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateStr);
  };

  // Check if user is active (signed in within last 30 days)
  const isUserActive = (lastSignIn: string | null) => {
    if (!lastSignIn) return false;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return new Date(lastSignIn) >= thirtyDaysAgo;
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {t.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers}>
          <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
          {t.actions.refresh}
        </Button>
      </div>

      {/* Stats Cards - Requirement 4.5 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">{t.stats.totalUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-green-500/10">
                  <UserCheck className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
              <p className="text-xs text-muted-foreground">{t.stats.activeUsers}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10">
                  <UserPlus className="h-4 w-4 text-purple-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-600">{stats.newUsersThisMonth}</p>
              <p className="text-xs text-muted-foreground">{t.stats.newThisMonth}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <UserX className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600">{stats.unconfirmedUsers}</p>
              <p className="text-xs text-muted-foreground">{t.stats.unconfirmed}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search - Requirement 4.2 */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={isRTL ? "pr-10" : "pl-10"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List - Requirement 4.1 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t.table.user}</CardTitle>
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
              <Button onClick={fetchUsers} variant="outline">
                <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {t.states.retry}
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">{t.states.noUsers}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedUser(user)}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-primary">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{user.name || user.email}</p>
                      {user.emailConfirmed ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          <MailCheck className="h-3 w-3 mr-1" />
                          {t.status.confirmed}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                          <Mail className="h-3 w-3 mr-1" />
                          {t.status.unconfirmed}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(user.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(user.lastSignIn)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calculator className="h-3 w-3" />
                        {user.calculationCount}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!user.emailConfirmed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmEmail(user);
                        }}
                        disabled={isConfirming === user.id}
                      >
                        {isConfirming === user.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                            {t.actions.confirmEmail}
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(user);
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
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

      {/* User Detail Modal - Requirement 4.3 */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedUser(null)}
          />
          
          {/* Modal */}
          <Card className="relative z-10 w-full max-w-md mx-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{t.modal.userDetails}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedUser(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Avatar and Name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {selectedUser.image ? (
                    <img
                      src={selectedUser.image}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-medium text-primary">
                      {selectedUser.email.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {selectedUser.name || selectedUser.email.split("@")[0]}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t.modal.userId}</span>
                  <span className="text-sm font-mono truncate max-w-[200px]">{selectedUser.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t.modal.emailStatus}</span>
                  {selectedUser.emailConfirmed ? (
                    <Badge variant="default" className="bg-green-500/10 text-green-600">
                      <MailCheck className="h-3 w-3 mr-1" />
                      {t.status.confirmed}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                      <Mail className="h-3 w-3 mr-1" />
                      {t.status.unconfirmed}
                    </Badge>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t.modal.registrationDate}</span>
                  <span className="text-sm">{formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t.modal.lastActivity}</span>
                  <span className="text-sm">
                    {selectedUser.lastSignIn ? formatDate(selectedUser.lastSignIn) : t.modal.never}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t.modal.totalCalculations}</span>
                  <span className="text-sm font-medium">{selectedUser.calculationCount}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {!selectedUser.emailConfirmed && (
                  <Button
                    className="flex-1"
                    onClick={() => handleConfirmEmail(selectedUser)}
                    disabled={isConfirming === selectedUser.id}
                  >
                    {isConfirming === selectedUser.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {t.actions.confirmEmail}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className={selectedUser.emailConfirmed ? "flex-1" : ""}
                  onClick={() => setSelectedUser(null)}
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

export default UserManager;
