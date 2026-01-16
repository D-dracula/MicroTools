import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Locale = "ar" | "en";

interface MetadataConfig {
  locale: Locale;
  path?: string;
}

// Site-wide metadata configuration
const siteConfig = {
  ar: {
    siteName: "باين كالك",
    siteDescription: "أدوات مجانية لأصحاب المتاجر الإلكترونية - حاسبات الأرباح والتكاليف",
    keywords: ["باين كالك", "أدوات التجارة الإلكترونية", "حاسبة هامش الربح", "أدوات مجانية", "متجر إلكتروني", "pinecalc"],
  },
  en: {
    siteName: "PineCalc",
    siteDescription: "Free business tools for e-commerce store owners - profit calculators and cost analysis",
    keywords: ["PineCalc", "e-commerce tools", "profit margin calculator", "free tools", "online store", "business calculator"],
  },
};

// Page-specific metadata
const pageMetadata = {
  landing: {
    ar: {
      title: "باين كالك - أدوات ذكية للتجارة الإلكترونية",
      description: "مجموعة من الأدوات المجانية لمساعدتك في إدارة متجرك بكفاءة واحترافية - حاسبات الأرباح والتكاليف",
    },
    en: {
      title: "PineCalc - Smart Tools for E-commerce",
      description: "A collection of free tools to help you manage your store efficiently and professionally - profit and cost calculators",
    },
  },
  login: {
    ar: {
      title: "تسجيل الدخول - باين كالك",
      description: "سجل دخولك للوصول إلى حسابك وحفظ حساباتك",
    },
    en: {
      title: "Login - PineCalc",
      description: "Sign in to access your account and save your calculations",
    },
  },
  register: {
    ar: {
      title: "إنشاء حساب - باين كالك",
      description: "أنشئ حساباً مجانياً لحفظ حساباتك والوصول إليها من أي مكان",
    },
    en: {
      title: "Register - PineCalc",
      description: "Create a free account to save your calculations and access them anywhere",
    },
  },
  dashboard: {
    ar: {
      title: "لوحة التحكم - باين كالك",
      description: "عرض وإدارة سجل حساباتك المحفوظة",
    },
    en: {
      title: "Dashboard - PineCalc",
      description: "View and manage your saved calculation history",
    },
  },
};

// Tool-specific metadata
const toolMetadata: Record<string, { ar: { title: string; description: string }; en: { title: string; description: string } }> = {
  "profit-margin-calculator": {
    ar: {
      title: "حاسبة هامش الربح - باين كالك",
      description: "احسب هامش الربح ونسبة الزيادة بدقة. أداة مجانية تساعدك في تحديد الأسعار المناسبة وزيادة أرباحك. سهلة الاستخدام ومناسبة لجميع أنواع المنتجات.",
    },
    en: {
      title: "Profit Margin Calculator - PineCalc",
      description: "Calculate profit margin and markup accurately. Free tool to help you set the right prices and increase profits. Easy to use and suitable for all product types.",
    },
  },
  "payment-gateway-calculator": {
    ar: {
      title: "حاسبة رسوم بوابات الدفع - باين كالك",
      description: "قارن رسوم بوابات الدفع المختلفة (فيزا، مدى، PayPal، تابي) واختر الأنسب لمتجرك. احسب التكلفة الحقيقية وزد أرباحك.",
    },
    en: {
      title: "Payment Gateway Calculator - PineCalc",
      description: "Compare different payment gateway fees (Visa, Mada, PayPal, Tabby) and choose the best for your store. Calculate real costs and increase profits.",
    },
  },
  "net-profit-calculator": {
    ar: {
      title: "حاسبة صافي الربح - باين كالك",
      description: "احسب صافي الربح الحقيقي بعد خصم جميع التكاليف والرسوم. أداة شاملة تشمل تكاليف الشحن والتسويق والضرائب لحساب دقيق.",
    },
    en: {
      title: "Net Profit Calculator - PineCalc",
      description: "Calculate real net profit after deducting all costs and fees. Comprehensive tool including shipping, marketing, and tax costs for accurate calculation.",
    },
  },
  "qr-code-generator": {
    ar: {
      title: "مولد رمز QR - باين كالك",
      description: "أنشئ رموز QR مجانية لمتجرك، منتجاتك، أو روابطك. قابلة للتخصيص وعالية الجودة. مثالية للتسويق والمبيعات.",
    },
    en: {
      title: "QR Code Generator - PineCalc",
      description: "Create free QR codes for your store, products, or links. Customizable and high quality. Perfect for marketing and sales.",
    },
  },
  "utm-builder": {
    ar: {
      title: "منشئ روابط UTM - باين كالك",
      description: "أنشئ روابط UTM لتتبع حملاتك التسويقية بدقة. تابع مصادر الزيارات والمبيعات وحسّن استراتيجيتك التسويقية.",
    },
    en: {
      title: "UTM Builder - PineCalc",
      description: "Create UTM links to track your marketing campaigns accurately. Monitor traffic sources and sales, optimize your marketing strategy.",
    },
  },
  "image-compressor": {
    ar: {
      title: "ضاغط الصور - باين كالك",
      description: "اضغط صور منتجاتك بجودة عالية وحجم أصغر. حسّن سرعة موقعك وتجربة العملاء. يدعم جميع صيغ الصور الشائعة.",
    },
    en: {
      title: "Image Compressor - PineCalc",
      description: "Compress product images with high quality and smaller size. Improve site speed and customer experience. Supports all common image formats.",
    },
  },
  "smart-profit-audit": {
    ar: {
      title: "تدقيق الأرباح الذكي - باين كالك",
      description: "حلل بيانات مبيعاتك بالذكاء الاصطناعي واكتشف فرص زيادة الأرباح. تقرير شامل مع توصيات عملية لتحسين أداء متجرك.",
    },
    en: {
      title: "Smart Profit Audit - PineCalc",
      description: "Analyze your sales data with AI and discover profit opportunities. Comprehensive report with practical recommendations to improve store performance.",
    },
  },
};

/**
 * Generate base metadata for the site
 */
export function generateSiteMetadata(locale: Locale): Metadata {
  const config = siteConfig[locale];
  
  // Generate og:locale:alternate for other locales
  const alternateLocales = routing.locales
    .filter(l => l !== locale)
    .map(l => l === "ar" ? "ar_SA" : "en_US");
  
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: {
      default: config.siteName,
      template: `%s | ${config.siteName}`,
    },
    description: config.siteDescription,
    keywords: config.keywords,
    authors: [{ name: config.siteName }],
    creator: config.siteName,
    publisher: config.siteName,
    verification: {
      google: "NKPgaq13THWhO9Eh9pkUH6mrnTISuZd4EtgGdIUZdNE",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: alternateLocales,
      siteName: config.siteName,
      title: config.siteName,
      description: config.siteDescription,
    },
    twitter: {
      card: "summary_large_image",
      title: config.siteName,
      description: config.siteDescription,
    },
    alternates: {
      languages: {
        ar: "/ar",
        en: "/en",
      },
    },
  };
}

/**
 * Generate metadata for the landing page
 */
export function generateLandingMetadata(locale: Locale): Metadata {
  const meta = pageMetadata.landing[locale];
  const config = siteConfig[locale];
  
  // Generate og:locale:alternate for other locales
  const alternateLocales = routing.locales
    .filter(l => l !== locale)
    .map(l => l === "ar" ? "ar_SA" : "en_US");
  
  return {
    title: meta.title,
    description: meta.description,
    keywords: config.keywords,
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: alternateLocales,
      siteName: config.siteName,
      title: meta.title,
      description: meta.description,
      url: `/${locale}`,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ar: "/ar",
        en: "/en",
      },
    },
  };
}

/**
 * Generate metadata for auth pages (login/register)
 */
export function generateAuthMetadata(locale: Locale, page: "login" | "register"): Metadata {
  const meta = pageMetadata[page][locale];
  const config = siteConfig[locale];
  
  // Generate og:locale:alternate for other locales
  const alternateLocales = routing.locales
    .filter(l => l !== locale)
    .map(l => l === "ar" ? "ar_SA" : "en_US");
  
  return {
    title: meta.title,
    description: meta.description,
    robots: {
      index: false, // Don't index auth pages
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: alternateLocales,
      siteName: config.siteName,
      title: meta.title,
      description: meta.description,
      url: `/${locale}/auth/${page}`,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    alternates: {
      canonical: `/${locale}/auth/${page}`,
      languages: {
        ar: `/ar/auth/${page}`,
        en: `/en/auth/${page}`,
      },
    },
  };
}

/**
 * Generate metadata for the dashboard page
 */
export function generateDashboardMetadata(locale: Locale): Metadata {
  const meta = pageMetadata.dashboard[locale];
  const config = siteConfig[locale];
  
  // Generate og:locale:alternate for other locales
  const alternateLocales = routing.locales
    .filter(l => l !== locale)
    .map(l => l === "ar" ? "ar_SA" : "en_US");
  
  return {
    title: meta.title,
    description: meta.description,
    robots: {
      index: false, // Don't index dashboard (private page)
      follow: false,
    },
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: alternateLocales,
      siteName: config.siteName,
      title: meta.title,
      description: meta.description,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

/**
 * Generate metadata for tool pages
 */
export function generateToolMetadata(locale: Locale, toolSlug: string): Metadata {
  const meta = toolMetadata[toolSlug];
  const config = siteConfig[locale];
  
  // Generate og:locale:alternate for other locales
  const alternateLocales = routing.locales
    .filter(l => l !== locale)
    .map(l => l === "ar" ? "ar_SA" : "en_US");
  
  // Fallback for unknown tools
  if (!meta) {
    return {
      title: `${toolSlug} | ${config.siteName}`,
      description: config.siteDescription,
    };
  }
  
  const toolMeta = meta[locale];
  
  return {
    title: toolMeta.title,
    description: toolMeta.description,
    keywords: [...config.keywords, toolSlug.replace(/-/g, " ")],
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: alternateLocales,
      siteName: config.siteName,
      title: toolMeta.title,
      description: toolMeta.description,
      url: `/${locale}/tools/${toolSlug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: toolMeta.title,
      description: toolMeta.description,
    },
    alternates: {
      canonical: `/${locale}/tools/${toolSlug}`,
      languages: {
        ar: `/ar/tools/${toolSlug}`,
        en: `/en/tools/${toolSlug}`,
      },
    },
  };
}

/**
 * Add a new tool's metadata (for extensibility)
 */
export function registerToolMetadata(
  slug: string,
  metadata: { ar: { title: string; description: string }; en: { title: string; description: string } }
): void {
  toolMetadata[slug] = metadata;
}

/**
 * Generate dynamic metadata for tool pages from translation files
 * Implements fallback chain: seo.title → title + siteName → slug
 * Requirements: 2.1, 2.2, 2.3, 2.4, 5.4
 */
export async function generateDynamicToolMetadata(
  locale: string,
  toolSlug: string,
  toolKey: string
): Promise<Metadata> {
  const t = await getTranslations({ locale });
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pinecalc.com";
  const siteName = t("common.siteName");
  
  // Generate og:locale:alternate for other locales
  const alternateLocales = routing.locales
    .filter(l => l !== locale)
    .map(l => l === "ar" ? "ar_SA" : "en_US");
  
  // Fallback chain for title: seo.title → title + siteName → slug + siteName
  let title: string;
  const seoTitleKey = `tools.${toolKey}.seo.title`;
  const titleKey = `tools.${toolKey}.title`;
  
  if (t.has(seoTitleKey)) {
    title = t(seoTitleKey);
  } else if (t.has(titleKey)) {
    title = `${t(titleKey)} - ${siteName}`;
  } else {
    // Ultimate fallback: use slug
    title = `${toolSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} - ${siteName}`;
  }
  
  // Fallback chain for description: seo.description → description
  let description: string;
  const seoDescKey = `tools.${toolKey}.seo.description`;
  const descKey = `tools.${toolKey}.description`;
  
  if (t.has(seoDescKey)) {
    description = t(seoDescKey);
  } else if (t.has(descKey)) {
    description = t(descKey);
  } else {
    // Ultimate fallback: use site description
    description = t("common.siteDescription");
  }
  
  // Keywords (optional)
  const keywords: string[] = [];
  const seoKeywordsKey = `tools.${toolKey}.seo.keywords`;
  if (t.has(seoKeywordsKey)) {
    const keywordsStr = t(seoKeywordsKey);
    keywords.push(...keywordsStr.split(',').map(k => k.trim()));
  }
  
  // Generate alternates for all locales from routing.ts
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `/${loc}/tools/${toolSlug}`;
  }
  
  const path = `/tools/${toolSlug}`;
  const canonicalUrl = `${baseUrl}/${locale}${path}`;
  
  return {
    title,
    description,
    ...(keywords.length > 0 && { keywords }),
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: alternateLocales,
      siteName,
      title,
      description,
      url: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
  };
}
