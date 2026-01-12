"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { type Tool } from "@/lib/tools";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ToolSEOContentProps {
  tool: Tool;
  locale: string;
}

export function ToolSEOContent({ tool, locale }: ToolSEOContentProps) {
  const t = useTranslations();

  return (
    <div className="mt-12 space-y-8">
      {/* What is this tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <tool.icon className="h-5 w-5 text-primary" />
            {t(`tools.${tool.slug}.seo.whatIs`)}
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <p className="text-muted-foreground leading-relaxed">
            {t(`tools.${tool.slug}.seo.whatIsContent`)}
          </p>
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>{t(`tools.${tool.slug}.seo.howItWorks`)}</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <p className="text-muted-foreground leading-relaxed">
            {t(`tools.${tool.slug}.seo.howItWorksContent`)}
          </p>
        </CardContent>
      </Card>

      {/* Why you need it */}
      <Card>
        <CardHeader>
          <CardTitle>{t(`tools.${tool.slug}.seo.whyNeed`)}</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none dark:prose-invert">
          <p className="text-muted-foreground leading-relaxed">
            {t(`tools.${tool.slug}.seo.whyNeedContent`)}
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Internal Links Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Link */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">
              {t('seo.exploreCategory')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link 
              href={`/tools?category=${tool.category}`}
              className="flex items-center gap-2 text-primary hover:underline font-medium"
            >
              <Badge variant="outline">{t(tool.categoryKey)}</Badge>
              {t('seo.viewAllInCategory')}
              <span className="rtl:rotate-180">→</span>
            </Link>
          </CardContent>
        </Card>

        {/* All Tools Link */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">
              {t('seo.moreTools')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link 
              href="/tools"
              className="flex items-center gap-2 text-primary hover:underline font-medium"
            >
              {t('seo.browseAllTools')}
              <span className="rtl:rotate-180">→</span>
            </Link>
            <p className="text-sm text-muted-foreground mt-2">
              {t('seo.toolsCount', { count: '60+' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('seo.faq.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-foreground mb-2">
              {t(`tools.${tool.slug}.faq.q1`)}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t(`tools.${tool.slug}.faq.a1`)}
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium text-foreground mb-2">
              {t(`tools.${tool.slug}.faq.q2`)}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t(`tools.${tool.slug}.faq.a2`)}
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium text-foreground mb-2">
              {t('seo.faq.generalQ')}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t('seo.faq.generalA')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}