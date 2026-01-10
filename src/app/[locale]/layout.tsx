import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SessionProvider } from "@/components/providers/session-provider";
import { generateSiteMetadata } from "@/lib/metadata";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

// Generate metadata for the locale layout (Requirements 12.1, 12.2)
export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  return generateSiteMetadata(locale as "ar" | "en");
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Get messages for the locale
  const messages = await getMessages();

  // Determine text direction based on locale
  const direction = locale === "ar" ? "rtl" : "ltr";

  // Determine font class based on locale
  const fontClass = locale === "ar" ? "font-cairo" : "font-inter";

  return (
    <div dir={direction} lang={locale} className={`${fontClass} min-h-screen flex flex-col`}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <SessionProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </NextIntlClientProvider>
    </div>
  );
}
