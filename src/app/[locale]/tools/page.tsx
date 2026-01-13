import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { ToolsGrid } from "@/components/tools/tools-grid";
import { Breadcrumb } from "@/components/seo";

interface ToolsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ToolsPageProps): Promise<Metadata> {
  const { locale } = await params;
  
  const titles = {
    ar: "جميع الأدوات | PineCalc",
    en: "All Tools | PineCalc"
  };
  
  const descriptions = {
    ar: "تصفح جميع أدوات PineCalc المجانية للتجار وأصحاب المتاجر الإلكترونية",
    en: "Browse all free PineCalc tools for merchants and e-commerce store owners"
  };

  return {
    title: titles[locale as "ar" | "en"] || titles.en,
    description: descriptions[locale as "ar" | "en"] || descriptions.en,
  };
}

export default function ToolsPage() {
  const t = useTranslations();
  const locale = useLocale();

  const breadcrumbItems = [
    { label: t('common.tools') }
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} locale={locale} />

        {/* Page Header */}
        <header className="text-center mb-12 mt-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t("landing.toolsTitle")}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t("landing.toolsDescription")}
          </p>
        </header>

        {/* Tools Grid */}
        <ToolsGrid />
      </div>
    </div>
  );
}
