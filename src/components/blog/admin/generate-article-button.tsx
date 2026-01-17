"use client";

/**
 * Generate Article Button Component
 * 
 * Admin-only button that opens a dialog to generate new blog articles using AI.
 * 
 * Requirements: 2.1
 * - Button visible only to admins
 * - Opens generation dialog
 */

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, X } from "lucide-react";
import { GenerationProgress } from "./generation-progress";
import type { Article, GenerationProgress as GenerationProgressType } from "@/lib/blog/types";

interface GenerateArticleButtonProps {
  /** Callback when article is successfully generated */
  onArticleGenerated?: (article: Partial<Article>) => void;
  /** Optional class name for styling */
  className?: string;
}

interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  generatedToday: number;
  dailyLimit: number;
  resetAt: string;
}

export function GenerateArticleButton({ 
  onArticleGenerated,
  className 
}: GenerateArticleButtonProps) {
  const { data: session, status } = useSession();
  const t = useTranslations("blog");
  
  // State
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgressType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
  
  // Refs for focus management
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);

  // Check if user is admin
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      // Check admin status via API
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [session, status]);

  // Focus management when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      // Focus the API key input when dialog opens
      setTimeout(() => {
        apiKeyInputRef.current?.focus();
      }, 100);
    }
  }, [isDialogOpen]);

  // Handle escape key to close dialog
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDialogOpen && !isGenerating) {
        handleDialogClose();
      }
    };

    if (isDialogOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isDialogOpen, isGenerating]);

  // Check admin status and rate limit
  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/blog/generate");
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsAdmin(true);
          setRateLimitStatus(data.data);
        }
      } else if (response.status === 403) {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Failed to check admin status:", error);
      setIsAdmin(false);
    }
  };

  // Handle generate button click
  const handleGenerateClick = () => {
    setIsDialogOpen(true);
    setError(null);
    setProgress(null);
    
    // Load saved API key from localStorage
    const savedKey = localStorage.getItem("openrouter_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    if (!isGenerating) {
      setIsDialogOpen(false);
      setError(null);
      setProgress(null);
    }
  };

  // Handle article generation
  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError(t("admin.apiKeyRequired"));
      return;
    }

    // Save API key to localStorage
    localStorage.setItem("openrouter_api_key", apiKey);

    setIsGenerating(true);
    setError(null);
    setProgress({
      status: "searching",
      message: t("admin.progress.searching"),
      progress: 10,
    });

    try {
      const response = await fetch("/api/blog/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to generate article");
      }

      // Success
      setProgress({
        status: "complete",
        message: t("admin.progress.complete"),
        progress: 100,
      });

      // Notify parent component
      if (onArticleGenerated && data.data?.article) {
        onArticleGenerated(data.data.article);
      }

      // Refresh rate limit status
      await checkAdminStatus();

      // Close dialog after a short delay
      setTimeout(() => {
        setIsDialogOpen(false);
        setProgress(null);
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      setProgress({
        status: "error",
        message: errorMessage,
        progress: 0,
        error: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setError(null);
    setProgress(null);
    handleGenerate();
  };

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      {/* Generate Button */}
      <Button
        onClick={handleGenerateClick}
        className={className}
        variant="default"
        disabled={rateLimitStatus ? !rateLimitStatus.allowed : false}
        aria-haspopup="dialog"
        aria-expanded={isDialogOpen}
      >
        <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
        {t("admin.generateArticle")}
      </Button>

      {/* Generation Dialog */}
      {isDialogOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="generate-dialog-title"
          ref={dialogRef}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleDialogClose}
            aria-hidden="true"
          />
          
          {/* Dialog */}
          <div className="relative bg-background border rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 
                id="generate-dialog-title"
                className="text-lg font-semibold flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
                {t("admin.generateArticle")}
              </h2>
              {!isGenerating && (
                <button
                  ref={closeButtonRef}
                  onClick={handleDialogClose}
                  className="text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md p-1"
                  aria-label={t("admin.closeDialog")}
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Content */}
            {!progress ? (
              <div className="space-y-4">
                {/* API Key Input */}
                <div>
                  <label 
                    htmlFor="api-key-input"
                    className="block text-sm font-medium mb-2"
                  >
                    {t("admin.apiKeyLabel")}
                  </label>
                  <input
                    ref={apiKeyInputRef}
                    id="api-key-input"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={t("admin.apiKeyPlaceholder")}
                    className="w-full px-3 py-2 border rounded-md bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    disabled={isGenerating}
                    aria-describedby="api-key-hint"
                    autoComplete="off"
                  />
                  <p id="api-key-hint" className="text-xs text-muted-foreground mt-1">
                    {t("admin.apiKeyHint")}
                  </p>
                </div>

                {/* Rate Limit Info */}
                {rateLimitStatus && (
                  <div 
                    className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3"
                    role="status"
                    aria-live="polite"
                  >
                    <p>
                      {t("admin.rateLimitInfo", {
                        remaining: rateLimitStatus.remaining,
                        limit: rateLimitStatus.dailyLimit,
                      })}
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div 
                    className="text-sm text-destructive bg-destructive/10 rounded-md p-3"
                    role="alert"
                    aria-live="assertive"
                  >
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDialogClose}
                    disabled={isGenerating}
                  >
                    {t("admin.cancel")}
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !apiKey.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                        {t("admin.generating")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                        {t("admin.generate")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <GenerationProgress
                progress={progress}
                onRetry={handleRetry}
                onClose={handleDialogClose}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
