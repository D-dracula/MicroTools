import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { generateAuthMetadata } from "@/lib/metadata";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

// Generate metadata for login page (Requirements 12.1, 12.2, 12.3, 12.4)
export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateAuthMetadata(locale as "ar" | "en", "login");
}

export default function LoginPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-8">
      <LoginForm />
    </div>
  );
}
