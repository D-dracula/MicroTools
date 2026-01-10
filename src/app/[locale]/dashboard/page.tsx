import type { Metadata } from "next";
import { generateDashboardMetadata } from "@/lib/metadata";
import { DashboardContent } from "./dashboard-content";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

// Generate metadata for dashboard page (Requirements 12.1, 12.2)
export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateDashboardMetadata(locale as "ar" | "en");
}

export default function DashboardPage() {
  return <DashboardContent />;
}
