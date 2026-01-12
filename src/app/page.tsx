import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function Home() {
  // Get the Accept-Language header to determine user's preferred language
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Check if user prefers Arabic
  const prefersArabic = acceptLanguage.includes('ar') || acceptLanguage.includes('AR');
  
  // Redirect to appropriate locale
  if (prefersArabic) {
    redirect("/ar");
  } else {
    redirect("/en");
  }
}
