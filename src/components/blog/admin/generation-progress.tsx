"use client";

/**
 * Generation Progress Component
 * 
 * Displays progress steps during article generation with visual feedback.
 * 
 * Requirements: 8.2, 8.3, 8.5
 * - Display progress steps (searching, selecting, generating, saving)
 * - Show error state with retry option
 * - Notify admin when Exa search returns no results
 */

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Target, 
  FileText, 
  Image, 
  Save, 
  CheckCircle2, 
  XCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import type { GenerationProgress as GenerationProgressType, GenerationStatus } from "@/lib/blog/types";

interface GenerationProgressProps {
  /** Current progress state */
  progress: GenerationProgressType;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Callback when close is clicked (only available on error/complete) */
  onClose?: () => void;
}

/** Progress step configuration */
interface ProgressStep {
  id: GenerationStatus;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}

const PROGRESS_STEPS: ProgressStep[] = [
  { id: "searching", icon: Search, labelKey: "searching" },
  { id: "selecting", icon: Target, labelKey: "selecting" },
  { id: "generating", icon: FileText, labelKey: "generating" },
  { id: "creating-thumbnail", icon: Image, labelKey: "creatingThumbnail" },
  { id: "saving", icon: Save, labelKey: "saving" },
];

/** Get step index for a given status */
function getStepIndex(status: GenerationStatus): number {
  const index = PROGRESS_STEPS.findIndex(step => step.id === status);
  return index >= 0 ? index : -1;
}

export function GenerationProgress({ 
  progress, 
  onRetry, 
  onClose 
}: GenerationProgressProps) {
  const t = useTranslations("blog.admin.progress");
  
  const currentStepIndex = getStepIndex(progress.status);
  const isComplete = progress.status === "complete";
  const isError = progress.status === "error";

  return (
    <div 
      className="space-y-6"
      role="region"
      aria-label={t("generationProgress")}
      aria-live="polite"
    >
      {/* Progress Steps */}
      <ol className="space-y-3" aria-label={t("steps")}>
        {PROGRESS_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStepIndex && !isComplete && !isError;
          const isCompleted = index < currentStepIndex || isComplete;
          
          return (
            <li
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive 
                  ? "bg-primary/10 border border-primary/20" 
                  : isCompleted 
                    ? "bg-green-500/10 border border-green-500/20" 
                    : "bg-muted/50 border border-transparent"
              }`}
              aria-current={isActive ? "step" : undefined}
            >
              {/* Step Icon */}
              <div 
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : isCompleted 
                      ? "bg-green-500 text-white" 
                      : "bg-muted text-muted-foreground"
                }`}
                aria-hidden="true"
              >
                {isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              
              {/* Step Label */}
              <span className={`text-sm font-medium ${
                isActive 
                  ? "text-primary" 
                  : isCompleted 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-muted-foreground"
              }`}>
                {t(step.labelKey)}
                {isActive && <span className="sr-only"> - {t("inProgress")}</span>}
                {isCompleted && <span className="sr-only"> - {t("completed")}</span>}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div 
          className="h-2 bg-muted rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progress.progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("overallProgress")}
        >
          <div 
            className={`h-full transition-all duration-500 ${
              isError 
                ? "bg-destructive" 
                : isComplete 
                  ? "bg-green-500" 
                  : "bg-primary"
            }`}
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        <p 
          className="text-sm text-muted-foreground text-center"
          aria-live="polite"
        >
          {progress.message}
        </p>
      </div>

      {/* Complete State */}
      {isComplete && (
        <div 
          className="flex flex-col items-center gap-4 py-4"
          role="status"
          aria-live="polite"
        >
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" aria-hidden="true" />
          </div>
          <p className="text-lg font-medium text-green-600 dark:text-green-400">
            {t("complete")}
          </p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="space-y-4" role="alert" aria-live="assertive">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-destructive">
                {t("error")}
              </p>
              {progress.error && (
                <p className="text-sm text-muted-foreground mt-1">
                  {progress.error}
                </p>
              )}
            </div>
          </div>

          {/* Error Actions */}
          <div className="flex justify-center gap-2">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                {t("close")}
              </Button>
            )}
            {onRetry && (
              <Button onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                {t("retry")}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
