"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Twitter, Linkedin, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

/**
 * ArticleShare Component
 * 
 * Provides share buttons for Twitter, LinkedIn, and copy link functionality.
 * Shows toast confirmation when link is copied.
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

interface ArticleShareProps {
  title: string;
  slug: string;
  summary: string;
}

export function ArticleShare({ title, slug, summary }: ArticleShareProps) {
  const t = useTranslations("blog");
  const [copied, setCopied] = useState(false);

  // Get the full article URL
  const getArticleUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${window.location.pathname}`;
    }
    return "";
  };

  const articleUrl = getArticleUrl();
  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(title);

  // Share on Twitter
  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer,width=550,height=420");
  };

  // Share on LinkedIn
  const shareOnLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    window.open(linkedInUrl, "_blank", "noopener,noreferrer,width=550,height=420");
  };

  // Copy link to clipboard
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      toast.success(t("linkCopied"));
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error(t("linkCopyFailed"));
    }
  };

  return (
    <Card className="w-full max-w-[720px] mx-auto border-2">
      <CardHeader>
        <CardTitle className="text-xl font-bold" id="share-section-title">
          {t("shareArticle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          className="flex flex-wrap gap-3"
          role="group"
          aria-labelledby="share-section-title"
        >
          {/* Twitter Share Button */}
          <Button
            onClick={shareOnTwitter}
            variant="outline"
            className="flex items-center gap-2 hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2] transition-colors focus-visible:ring-2 focus-visible:ring-[#1DA1F2] focus-visible:ring-offset-2"
            aria-label={t("shareOnTwitter", { title })}
          >
            <Twitter className="w-4 h-4" aria-hidden="true" />
            <span>Twitter</span>
          </Button>

          {/* LinkedIn Share Button */}
          <Button
            onClick={shareOnLinkedIn}
            variant="outline"
            className="flex items-center gap-2 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-colors focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-2"
            aria-label={t("shareOnLinkedIn", { title })}
          >
            <Linkedin className="w-4 h-4" aria-hidden="true" />
            <span>LinkedIn</span>
          </Button>

          {/* Copy Link Button */}
          <Button
            onClick={copyLink}
            variant="outline"
            className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={copied ? t("linkCopied") : t("copyArticleLink")}
            aria-live="polite"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>{t("copied")}</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" aria-hidden="true" />
                <span>{t("copyLink")}</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
