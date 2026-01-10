import type { Metadata } from "next";

type Locale = "ar" | "en";

interface MetadataConfig {
  locale: Locale;
  path?: string;
}

// Site-wide metadata configuration
const siteConfig = {
  ar: {
    siteName: "أدوات التجارة",
    siteDescription: "أدوات مجانية لأصحاب المتاجر الإلكترونية",
    keywords: ["أدوات التجارة الإلكترونية", "حاسبة هامش الربح", "أدوات مجانية", "متجر إلكتروني"],
  },
  en: {
    siteName: "Micro Tools",
    siteDescription: "Free tools for e-commerce store owners",
    keywords: ["e-commerce tools", "profit margin calculator", "free tools", "online store"],
  },
};

// Page-specific metadata
const pageMetadata = {
  landing: {
    ar: {
      title: "أدوات التجارة - أدوات ذكية للتجارة الإلكترونية",
      description: "مجموعة من الأدوات المجانية لمساعدتك في إدارة متجرك بكفاءة واحترافية",
    },
    en: {
      title: "Micro Tools - Smart Tools for E-commerce",
      description: "A collection of free tools to help you manage your store efficiently and professionally",
    },
  },
  login: {
    ar: {
      title: "تسجيل الدخول - أدوات التجارة",
      description: "سجل دخولك للوصول إلى حسابك وحفظ حساباتك",
    },
    en: {
      title: "Login - Micro Tools",
      description: "Sign in to access your account and save your calculations",
    },
  },
  register: {
    ar: {
      title: "إنشاء حساب - أدوات التجارة",
      description: "أنشئ حساباً مجانياً لحفظ حساباتك والوصول إليها من أي مكان",
    },
    en: {
      title: "Register - Micro Tools",
      description: "Create a free account to save your calculations and access them anywhere",
    },
  },
  dashboard: {
    ar: {
      title: "لوحة التحكم - أدوات التجارة",
      description: "عرض وإدارة سجل حساباتك المحفوظة",
    },
    en: {
      title: "Dashboard - Micro Tools",
      description: "View and manage your saved calculation history",
    },
  },
};

// Tool-specific metadata
const toolMetadata: Record<string, { ar: { title: string; description: string }; en: { title: string; description: string } }> = {
  "profit-margin-calculator": {
    ar: {
      title: "حاسبة هامش الربح - أدوات التجارة",
      description: "احسب هامش الربح ونسبة الزيادة بسهولة. أداة مجانية لأصحاب المتاجر الإلكترونية",
    },
    en: {
      title: "Profit Margin Calculator - Micro Tools",
      description: "Calculate profit margin and markup easily. Free tool for e-commerce store owners",
    },
  },
};

/**
 * Generate base metadata for the site
 */
export function generateSiteMetadata(locale: Locale): Metadata {
  const config = siteConfig[locale];
  
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
  
  return {
    title: meta.title,
    description: meta.description,
    keywords: config.keywords,
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_SA" : "en_US",
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
      siteName: config.siteName,
      title: meta.title,
      description: meta.description,
      url: `/${locale}/auth/${page}`,
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
      siteName: config.siteName,
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
