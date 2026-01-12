import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

// Inter font for English text
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Cairo font for Arabic text
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://pinecalc.com'),
  title: {
    default: "PineCalc - باين كالك | أدوات مجانية للتجار",
    template: "%s | PineCalc",
  },
  description: "أدوات مجانية للتجار وأصحاب المتاجر الإلكترونية - حاسبات الأرباح، أدوات الصور، أدوات التسويق والمزيد",
  keywords: ["باين كالك", "PineCalc", "أدوات تجارية", "حاسبة أرباح", "e-commerce tools", "profit calculator", "business tools"],
  authors: [{ name: "PineCalc" }],
  creator: "PineCalc",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: "en_US",
    siteName: "PineCalc",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'NKPgaq13THWhO9Eh9pkUH6mrnTISuZd4EtgGdIUZdNE',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cairo.variable} font-inter antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
