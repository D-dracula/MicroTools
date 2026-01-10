import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Sparkles, Zap, Shield, Globe } from "lucide-react";
import { ToolsGrid } from "@/components/tools/tools-grid";
import { LandingAd } from "@/components/ads";
import { generateLandingMetadata } from "@/lib/metadata";

// Generate metadata for landing page (Requirements 12.1, 12.2, 12.3, 12.4)
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateLandingMetadata(locale as "ar" | "en");
}

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative py-24 px-4 gradient-hero overflow-hidden"
        aria-labelledby="hero-title"
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden={true}>
          <div className="absolute -top-40 -end-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-20 start-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -start-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>{t("common.siteDescription")}</span>
          </div>
          
          {/* Main heading (h1 - proper hierarchy) */}
          <h1 id="hero-title" className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-gradient">
            {t("landing.heroTitle")}
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            {t("landing.heroDescription")}
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto" role="list" aria-label={locale === "ar" ? "مميزات الموقع" : "Site features"}>
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-purple-200/50 dark:border-purple-500/20 shadow-lg shadow-purple-500/5" role="listitem">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30">
                <Zap className="h-6 w-6" aria-hidden={true} />
              </div>
              <span className="font-semibold text-foreground">{t("features.fast")}</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-cyan-200/50 dark:border-cyan-500/20 shadow-lg shadow-cyan-500/5" role="listitem">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30">
                <Shield className="h-6 w-6" aria-hidden={true} />
              </div>
              <span className="font-semibold text-foreground">{t("features.secure")}</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-500/20 shadow-lg shadow-emerald-500/5" role="listitem">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
                <Globe className="h-6 w-6" aria-hidden={true} />
              </div>
              <span className="font-semibold text-foreground">{t("features.multilingual")}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Slot - Below Hero (Requirement 16.1) */}
      <aside className="py-8 px-4" aria-label={locale === "ar" ? "إعلان" : "Advertisement"}>
        <div className="container mx-auto max-w-4xl">
          <LandingAd locale={locale} />
        </div>
      </aside>

      {/* Tools Section */}
      <section 
        className="py-20 px-4 bg-muted/50"
        aria-labelledby="tools-title"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 id="tools-title" className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              {t("landing.toolsTitle")}
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("landing.toolsDescription")}
            </p>
          </div>
          <ToolsGrid />
        </div>
      </section>
    </div>
  );
}
