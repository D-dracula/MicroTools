import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getToolBySlug } from "@/lib/tools";
import { Button } from "@/components/ui/button";
import { ToolPageContent } from "@/components/tools/tool-page-content";
import { generateToolMetadata } from "@/lib/metadata";
import { generateToolStructuredData } from "@/lib/structured-data";
import { Breadcrumb } from "@/components/seo";

interface ToolPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// Generate metadata for tool pages (Requirements 12.1, 12.2, 12.3, 12.4)
export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const tool = getToolBySlug(slug);
  
  if (!tool) {
    return {
      title: "Tool Not Found",
    };
  }

  return generateToolMetadata(locale as "ar" | "en", slug);
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations();
  
  // Get tool data
  const tool = getToolBySlug(slug);
  
  // Return 404 if tool not found (Requirement 5.1)
  if (!tool) {
    notFound();
  }

  // Generate structured data
  const structuredData = generateToolStructuredData(tool, locale);

  // Determine arrow direction based on locale
  const BackArrow = locale === "ar" ? ArrowRight : ArrowLeft;

  // Breadcrumb items
  const breadcrumbItems = [
    { label: t('common.tools'), href: '/tools' },
    { label: t(tool.titleKey) }
  ];

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <article className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb items={breadcrumbItems} locale={locale} />

        {/* Back Navigation (Requirement 5.3) */}
        <nav className="mb-8" aria-label={locale === "ar" ? "التنقل" : "Navigation"}>
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/">
              <BackArrow className="h-4 w-4" aria-hidden="true" />
              {t("common.backToHome")}
            </Link>
          </Button>
        </nav>

        {/* Tool Title and Description (Requirement 5.1, 5.2) */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {t(tool.titleKey)}
          </h1>
          <p className="text-muted-foreground">
            {t(tool.descriptionKey)}
          </p>
        </header>

        {/* Tool Content with Ads (Requirements 5.4, 5.5, 16.2) */}
        <section aria-label={t(tool.titleKey)}>
          <ToolPageContent slug={slug} locale={locale} />
        </section>


      </article>
    </>
  );
}
