"use client";

import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import "@/styles/article-typography.css";

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
function transformCalloutBoxes(html: string): string {
  let transformedHtml = html;

  // 1. Transform callout boxes (pro-tip, warning, info, success, note)
  const calloutMap: Record<string, { color: string; iconType: string }> = {
    'pro-tip': { color: 'green', iconType: 'tip' },
    'tip': { color: 'green', iconType: 'tip' },
    'warning': { color: 'amber', iconType: 'warning' },
    'info': { color: 'blue', iconType: 'info' },
    'success': { color: 'green', iconType: 'tip' },
    'note': { color: 'gray', iconType: 'note' },
  };

  for (const [className, config] of Object.entries(calloutMap)) {
    // Use a more robust regex that handles nested content and various formats
    const regex = new RegExp(
      `<div\\s+class=["']${className}["']>([\\s\\S]*?)<\\/div>(?=\\s*(?:<div|<p|<h|$|\\n\\n|<\\/))`,
      'gi'
    );

    transformedHtml = transformedHtml.replace(regex, (_match, content) => {
      // Extract title from <strong> tag if present
      const titleMatch = content.match(/<strong>(.*?)<\/strong>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      
      // Remove the strong tag AND any surrounding whitespace/line breaks/paragraphs
      let mainContent = titleMatch 
        ? content.replace(/<strong>.*?<\/strong>/i, '')
        : content;
      
      // Clean up the content thoroughly
      mainContent = mainContent
        .replace(/^[\s\n\r]+/g, '')           // Remove leading whitespace
        .replace(/[\s\n\r]+$/g, '')           // Remove trailing whitespace
        .replace(/^(<br\s*\/?>)+/gi, '')      // Remove leading <br> tags
        .replace(/(<br\s*\/?>)+$/gi, '')      // Remove trailing <br> tags
        .replace(/^<p>\s*<\/p>/gi, '')        // Remove empty paragraphs
        .replace(/<p>\s*<\/p>$/gi, '')        // Remove trailing empty paragraphs
        .trim();
      
      // If content is wrapped in <p> tags, extract it
      const pMatch = mainContent.match(/^<p>([\s\S]*)<\/p>$/i);
      if (pMatch) {
        mainContent = pMatch[1].trim();
      }

      const colorClasses: Record<string, string> = {
        green: 'bg-green-500/10 border-green-600 dark:bg-green-500/15 dark:border-green-500',
        amber: 'bg-amber-500/10 border-amber-500 dark:bg-amber-500/15 dark:border-amber-400',
        blue: 'bg-blue-500/10 border-blue-500 dark:bg-blue-500/15 dark:border-blue-400',
        gray: 'bg-muted/50 border-muted-foreground/50 dark:bg-muted/30 dark:border-muted-foreground/40',
      };

      const iconColorClasses: Record<string, string> = {
        green: 'text-green-600 dark:text-green-500',
        amber: 'text-amber-600 dark:text-amber-400',
        blue: 'text-blue-600 dark:text-blue-400',
        gray: 'text-muted-foreground',
      };

      const titleColorClasses: Record<string, string> = {
        green: 'text-green-700 dark:text-green-400',
        amber: 'text-amber-700 dark:text-amber-300',
        blue: 'text-blue-700 dark:text-blue-300',
        gray: 'text-foreground',
      };

      return `
<div role="note" class="article-callout flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-lg my-6 border-l-4 rtl:border-l-0 rtl:border-r-4 ${colorClasses[config.color]}">
  <div class="flex-shrink-0 mt-0.5 ${iconColorClasses[config.color]}">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      ${getIconPath(config.iconType)}
    </svg>
  </div>
  <div class="flex-1 min-w-0">
    ${title ? `<p class="font-semibold mb-1.5 text-sm sm:text-base ${titleColorClasses[config.color]}">${title}</p>` : ''}
    <div class="text-sm sm:text-base text-foreground/90 leading-relaxed">${mainContent}</div>
  </div>
</div>`;
    });
  }

  // 2. Transform highlight-box (statistics boxes) - handle nested divs
  const highlightBoxRegex = /<div\s+class=["']highlight-box["']>\s*<div\s+class=["']highlight-box-title["']>(.*?)<\/div>\s*<div\s+class=["']highlight-box-value["']>(.*?)<\/div>\s*<div\s+class=["']highlight-box-description["']>(.*?)<\/div>\s*<\/div>/gi;
  
  transformedHtml = transformedHtml.replace(highlightBoxRegex, (_match, title, value, description) => {
    return `
<div class="highlight-box bg-primary/5 border border-primary/20 rounded-xl p-6 my-6 text-center">
  ${title ? `<div class="text-sm font-medium text-muted-foreground mb-2">${title}</div>` : ''}
  ${value ? `<div class="text-3xl sm:text-4xl font-bold text-primary mb-2">${value}</div>` : ''}
  ${description ? `<div class="text-sm text-muted-foreground">${description}</div>` : ''}
</div>`;
  });

  // 3. Transform steps (step-by-step guides) - handle nested structure
  const stepsRegex = /<div\s+class=["']steps["']>([\s\S]*?)<\/div>\s*(?=<(?:div class=["'](?!step)|p|h\d|$)|\n\n)/gi;
  
  transformedHtml = transformedHtml.replace(stepsRegex, (_match, content) => {
    // Extract individual steps with their content
    let stepIndex = 0;
    let stepsHtml = '';
    
    // Match each step div with its nested content - simplified pattern
    const stepPattern = /<div\s+class=["']step["']>\s*<div\s+class=["']step-title["']>(.*?)<\/div>([\s\S]*?)<\/div>/gi;
    let stepMatch;
    
    while ((stepMatch = stepPattern.exec(content)) !== null) {
      stepIndex++;
      const stepTitle = stepMatch[1] || `Step ${stepIndex}`;
      let stepDesc = stepMatch[2].trim();
      
      // Clean up the description - remove extra whitespace and line breaks
      stepDesc = stepDesc
        .replace(/^[\s\n\r]+/g, '')
        .replace(/[\s\n\r]+$/g, '')
        .replace(/^(<br\s*\/?>)+/gi, '')
        .replace(/(<br\s*\/?>)+$/gi, '')
        .trim();
      
      // If wrapped in <p> tags, extract content
      const pMatch = stepDesc.match(/^<p>([\s\S]*)<\/p>$/i);
      if (pMatch) {
        stepDesc = pMatch[1].trim();
      }
      
      stepsHtml += `
<div class="step flex gap-4 mb-6 last:mb-0">
  <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm">${stepIndex}</div>
  <div class="flex-1 pt-1">
    <div class="font-semibold text-foreground mb-2 text-base">${stepTitle}</div>
    <div class="text-muted-foreground text-sm leading-relaxed">${stepDesc}</div>
  </div>
</div>`;
    }

    if (stepsHtml) {
      return `
<div class="steps-container bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-6 sm:p-8 my-8 border border-border shadow-sm">
  <div class="flex items-center gap-2 mb-6">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary" aria-hidden="true">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
    <h3 class="font-bold text-lg text-foreground m-0">Step-by-Step Guide</h3>
  </div>
  ${stepsHtml}
</div>`;
    }
    return _match; // Return original if no steps found
  });

  // 4. Transform testimonial (customer quotes)
  transformedHtml = transformedHtml.replace(
    /<div\s+class=["']testimonial["']>([\s\S]*?)<\/div>(?=\s*(?:<div|<p|<h|$|\n\n))/gi,
    (_match, content) => {
      const citeMatch = content.match(/<cite>(.*?)<\/cite>/i);
      const cite = citeMatch ? citeMatch[1] : '';
      const quote = citeMatch 
        ? content.replace(/<cite>.*?<\/cite>/i, '').replace(/^["']|["']$/g, '').trim()
        : content.replace(/^["']|["']$/g, '').trim();

      return `
<div class="testimonial bg-muted/20 border-l-4 border-primary rounded-r-lg p-6 my-6 italic">
  <div class="flex gap-3">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="flex-shrink-0 text-primary/30" aria-hidden="true">
      <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z"/>
    </svg>
    <div class="flex-1">
      <p class="text-foreground/90 mb-3">${quote}</p>
      ${cite ? `<cite class="text-sm text-muted-foreground not-italic font-medium">— ${cite}</cite>` : ''}
    </div>
  </div>
</div>`;
    }
  );

  // 5. Transform key-takeaways (summary box) - handle nested structure
  const keyTakeawaysRegex = /<div\s+class=["']key-takeaways["']>\s*<div\s+class=["']key-takeaways-title["']>(.*?)<\/div>([\s\S]*?)<\/div>\s*(?=<(?:div|p|h\d)|$|\n\n)/gi;
  
  transformedHtml = transformedHtml.replace(keyTakeawaysRegex, (_match, title, listContent) => {
    const finalTitle = title || 'Key Takeaways';
    
    return `
<div class="key-takeaways bg-primary/5 border-2 border-primary/20 rounded-xl p-6 my-8">
  <div class="flex items-center gap-2 mb-4">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary" aria-hidden="true">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
    <h3 class="font-bold text-lg text-foreground m-0">${finalTitle}</h3>
  </div>
  <div class="key-takeaways-list [&>ul]:list-none [&>ul]:p-0 [&>ul]:m-0 [&>ul>li]:flex [&>ul>li]:gap-2 [&>ul>li]:mb-3 [&>ul>li]:last:mb-0 [&>ul>li]:before:content-['✓'] [&>ul>li]:before:text-primary [&>ul>li]:before:font-bold">
    ${listContent.trim()}
  </div>
</div>`;
  });

  // 6. Transform CTA box (Call to Action)
  const ctaBoxRegex = /<div\s+class=["']cta-box["']>\s*<div\s+class=["']cta-title["']>(.*?)<\/div>\s*<div\s+class=["']cta-content["']>([\s\S]*?)<\/div>\s*<\/div>/gi;
  
  transformedHtml = transformedHtml.replace(ctaBoxRegex, (_match, title, content) => {
    const finalTitle = title || '🚀 Ready to Get Started?';
    
    return `
<div class="cta-box relative bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-xl p-8 my-10 text-center overflow-hidden">
  <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50"></div>
  <h3 class="text-xl sm:text-2xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">${finalTitle}</h3>
  <div class="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">${content.trim()}</div>
</div>`;
  });

  return transformedHtml;
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
        
        // Transform special divs into styled callout boxes
        sanitizedHtml = transformCalloutBoxes(sanitizedHtml);
        
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
    <div className="w-full max-w-[680px] mx-auto px-4 sm:px-0">
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
