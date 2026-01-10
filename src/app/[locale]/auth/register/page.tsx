import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { generateAuthMetadata } from "@/lib/metadata";

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

// Generate metadata for register page (Requirements 12.1, 12.2, 12.3, 12.4)
export async function generateMetadata({ params }: RegisterPageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateAuthMetadata(locale as "ar" | "en", "register");
}

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-8">
      <RegisterForm />
    </div>
  );
}
