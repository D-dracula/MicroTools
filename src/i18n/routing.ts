import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "en", // Changed from "ar" to "en" to avoid Vercel build issues
});

// Create navigation components with locale support
export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
