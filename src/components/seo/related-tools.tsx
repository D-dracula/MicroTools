"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { tools, type Tool, type ToolCategory } from "@/lib/tools";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RelatedToolsProps {
  currentTool: Tool;
  locale: string;
  maxItems?: number;
}

export function RelatedTools({ currentTool, locale, maxItems = 4 }: RelatedToolsProps) {
  const t = useTranslations();

  // Get related tools from same category
  const relatedTools = tools
    .filter(tool => 
      tool.category === currentTool.category && 
      tool.slug !== currentTool.slug
    )
    .slice(0, maxItems);

  // If not enough tools in same category, add popular tools
  if (relatedTools.length < maxItems) {
    const popularTools = getPopularTools(currentTool.category, currentTool.slug);
    const needed = maxItems - relatedTools.length;
    relatedTools.push(...popularTools.slice(0, needed));
  }

  if (relatedTools.length === 0) return null;

  return (
    <section className="mt-12 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {t('seo.relatedTools.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('seo.relatedTools.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {relatedTools.map((tool) => (
          <Card key={tool.slug} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-2">
                <tool.icon className="h-5 w-5 text-primary" />
                <Badge variant="secondary" className="text-xs">
                  {t(tool.categoryKey)}
                </Badge>
              </div>
              <CardTitle className="text-lg">
                <Link 
                  href={`/tools/${tool.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {t(tool.titleKey)}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm line-clamp-2">
                {t(tool.descriptionKey)}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Link 
          href="/tools"
          className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
        >
          {t('seo.relatedTools.viewAll')}
          <span className="rtl:rotate-180">→</span>
        </Link>
      </div>
    </section>
  );
}

// Get popular tools for cross-category recommendations
function getPopularTools(excludeCategory: ToolCategory, excludeSlug: string): Tool[] {
  const popularSlugs = [
    'profit-margin-calculator',
    'payment-gateway-calculator', 
    'qr-code-generator',
    'utm-builder',
    'image-compressor',
    'smart-profit-audit',
    'net-profit-calculator',
    'saudi-vat-calculator'
  ];

  return tools.filter(tool => 
    popularSlugs.includes(tool.slug) &&
    tool.category !== excludeCategory &&
    tool.slug !== excludeSlug
  );
}