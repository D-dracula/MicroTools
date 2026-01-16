"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { List, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  /** CSS selector for the article content container */
  contentSelector?: string;
  /** Locale for translations */
  locale?: string;
}

/**
 * TableOfContents Component
 * 
 * Automatically generates a table of contents from article headings.
 * Features:
 * - Auto-extracts h2 and h3 headings
 * - Highlights current section while scrolling
 * - Smooth scroll to sections
 * - Collapsible on mobile
 * - RTL support
 */
export function TableOfContents({ 
  contentSelector = "article",
  locale = "en"
}: TableOfContentsProps) {
  const t = useTranslations("blog");
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);
  const isRTL = locale === "ar";

  // Extract headings from article content
  useEffect(() => {
    const article = document.querySelector(contentSelector);
    if (!article) return;

    const elements = article.querySelectorAll("h2, h3");
    const items: TOCItem[] = [];

    elements.forEach((el, index) => {
      // Generate ID if not present
      if (!el.id) {
        el.id = `heading-${index}`;
      }

      items.push({
        id: el.id,
        text: el.textContent || "",
        level: el.tagName === "H2" ? 2 : 3,
      });
    });

    setHeadings(items);
  }, [contentSelector]);

  // Track active heading while scrolling
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0% -35% 0%",
        threshold: 0,
      }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  // Smooth scroll to heading
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
    setIsExpanded(false);
  };

  if (headings.length < 2) return null;

  return (
    <nav 
      className="bg-muted/30 rounded-lg border p-4"
      aria-label={t("tableOfContents") || "Table of Contents"}
    >
      {/* Header - Clickable on mobile */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full md:cursor-default"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <List className="w-4 h-4" aria-hidden="true" />
          <span>{t("tableOfContents") || "Table of Contents"}</span>
        </div>
        <ChevronRight 
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform md:hidden",
            isExpanded && "rotate-90"
          )} 
          aria-hidden="true"
        />
      </button>

      {/* TOC List */}
      <ul 
        className={cn(
          "mt-3 space-y-1 overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 md:max-h-[500px] md:opacity-100"
        )}
        role="list"
      >
        {headings.map((heading) => (
          <li key={heading.id}>
            <button
              onClick={() => scrollToHeading(heading.id)}
              className={cn(
                "w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors",
                "hover:bg-primary/10 hover:text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                heading.level === 3 && (isRTL ? "pr-4" : "pl-4"),
                activeId === heading.id 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground"
              )}
              aria-current={activeId === heading.id ? "location" : undefined}
            >
              {heading.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
