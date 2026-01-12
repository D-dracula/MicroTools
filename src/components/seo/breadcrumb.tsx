"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ChevronRight, Home } from "lucide-react";
import { generateBreadcrumbStructuredData } from "@/lib/structured-data";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  locale: string;
}

export function Breadcrumb({ items, locale }: BreadcrumbProps) {
  const t = useTranslations();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinecalc.com';

  // Prepare items for structured data
  const structuredDataItems = [
    { name: t('common.home'), url: `${baseUrl}/${locale}` },
    ...items.map(item => ({
      name: item.label,
      url: item.href ? `${baseUrl}${item.href}` : `${baseUrl}/${locale}`
    }))
  ];

  const structuredData = generateBreadcrumbStructuredData(structuredDataItems, locale);

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-muted-foreground">
          <li>
            <Link 
              href="/"
              className="flex items-center hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only">{t('common.home')}</span>
            </Link>
          </li>
          
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-2 rtl:rotate-180" />
              {item.href && index < items.length - 1 ? (
                <Link 
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}