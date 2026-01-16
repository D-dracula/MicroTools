/**
 * Article Callout Component
 *
 * A highlighted content block used to draw attention to tips, warnings,
 * or important information in blog articles. Supports four types:
 * tip, warning, info, and note - each with distinct styling.
 *
 * @requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { TipIcon, WarningIcon, InfoIcon, NoteIcon } from "./article-icons";

type CalloutType = "tip" | "warning" | "info" | "note";

interface ArticleCalloutProps {
  /** The type of callout which determines styling and icon */
  type: CalloutType;
  /** Optional title displayed above the content */
  title?: string;
  /** The callout content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Icon component mapping for each callout type
 */
const iconMap = {
  tip: TipIcon,
  warning: WarningIcon,
  info: InfoIcon,
  note: NoteIcon,
} as const;

/**
 * Styling configuration for each callout type
 * Uses Tailwind CSS classes with HSL colors for consistency
 */
const styleMap = {
  tip: {
    container:
      "bg-green-500/10 border-green-600 dark:bg-green-500/15 dark:border-green-500",
    icon: "text-green-600 dark:text-green-500",
    title: "text-green-700 dark:text-green-400",
  },
  warning: {
    container:
      "bg-amber-500/10 border-amber-500 dark:bg-amber-500/15 dark:border-amber-400",
    icon: "text-amber-600 dark:text-amber-400",
    title: "text-amber-700 dark:text-amber-300",
  },
  info: {
    container:
      "bg-blue-500/10 border-blue-500 dark:bg-blue-500/15 dark:border-blue-400",
    icon: "text-blue-600 dark:text-blue-400",
    title: "text-blue-700 dark:text-blue-300",
  },
  note: {
    container:
      "bg-muted/50 border-muted-foreground/50 dark:bg-muted/30 dark:border-muted-foreground/40",
    icon: "text-muted-foreground",
    title: "text-foreground",
  },
} as const;

/**
 * ArticleCallout Component
 *
 * Renders a styled callout box with an icon, optional title, and content.
 * Supports RTL layout with proper icon positioning via CSS.
 *
 * @example
 * ```tsx
 * <ArticleCallout type="tip" title="Pro Tip">
 *   This is a helpful tip for readers.
 * </ArticleCallout>
 * ```
 */
export function ArticleCallout({
  type,
  title,
  children,
  className = "",
}: ArticleCalloutProps) {
  const Icon = iconMap[type];
  const styles = styleMap[type];

  return (
    <div
      role="note"
      className={`
        article-callout
        flex gap-3 sm:gap-4
        p-4 sm:p-5
        rounded-lg
        my-6
        border-l-4 rtl:border-l-0 rtl:border-r-4
        ${styles.container}
        ${className}
      `.trim()}
    >
      {/* Icon container - flex-shrink-0 prevents icon from shrinking */}
      <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
        <Icon size={20} aria-hidden={true} />
      </div>

      {/* Content container */}
      <div className="flex-1 min-w-0">
        {/* Optional title */}
        {title && (
          <p className={`font-semibold mb-1.5 text-sm sm:text-base ${styles.title}`}>
            {title}
          </p>
        )}

        {/* Main content */}
        <div className="text-sm sm:text-base text-foreground/90 leading-relaxed [&>p]:mb-2 [&>p:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  );
}

export type { CalloutType, ArticleCalloutProps };
