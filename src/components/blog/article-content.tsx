"use client";

import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import "@/lib/blog/article-generator/styles/index.css";

/**
 * ArticleContent Component
 * 
 * Professional article typography following best practices from:
 * - Medium, Substack, and top publishing platforms
 * - Modern CSS typography guidelines (2025)
 * - WCAG accessibility standards
 * 
 * Key features:
 * - Optimal line length (65-75 characters) for readability
 * - Fluid typography with clamp() for responsive sizing
 * - Proper vertical rhythm and spacing
 * - Enhanced heading hierarchy
 * - Beautiful blockquotes with SVG quote icons
 * - Custom list bullets with SVG styling
 * - Professional code blocks with syntax highlighting theme
 * - Drop caps for article start
 * - Full RTL/LTR support
 * 
 * Requirements: 1.1, 1.4, 1.5, 1.6, 1.7, 1.8, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 7.2
 */

export interface ArticleContentProps {
  content: string;
  /** Whether content is already HTML or needs Markdown parsing */
  isMarkdown?: boolean;
  /** Locale for RTL/LTR support */
  locale?: string;
}

// Configure marked for safe rendering with enhanced options
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Remove any emoji characters from content
 * Requirement: 4.1 - No emoji characters in article content
 */
function removeEmojis(text: string): string {
  // Comprehensive emoji regex covering all Unicode emoji ranges
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu;

  return text.replace(emojiRegex, '');
}

/**
 * Transform special div classes into styled components
 * Converts AI-generated HTML divs into properly styled elements
 * 
 * Supported classes:
 * - pro-tip, tip -> green tip callout
 * - warning -> amber warning callout
 * - info -> blue info callout
 * - success -> green success callout
 * - note -> gray note callout
 * - highlight-box -> statistics highlight box
 * - steps -> step-by-step guide
 * - testimonial -> customer quote
 * - key-takeaways -> summary box
 */
/**
 * Transform special div classes if needed
 * Note: Most styling is now handled directly by the external CSS files
 * for components like .pro-tip, .steps, .cta-box, etc.
 */
function applySanitizedTransformations(html: string): string {
  let transformedHtml = html;

  // We keep only the table transformation for responsiveness
  transformedHtml = transformTables(transformedHtml);

  return transformedHtml;
}


/**
 * Wrap tables in a responsive container
 */
function transformTables(html: string): string {
  return html.replace(
    /<table>([\s\S]*?)<\/table>/gi,
    '<div class="table-container"><table>$1</table></div>'
  );
}

/**
 * Get SVG path for callout icon type
 */
function getIconPath(type: string): string {
  const paths: Record<string, string> = {
    tip: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" />',
    warning: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />',
    info: '<circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />',
    note: '<path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />',
  };
  return paths[type] || paths.info;
}

export function ArticleContent({
  content,
  isMarkdown = true,
  locale = "en"
}: ArticleContentProps) {
  const articleRef = useRef<HTMLElement>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const isRTL = locale === "ar";

  // Parse markdown to HTML if needed - client-side only for DOMPurify
  useEffect(() => {
    const parseContent = async () => {
      // Remove emojis from content first
      const cleanContent = removeEmojis(content);
      const rawHtml = isMarkdown ? (marked.parse(cleanContent) as string) : cleanContent;

      // Dynamic import DOMPurify only on client side
      if (typeof window !== 'undefined') {
        const DOMPurify = (await import('dompurify')).default;
        let sanitizedHtml = DOMPurify.sanitize(rawHtml, {
          ALLOWED_TAGS: [
            'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li',
            'blockquote', 'cite', 'footer',
            'pre', 'code',
            'em', 'strong', 'del', 'ins',
            'a', 'img', 'figure', 'figcaption',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'hr', 'br', 'span', 'div',
            'sup', 'sub', 'mark'
          ],
          ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title', 'class', 'id',
            'target', 'rel', 'width', 'height',
            'colspan', 'rowspan', 'scope'
          ],
        });

        // Transform special divs and tables
        sanitizedHtml = applySanitizedTransformations(sanitizedHtml);

        setHtmlContent(sanitizedHtml);
      } else {
        setHtmlContent(rawHtml);
      }
    };

    parseContent();
  }, [content, isMarkdown]);

  // Apply drop cap styling after content is rendered
  useEffect(() => {
    if (!articleRef.current || !htmlContent) return;

    // Find the first paragraph that has actual text content
    const paragraphs = articleRef.current.querySelectorAll('p');

    for (const p of paragraphs) {
      // Skip empty paragraphs or those inside callouts
      if (p.textContent && p.textContent.trim().length > 0 && !p.closest('.article-callout')) {
        // Add a class to ensure drop cap is applied
        p.classList.add('has-drop-cap');
        break; // Only apply to first valid paragraph
      }
    }
  }, [htmlContent]);

  return (
    <div className="w-full max-w-[820px] mx-auto px-4 sm:px-6 overflow-hidden">
      {/* Article content with professional typography */}
      <article
        ref={articleRef}
        dir={isRTL ? "rtl" : "ltr"}
        className="article-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        role="article"
        aria-label={isRTL ? "محتوى المقال" : "Article content"}
      />
    </div>
  );
}
