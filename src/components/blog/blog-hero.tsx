"use client";

import { useTranslations } from "next-intl";
import { BookOpen, Sparkles } from "lucide-react";

export function BlogHero() {
  const t = useTranslations("blog");

  return (
    <section 
      className="relative py-20 px-4 gradient-hero overflow-hidden"
      aria-labelledby="blog-hero-title"
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden={true}>
        <div className="absolute -top-40 -end-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-20 start-10 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -start-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto max-w-4xl text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>{t("badge")}</span>
        </div>
        
        {/* Main heading */}
        <h1 id="blog-hero-title" className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-gradient">
          {t("heroTitle")}
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("heroDescription")}
        </p>

        {/* Icon decoration */}
        <div className="mt-8 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-violet-500 to-pink-500 text-white shadow-lg shadow-purple-500/30">
            <BookOpen className="h-8 w-8" aria-hidden={true} />
          </div>
        </div>
      </div>
    </section>
  );
}
