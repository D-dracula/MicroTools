"use client";

/**
 * New Article Content Component
 * 
 * Form for creating new blog articles manually.
 * Supports both Arabic and English with proper RTL/LTR.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  FileText,
  Tag,
  Image,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ARTICLE_CATEGORIES, type ArticleCategory } from "@/lib/blog/types";

// ============================================================================
// Types
// ============================================================================

interface ArticleFormData {
  title: string;
  summary: string;
  content: string;
  category: ArticleCategory;
  tags: string[];
  thumbnailUrl: string;
  metaTitle: string;
  metaDescription: string;
  isPublished: boolean;
}

// ============================================================================
// Translations
// ============================================================================

function getTranslations(isRTL: boolean) {
  return {
    title: isRTL ? "إنشاء مقال جديد" : "Create New Article",
    subtitle: isRTL ? "أضف مقالاً جديداً للمدونة" : "Add a new article to the blog",
    back: isRTL ? "العودة" : "Back",
    
    // Form fields
    fields: {
      title: isRTL ? "عنوان المقال" : "Article Title",
      titlePlaceholder: isRTL ? "أدخل عنوان المقال..." : "Enter article title...",
      summary: isRTL ? "الملخص" : "Summary",
      summaryPlaceholder: isRTL ? "ملخص قصير للمقال (2-3 جمل)..." : "Brief summary (2-3 sentences)...",
      content: isRTL ? "المحتوى" : "Content",
      contentPlaceholder: isRTL ? "اكتب محتوى المقال هنا (يدعم Markdown)..." : "Write article content here (Markdown supported)...",
      category: isRTL ? "التصنيف" : "Category",
      selectCategory: isRTL ? "اختر التصنيف" : "Select category",
      tags: isRTL ? "الوسوم" : "Tags",
      tagsPlaceholder: isRTL ? "أضف وسم واضغط Enter..." : "Add tag and press Enter...",
      thumbnailUrl: isRTL ? "رابط الصورة المصغرة" : "Thumbnail URL",
      thumbnailPlaceholder: isRTL ? "https://example.com/image.jpg" : "https://example.com/image.jpg",
      metaTitle: isRTL ? "عنوان SEO" : "SEO Title",
      metaTitlePlaceholder: isRTL ? "عنوان محسن لمحركات البحث (60 حرف كحد أقصى)" : "SEO optimized title (max 60 chars)",
      metaDescription: isRTL ? "وصف SEO" : "SEO Description",
      metaDescriptionPlaceholder: isRTL ? "وصف محسن لمحركات البحث (160 حرف كحد أقصى)" : "SEO optimized description (max 160 chars)",
      isPublished: isRTL ? "نشر المقال" : "Publish Article",
      publishedHint: isRTL ? "المقال سيكون مرئياً للجميع" : "Article will be visible to everyone",
    },
    
    // Categories
    categories: {
      marketing: isRTL ? "التسويق" : "Marketing",
      "seller-tools": isRTL ? "أدوات البائع" : "Seller Tools",
      logistics: isRTL ? "اللوجستيات" : "Logistics",
      trends: isRTL ? "الاتجاهات" : "Trends",
      "case-studies": isRTL ? "دراسات الحالة" : "Case Studies",
    },
    
    // Actions
    actions: {
      save: isRTL ? "حفظ المقال" : "Save Article",
      saving: isRTL ? "جاري الحفظ..." : "Saving...",
      preview: isRTL ? "معاينة" : "Preview",
    },
    
    // Messages
    messages: {
      success: isRTL ? "تم إنشاء المقال بنجاح!" : "Article created successfully!",
      error: isRTL ? "حدث خطأ أثناء إنشاء المقال" : "Error creating article",
      required: isRTL ? "هذا الحقل مطلوب" : "This field is required",
    },
    
    // Hints
    hints: {
      markdown: isRTL ? "يدعم تنسيق Markdown" : "Supports Markdown formatting",
      chars: isRTL ? "حرف" : "chars",
    },
  };
}

// ============================================================================
// Component
// ============================================================================

export function NewArticleContent() {
  const router = useRouter();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = getTranslations(isRTL);
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  // Form state
  const [formData, setFormData] = useState<ArticleFormData>({
    title: "",
    summary: "",
    content: "",
    category: "marketing",
    tags: [],
    thumbnailUrl: "",
    metaTitle: "",
    metaDescription: "",
    isPublished: false,
  });
  
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle form field changes
  const handleChange = (field: keyof ArticleFormData, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Handle tag addition
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(newTag)) {
        handleChange("tags", [...formData.tags, newTag]);
      }
      setTagInput("");
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    handleChange("tags", formData.tags.filter(tag => tag !== tagToRemove));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      setError(t.messages.required);
      return;
    }
    if (!formData.summary.trim()) {
      setError(t.messages.required);
      return;
    }
    if (!formData.content.trim()) {
      setError(t.messages.required);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/blog/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          summary: formData.summary.trim(),
          content: formData.content.trim(),
          category: formData.category,
          tags: formData.tags,
          thumbnailUrl: formData.thumbnailUrl.trim() || null,
          metaTitle: formData.metaTitle.trim() || undefined,
          metaDescription: formData.metaDescription.trim() || undefined,
          isPublished: formData.isPublished,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || t.messages.error);
      }

      setSuccess(true);
      
      // Redirect to blog manager after 1.5 seconds
      setTimeout(() => {
        router.push(`/${locale}/admin/blog`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.messages.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get category label
  const getCategoryLabel = (category: ArticleCategory) => {
    return t.categories[category] || category;
  };

  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${locale}/admin/blog`)}
          >
            <BackIcon className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {t.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>{t.messages.success}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Content Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.fields.content}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t.fields.title} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder={t.fields.titlePlaceholder}
                maxLength={500}
                required
              />
              <p className="text-xs text-muted-foreground text-end">
                {formData.title.length}/500 {t.hints.chars}
              </p>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary">{t.fields.summary} *</Label>
              <textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => handleChange("summary", e.target.value)}
                placeholder={t.fields.summaryPlaceholder}
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
                maxLength={500}
                required
              />
              <p className="text-xs text-muted-foreground text-end">
                {formData.summary.length}/500 {t.hints.chars}
              </p>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">{t.fields.content} *</Label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleChange("content", e.target.value)}
                placeholder={t.fields.contentPlaceholder}
                className="w-full min-h-[300px] px-3 py-2 rounded-md border border-input bg-background text-sm font-mono resize-y"
                required
              />
              <p className="text-xs text-muted-foreground">
                {t.hints.markdown}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Metadata Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {t.fields.category}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>{t.fields.category} *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value as ArticleCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.fields.selectCategory} />
                </SelectTrigger>
                <SelectContent>
                  {ARTICLE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">{t.fields.tags}</Label>
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={t.fields.tagsPlaceholder}
              />
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail URL */}
            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                {t.fields.thumbnailUrl}
              </Label>
              <Input
                id="thumbnailUrl"
                type="url"
                value={formData.thumbnailUrl}
                onChange={(e) => handleChange("thumbnailUrl", e.target.value)}
                placeholder={t.fields.thumbnailPlaceholder}
              />
            </div>
          </CardContent>
        </Card>

        {/* SEO Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Meta Title */}
            <div className="space-y-2">
              <Label htmlFor="metaTitle">{t.fields.metaTitle}</Label>
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => handleChange("metaTitle", e.target.value)}
                placeholder={t.fields.metaTitlePlaceholder}
                maxLength={70}
              />
              <p className="text-xs text-muted-foreground text-end">
                {formData.metaTitle.length}/70 {t.hints.chars}
              </p>
            </div>

            {/* Meta Description */}
            <div className="space-y-2">
              <Label htmlFor="metaDescription">{t.fields.metaDescription}</Label>
              <textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) => handleChange("metaDescription", e.target.value)}
                placeholder={t.fields.metaDescriptionPlaceholder}
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-y"
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground text-end">
                {formData.metaDescription.length}/160 {t.hints.chars}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Publish Settings */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPublished">{t.fields.isPublished}</Label>
                <p className="text-xs text-muted-foreground">{t.fields.publishedHint}</p>
              </div>
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => handleChange("isPublished", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${locale}/admin/blog`)}
          >
            {t.back}
          </Button>
          <Button type="submit" disabled={isSubmitting || success}>
            {isSubmitting ? (
              <>
                <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? "ml-2" : "mr-2"}`} />
                {t.actions.saving}
              </>
            ) : (
              <>
                <Save className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {t.actions.save}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
