/**
 * Next.js Loading UI
 * يظهر تلقائياً أثناء تحميل أي صفحة
 */

import { LoadingSkeleton } from "@/components/layout/loading-skeleton";

export default function Loading() {
  // Loading component لا يستقبل params
  // نستخدم اللغة الافتراضية - المستخدم سيرى الصفحة بسرعة
  return <LoadingSkeleton />;
}