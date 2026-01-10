"use client";

import { forwardRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

interface ResultItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface ResultCardProps {
  toolName: string;
  inputs: Record<string, ResultItem | undefined>;
  outputs: Record<string, ResultItem | undefined>;
}

/**
 * Result Card Component
 * Displays calculation results in a clean, branded format suitable for sharing
 * Requirements: 1.10, 1.11, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.10
 */
export const ResultCard = forwardRef<HTMLDivElement, ResultCardProps>(
  function ResultCard({ toolName, inputs, outputs }, ref) {
    const t = useTranslations("common");
    const shareT = useTranslations("share");
    const locale = useLocale();
    const isRTL = locale === "ar";

    // Format timestamp
    const timestamp = new Date().toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div
        ref={ref}
        className="w-full max-w-md mx-auto"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <Card className="bg-gradient-to-br from-background to-muted border-2 shadow-lg">
          {/* Header with branding - Requirement 1.11, 13.5 */}
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calculator className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-lg">{toolName}</CardTitle>
                  <p className="text-xs text-muted-foreground">{t("siteName")}</p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            {/* Inputs Section - Requirement 13.3 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {isRTL ? "المدخلات" : "Inputs"}
              </h4>
              <div className="grid gap-2">
                {Object.entries(inputs).filter(([, item]) => item !== undefined).map(([key, item]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center py-1 px-3 rounded bg-muted/50"
                  >
                    <span className="text-sm text-muted-foreground">{item!.label}</span>
                    <span className="text-sm font-medium">{item!.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Outputs Section - Requirement 13.4 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                {isRTL ? "النتائج" : "Results"}
              </h4>
              <div className="grid gap-2">
                {Object.entries(outputs).filter(([, item]) => item !== undefined).map(([key, item]) => (
                  <div
                    key={key}
                    className={`flex justify-between items-center py-2 px-3 rounded ${
                      item!.highlight
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-muted/50"
                    }`}
                  >
                    <span className="text-sm text-muted-foreground">{item!.label}</span>
                    <span
                      className={`text-sm font-bold ${
                        item!.highlight ? "text-primary" : ""
                      }`}
                    >
                      {item!.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timestamp - Requirement 13.6 */}
            <div className="pt-3 border-t text-center">
              <p className="text-xs text-muted-foreground">
                {shareT("calculatedOn")}: {timestamp}
              </p>
              <p className="text-xs text-primary mt-1">{shareT("poweredBy")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);
