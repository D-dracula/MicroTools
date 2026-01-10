"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { History, Trash2, Calculator, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Calculation {
  id: string;
  toolSlug: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  createdAt: string;
}

interface PaginatedResponse {
  items: Calculation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/auth/login`);
    }
  }, [status, router, locale]);

  // Fetch calculations
  const fetchCalculations = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/calculations?page=${page}&pageSize=10`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch calculations");
      }
      
      if (data.success) {
        const paginatedData = data.data as PaginatedResponse;
        setCalculations(paginatedData.items);
        setPagination({
          page: paginatedData.page,
          totalPages: paginatedData.totalPages,
          total: paginatedData.total,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchCalculations();
    }
  }, [status]);

  // Delete calculation
  const handleDelete = async (id: string) => {
    try {
      setDeleting(id);
      
      const response = await fetch(`/api/calculations/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete calculation");
      }
      
      if (data.success) {
        setCalculations((prev) => prev.filter((calc) => calc.id !== id));
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
        toast.success(t("common.delete"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setDeleting(null);
    }
  };

  // Format date based on locale
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get tool title based on slug
  const getToolTitle = (slug: string) => {
    if (slug === "profit-margin-calculator") {
      return t("tools.profitMarginCalculator.title");
    }
    return slug;
  };

  // Render calculation details based on tool type
  const renderCalculationDetails = (calc: Calculation) => {
    if (calc.toolSlug === "profit-margin-calculator") {
      const inputs = calc.inputs as { costPrice: number; sellingPrice: number };
      const outputs = calc.outputs as {
        profit: number;
        profitMargin: number;
        markup: number;
        isLoss: boolean;
      };
      
      return (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t("tools.profitMarginCalculator.costPrice")}:</span>
            <span className="ms-2 font-medium">{inputs.costPrice}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("tools.profitMarginCalculator.sellingPrice")}:</span>
            <span className="ms-2 font-medium">{inputs.sellingPrice}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("tools.profitMarginCalculator.profit")}:</span>
            <span className={`ms-2 font-medium ${outputs.isLoss ? "text-red-500" : "text-green-500"}`}>
              {outputs.profit.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("tools.profitMarginCalculator.profitMargin")}:</span>
            <span className={`ms-2 font-medium ${outputs.isLoss ? "text-red-500" : "text-green-500"}`}>
              {outputs.profitMargin.toFixed(2)}%
            </span>
          </div>
        </div>
      );
    }
    
    return (
      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
        {JSON.stringify({ inputs: calc.inputs, outputs: calc.outputs }, null, 2)}
      </pre>
    );
  };

  // Loading state
  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="container mx-auto max-w-4xl py-12 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">
          {session?.user?.email}
        </p>
      </header>

      {/* Calculation History */}
      <section aria-labelledby="history-title">
        <Card>
          <CardHeader>
            <CardTitle id="history-title" className="flex items-center gap-2">
              <History className="h-5 w-5" aria-hidden="true" />
              {t("dashboard.history")}
              {pagination.total > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({pagination.total})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="flex items-center gap-2 text-destructive py-8 justify-center" role="alert">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : calculations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                <p>{t("dashboard.noCalculations")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {calculations.map((calc) => (
                  <article
                    key={calc.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{getToolTitle(calc.toolSlug)}</h3>
                        <p className="text-xs text-muted-foreground">
                          <time dateTime={calc.createdAt}>
                            {t("dashboard.savedOn")} {formatDate(calc.createdAt)}
                          </time>
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(calc.id)}
                        disabled={deleting === calc.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label={t("common.delete")}
                      >
                        {deleting === calc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                    {renderCalculationDetails(calc)}
                  </article>
                ))}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <nav className="flex justify-center gap-2 pt-4" aria-label="Pagination">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchCalculations(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      aria-label={locale === "ar" ? "الصفحة السابقة" : "Previous page"}
                    >
                      {locale === "ar" ? "السابق" : "Previous"}
                    </Button>
                    <span className="flex items-center px-3 text-sm text-muted-foreground" aria-current="page">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchCalculations(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      aria-label={locale === "ar" ? "الصفحة التالية" : "Next page"}
                    >
                      {locale === "ar" ? "التالي" : "Next"}
                    </Button>
                  </nav>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
