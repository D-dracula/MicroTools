"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lightbulb, Copy, Check, ChevronDown, Instagram, Twitter } from "lucide-react";
import {
  getContentIdeas,
  getStoreCategories,
  getContentTypeLabel,
  getPlatformLabel,
  type StoreCategory,
  type ContentType,
  type Platform,
  type LocalizedContentIdea,
} from "@/lib/calculators/content-ideas";

// Platform icons mapping
const PlatformIcon = ({ platform }: { platform: Platform }) => {
  switch (platform) {
    case 'instagram':
      return <Instagram className="h-4 w-4" />;
    case 'twitter':
      return <Twitter className="h-4 w-4" />;
    case 'tiktok':
      return <span className="text-xs font-bold">TT</span>;
    case 'snapchat':
      return <span className="text-xs font-bold">👻</span>;
    default:
      return <span className="text-xs">🌐</span>;
  }
};

export function ContentIdeaGenerator() {
  const t = useTranslations("tools.contentIdeaGenerator");
  const locale = useLocale() as 'ar' | 'en';
  
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory>('general');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'byType' | 'byPlatform'>('all');
  const [expandedTypes, setExpandedTypes] = useState<Set<ContentType>>(new Set());
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<Platform>>(new Set());

  const categories = useMemo(() => getStoreCategories(locale), [locale]);
  const result = useMemo(() => getContentIdeas(selectedCategory, locale), [selectedCategory, locale]);

  const handleCopy = async (template: string, id: string) => {
    try {
      await navigator.clipboard.writeText(template);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleType = (type: ContentType) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const togglePlatform = (platform: Platform) => {
    setExpandedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  const renderIdeaCard = (idea: LocalizedContentIdea) => (
    <div key={idea.id} className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded bg-primary/10">
            <PlatformIcon platform={idea.platform} />
          </span>
          <div>
            <h4 className="font-medium text-sm">{idea.title}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {getContentTypeLabel(idea.type, locale)}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {getPlatformLabel(idea.platform, locale)}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCopy(idea.template, idea.id)}
          className="h-8 w-8 p-0 shrink-0"
        >
          {copiedId === idea.id ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="bg-muted/50 rounded-md p-3 mb-3">
        <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          {idea.template}
        </pre>
      </div>
      
      {idea.tips.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">{locale === 'ar' ? 'نصائح:' : 'Tips:'}</span>
          <ul className="mt-1 space-y-0.5">
            {idea.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-1">
                <span>•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{locale === 'ar' ? 'اختر نوع متجرك' : 'Select your store type'}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`p-3 rounded-lg border text-sm text-start transition-colors ${
                    selectedCategory === cat.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 pt-2">
            <Label className="text-sm text-muted-foreground">
              {locale === 'ar' ? 'عرض حسب:' : 'View by:'}
            </Label>
            <div className="flex gap-1">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
              >
                {locale === 'ar' ? 'الكل' : 'All'}
              </Button>
              <Button
                variant={viewMode === 'byType' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('byType')}
              >
                {locale === 'ar' ? 'النوع' : 'Type'}
              </Button>
              <Button
                variant={viewMode === 'byPlatform' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('byPlatform')}
              >
                {locale === 'ar' ? 'المنصة' : 'Platform'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Ideas Display */}
      {viewMode === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {locale === 'ar' ? 'أفكار المحتوى' : 'Content Ideas'}
              <span className="text-sm font-normal text-muted-foreground ms-2">
                ({result.ideas.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {result.ideas.map(renderIdeaCard)}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'byType' && (
        <div className="space-y-4">
          {(Object.keys(result.byType) as ContentType[]).map((type) => {
            const ideas = result.byType[type];
            if (ideas.length === 0) return null;
            const isExpanded = expandedTypes.has(type);
            
            return (
              <Card key={type}>
                <CardHeader 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleType(type)}
                >
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                      {getContentTypeLabel(type, locale)}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({ideas.length})
                      </span>
                    </span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <div className="grid gap-4">
                      {ideas.map(renderIdeaCard)}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {viewMode === 'byPlatform' && (
        <div className="space-y-4">
          {(Object.keys(result.byPlatform) as Platform[]).map((platform) => {
            const ideas = result.byPlatform[platform];
            if (ideas.length === 0) return null;
            const isExpanded = expandedPlatforms.has(platform);
            
            return (
              <Card key={platform}>
                <CardHeader 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => togglePlatform(platform)}
                >
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-2">
                      <PlatformIcon platform={platform} />
                      {getPlatformLabel(platform, locale)}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({ideas.length})
                      </span>
                    </span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <div className="grid gap-4">
                      {ideas.map(renderIdeaCard)}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {result.ideas.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {locale === 'ar' 
              ? 'لا توجد أفكار محتوى لهذه الفئة حالياً'
              : 'No content ideas available for this category yet'
            }
          </CardContent>
        </Card>
      )}
    </div>
  );
}
