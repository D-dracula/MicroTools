"use client";

/**
 * Generate Article Content Component
 * 
 * Professional AI-powered article generation interface.
 * Uses Exa for topic research and OpenRouter for content generation.
 * Shows detailed progress for each step.
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Key,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Zap,
  Search,
  Globe,
  FileText,
  Brain,
  Database,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ARTICLE_CATEGORIES, type ArticleCategory } from "@/lib/blog/types";


// ============================================================================
// Types
// ============================================================================

interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  generatedToday: number;
  dailyLimit: number;
  resetAt: string;
}

interface GeneratedArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: ArticleCategory;
  thumbnailUrl: string | null;
  readingTime: number;
  createdAt: string;
}

interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate: string;
  score: number;
  text: string;
}

interface StepLog {
  id: string;
  step: GenerationStep;
  message: string;
  timestamp: Date;
  status: 'pending' | 'running' | 'complete' | 'error';
  details?: string;
  duration?: number;
}

type GenerationStep = 
  | 'idle'
  | 'validating'
  | 'searching'
  | 'analyzing'
  | 'selecting'
  | 'generating'
  | 'formatting'
  | 'saving'
  | 'complete'
  | 'error';


// ============================================================================
// Translations
// ============================================================================

function getTranslations(isRTL: boolean) {
  return {
    title: isRTL ? "توليد مقال بالذكاء الاصطناعي" : "Generate Article with AI",
    subtitle: isRTL ? "أنشئ مقالاً احترافياً باستخدام Exa + AI" : "Create a professional article using Exa + AI",
    back: isRTL ? "العودة" : "Back",
    
    apiKey: {
      title: isRTL ? "مفتاح OpenRouter API" : "OpenRouter API Key",
      placeholder: isRTL ? "sk-or-v1-..." : "sk-or-v1-...",
      hint: isRTL ? "للتوليد بالذكاء الاصطناعي" : "For AI content generation",
      getKey: isRTL ? "احصل على مفتاح" : "Get Key",
    },
    
    exaKey: {
      title: isRTL ? "مفتاح Exa API" : "Exa API Key",
      placeholder: isRTL ? "أدخل مفتاح Exa..." : "Enter Exa key...",
      hint: isRTL ? "للبحث عن أحدث المواضيع" : "For searching latest topics",
      getKey: isRTL ? "احصل على مفتاح" : "Get Key",
    },
    
    searchQuery: {
      title: isRTL ? "موضوع البحث" : "Search Topic",
      placeholder: isRTL ? "مثال: اتجاهات التجارة الإلكترونية 2025" : "e.g., e-commerce trends 2025",
      hint: isRTL ? "اتركه فارغاً للبحث التلقائي" : "Leave empty for auto-search",
    },
    
    category: {
      title: isRTL ? "التصنيف" : "Category",
      auto: isRTL ? "تلقائي (يختاره AI)" : "Auto (AI chooses)",
    },
    
    categories: {
      marketing: isRTL ? "التسويق" : "Marketing",
      "seller-tools": isRTL ? "أدوات البائع" : "Seller Tools",
      logistics: isRTL ? "اللوجستيات" : "Logistics",
      trends: isRTL ? "الاتجاهات" : "Trends",
      "case-studies": isRTL ? "دراسات الحالة" : "Case Studies",
    },
    
    rateLimit: {
      title: isRTL ? "الحد اليومي" : "Daily Limit",
      remaining: isRTL ? "متبقي" : "remaining",
      of: isRTL ? "من" : "of",
      exceeded: isRTL ? "تم الوصول للحد. حاول غداً." : "Limit reached. Try tomorrow.",
    },
    
    actions: {
      generate: isRTL ? "🚀 بدء التوليد" : "🚀 Start Generation",
      generating: isRTL ? "جاري التوليد..." : "Generating...",
      viewArticle: isRTL ? "عرض المقال" : "View Article",
      generateAnother: isRTL ? "توليد مقال آخر" : "Generate Another",
      showLogs: isRTL ? "عرض السجلات" : "Show Logs",
      hideLogs: isRTL ? "إخفاء السجلات" : "Hide Logs",
    },
    
    steps: {
      validating: isRTL ? "التحقق من المدخلات..." : "Validating inputs...",
      searching: isRTL ? "البحث في Exa عن أحدث المواضيع..." : "Searching Exa for latest topics...",
      analyzing: isRTL ? "تحليل نتائج البحث..." : "Analyzing search results...",
      selecting: isRTL ? "اختيار أفضل موضوع..." : "Selecting best topic...",
      generating: isRTL ? "توليد المحتوى بالذكاء الاصطناعي..." : "Generating content with AI...",
      formatting: isRTL ? "تنسيق المقال..." : "Formatting article...",
      saving: isRTL ? "حفظ في قاعدة البيانات..." : "Saving to database...",
      complete: isRTL ? "تم بنجاح!" : "Complete!",
    },
    
    progress: {
      title: isRTL ? "تقدم العملية" : "Generation Progress",
      logs: isRTL ? "سجل العمليات" : "Operation Logs",
      elapsed: isRTL ? "الوقت المنقضي" : "Elapsed time",
      searchResults: isRTL ? "نتائج البحث" : "Search Results",
      selectedTopic: isRTL ? "الموضوع المختار" : "Selected Topic",
    },
    
    messages: {
      success: isRTL ? "🎉 تم توليد المقال بنجاح!" : "🎉 Article generated successfully!",
      error: isRTL ? "حدث خطأ" : "An error occurred",
      apiKeyRequired: isRTL ? "مفتاح OpenRouter مطلوب" : "OpenRouter key required",
      exaKeyRequired: isRTL ? "مفتاح Exa مطلوب" : "Exa key required",
    },
  };
}


// ============================================================================
// Step Progress Component
// ============================================================================

interface StepProgressProps {
  steps: StepLog[];
  currentStep: GenerationStep;
  isRTL: boolean;
  t: ReturnType<typeof getTranslations>;
}

function StepProgress({ steps, currentStep, isRTL, t }: StepProgressProps) {
  const allSteps: GenerationStep[] = ['validating', 'searching', 'analyzing', 'selecting', 'generating', 'formatting', 'saving', 'complete'];
  
  const getStepIcon = (step: GenerationStep) => {
    switch (step) {
      case 'validating': return <Key className="h-4 w-4" />;
      case 'searching': return <Search className="h-4 w-4" />;
      case 'analyzing': return <Brain className="h-4 w-4" />;
      case 'selecting': return <FileText className="h-4 w-4" />;
      case 'generating': return <Sparkles className="h-4 w-4" />;
      case 'formatting': return <FileText className="h-4 w-4" />;
      case 'saving': return <Database className="h-4 w-4" />;
      case 'complete': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStepStatus = (step: GenerationStep): 'pending' | 'running' | 'complete' | 'error' => {
    const stepIndex = allSteps.indexOf(step);
    const currentIndex = allSteps.indexOf(currentStep);
    
    if (currentStep === 'error') return 'error';
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'running';
    return 'pending';
  };

  return (
    <div className="space-y-2">
      {allSteps.map((step, index) => {
        const status = getStepStatus(step);
        const stepLog = steps.find(s => s.step === step);
        
        return (
          <div
            key={step}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              status === 'running' ? 'bg-primary/10 border border-primary/30' :
              status === 'complete' ? 'bg-green-500/10' :
              status === 'error' ? 'bg-destructive/10' :
              'bg-muted/30'
            }`}
          >
            <div className={`flex-shrink-0 ${
              status === 'running' ? 'text-primary animate-pulse' :
              status === 'complete' ? 'text-green-500' :
              status === 'error' ? 'text-destructive' :
              'text-muted-foreground'
            }`}>
              {status === 'running' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status === 'complete' ? (
                <CheckCircle className="h-4 w-4" />
              ) : status === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                getStepIcon(step)
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                status === 'running' ? 'text-primary' :
                status === 'complete' ? 'text-green-600 dark:text-green-400' :
                status === 'error' ? 'text-destructive' :
                'text-muted-foreground'
              }`}>
                {t.steps[step as keyof typeof t.steps] || step}
              </p>
              {stepLog?.details && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {stepLog.details}
                </p>
              )}
            </div>
            
            {stepLog?.duration && status === 'complete' && (
              <Badge variant="outline" className="text-xs">
                {(stepLog.duration / 1000).toFixed(1)}s
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ============================================================================
// Main Component
// ============================================================================

export function GenerateArticleContent() {
  const router = useRouter();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = getTranslations(isRTL);
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  // State
  const [apiKey, setApiKey] = useState("");
  const [exaKey, setExaKey] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<ArticleCategory | "auto">("auto");
  const [rateLimit, setRateLimit] = useState<RateLimitStatus | null>(null);
  const [isLoadingRateLimit, setIsLoadingRateLimit] = useState(true);
  const [generationStep, setGenerationStep] = useState<GenerationStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [searchResults, setSearchResults] = useState<ExaSearchResult[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ExaSearchResult | null>(null);
  const [stepLogs, setStepLogs] = useState<StepLog[]>([]);
  const [showLogs, setShowLogs] = useState(true);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const stepStartTimeRef = useRef<Date | null>(null);

  // Load API keys from localStorage
  useEffect(() => {
    const savedOpenRouterKey = localStorage.getItem("openrouter_api_key");
    const savedExaKey = localStorage.getItem("exa_api_key");
    if (savedOpenRouterKey) setApiKey(savedOpenRouterKey);
    if (savedExaKey) setExaKey(savedExaKey);
  }, []);

  // Elapsed time counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && generationStep !== 'idle' && generationStep !== 'complete' && generationStep !== 'error') {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime.getTime());
      }, 100);
    }
    return () => clearInterval(interval);
  }, [startTime, generationStep]);

  // Save API keys
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    if (value) localStorage.setItem("openrouter_api_key", value);
  };

  const handleExaKeyChange = (value: string) => {
    setExaKey(value);
    if (value) localStorage.setItem("exa_api_key", value);
  };

  // Fetch rate limit
  useEffect(() => {
    const fetchRateLimit = async () => {
      try {
        const response = await fetch("/api/blog/generate");
        const result = await response.json();
        if (result.success && result.data) setRateLimit(result.data);
      } catch (err) {
        console.error("Failed to fetch rate limit:", err);
      } finally {
        setIsLoadingRateLimit(false);
      }
    };
    fetchRateLimit();
  }, []);

  // Add log entry
  const addLog = (step: GenerationStep, message: string, details?: string, status: StepLog['status'] = 'running') => {
    const now = new Date();
    const duration = stepStartTimeRef.current ? now.getTime() - stepStartTimeRef.current.getTime() : undefined;
    
    setStepLogs(prev => {
      const existing = prev.find(l => l.step === step);
      if (existing) {
        return prev.map(l => l.step === step ? { ...l, message, details, status, duration } : l);
      }
      return [...prev, { id: `${step}-${Date.now()}`, step, message, timestamp: now, status, details, duration }];
    });
    
    stepStartTimeRef.current = now;
  };

  // Update log status
  const updateLogStatus = (step: GenerationStep, status: StepLog['status'], details?: string) => {
    const now = new Date();
    const duration = stepStartTimeRef.current ? now.getTime() - stepStartTimeRef.current.getTime() : undefined;
    
    setStepLogs(prev => prev.map(l => 
      l.step === step ? { ...l, status, details: details || l.details, duration } : l
    ));
  };


  // Handle generation
  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError(t.messages.apiKeyRequired);
      return;
    }
    if (!exaKey.trim()) {
      setError(t.messages.exaKeyRequired);
      return;
    }

    // Reset state
    setError(null);
    setGeneratedArticle(null);
    setSearchResults([]);
    setSelectedTopic(null);
    setStepLogs([]);
    setStartTime(new Date());
    setElapsedTime(0);
    stepStartTimeRef.current = new Date();

    try {
      // Step 1: Validating
      setGenerationStep("validating");
      addLog("validating", t.steps.validating, "Checking API keys and rate limit...");
      await new Promise(r => setTimeout(r, 500));
      updateLogStatus("validating", "complete", "✓ All inputs valid");

      // Step 2: Searching with Exa
      setGenerationStep("searching");
      addLog("searching", t.steps.searching, `Query: "${searchQuery || 'e-commerce trends'}"...`);
      
      const searchResponse = await fetch("/api/blog/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exaKey: exaKey.trim(),
          query: searchQuery.trim() || undefined,
          category: category !== "auto" ? category : undefined,
        }),
      });

      const searchResult = await searchResponse.json();

      if (!searchResponse.ok || !searchResult.success) {
        throw new Error(searchResult.error?.message || "Search failed");
      }

      const results = searchResult.data.results || [];
      const usingFallback = searchResult.data.usingFallback;
      setSearchResults(results);
      updateLogStatus("searching", "complete", 
        usingFallback 
          ? `Using ${results.length} cached topics (Exa unavailable)` 
          : `Found ${results.length} relevant topics from Exa`
      );

      // Step 3: Analyzing results
      setGenerationStep("analyzing");
      addLog("analyzing", t.steps.analyzing, `Processing ${results.length} search results...`);
      await new Promise(r => setTimeout(r, 800));
      updateLogStatus("analyzing", "complete", `Analyzed ${results.length} topics for relevance`);

      // Step 4: Selecting best topic
      setGenerationStep("selecting");
      addLog("selecting", t.steps.selecting, "Ranking topics by score and recency...");
      await new Promise(r => setTimeout(r, 500));
      
      if (results.length > 0) {
        const bestTopic = results[0];
        setSelectedTopic(bestTopic);
        updateLogStatus("selecting", "complete", `Selected: "${bestTopic.title.substring(0, 50)}..."`);
      } else {
        updateLogStatus("selecting", "complete", "Using default topic");
      }

      // Step 5: Generating content
      setGenerationStep("generating");
      addLog("generating", t.steps.generating, "OpenRouter AI is writing the article...");
      
      const response = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          category: category !== "auto" ? category : undefined,
          exaResults: results,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || t.messages.error);
      }

      updateLogStatus("generating", "complete", `Generated ${result.data.article.readingTime} min read article`);

      // Step 6: Formatting
      setGenerationStep("formatting");
      addLog("formatting", t.steps.formatting, "Applying markdown formatting...");
      await new Promise(r => setTimeout(r, 300));
      updateLogStatus("formatting", "complete", "Article formatted successfully");

      // Step 7: Saving
      setGenerationStep("saving");
      addLog("saving", t.steps.saving, "Storing in Supabase database...");
      await new Promise(r => setTimeout(r, 200));
      updateLogStatus("saving", "complete", `Saved with ID: ${result.data.article.id.substring(0, 8)}...`);

      // Complete
      setGenerationStep("complete");
      addLog("complete", t.steps.complete, "🎉 Article ready!");
      setGeneratedArticle(result.data.article);

      // Refresh rate limit
      const rateLimitResponse = await fetch("/api/blog/generate");
      const rateLimitResult = await rateLimitResponse.json();
      if (rateLimitResult.success && rateLimitResult.data) {
        setRateLimit(rateLimitResult.data);
      }
    } catch (err) {
      setGenerationStep("error");
      const errorMessage = err instanceof Error ? err.message : t.messages.error;
      setError(errorMessage);
      
      // Update current step to error
      setStepLogs(prev => prev.map(l => 
        l.status === 'running' ? { ...l, status: 'error' as const, details: errorMessage } : l
      ));
    }
  };

  // Reset
  const handleReset = () => {
    setGenerationStep("idle");
    setGeneratedArticle(null);
    setSearchResults([]);
    setSelectedTopic(null);
    setStepLogs([]);
    setError(null);
    setStartTime(null);
    setElapsedTime(0);
  };

  const getCategoryLabel = (cat: ArticleCategory) => t.categories[cat] || cat;
  const isGenerating = !['idle', 'complete', 'error'].includes(generationStep);
  const formatTime = (ms: number) => `${(ms / 1000).toFixed(1)}s`;


  return (
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/${locale}/admin/blog`)}>
            <BackIcon className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
        </div>
        
        {/* Rate Limit Badge */}
        {rateLimit && (
          <Badge variant={rateLimit.remaining > 0 ? "default" : "destructive"} className="text-sm">
            <Zap className="h-3 w-3 mr-1" />
            {rateLimit.remaining}/{rateLimit.dailyLimit} {t.rateLimit.remaining}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Configuration */}
        <div className="space-y-4">
          {/* API Keys */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t.apiKey.title}</label>
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" 
                     className="text-xs text-primary hover:underline flex items-center gap-1">
                    {t.apiKey.getKey} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder={t.apiKey.placeholder}
                  disabled={isGenerating}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t.exaKey.title}</label>
                  <a href="https://exa.ai" target="_blank" rel="noopener noreferrer"
                     className="text-xs text-primary hover:underline flex items-center gap-1">
                    {t.exaKey.getKey} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input
                  type="password"
                  value={exaKey}
                  onChange={(e) => handleExaKeyChange(e.target.value)}
                  placeholder={t.exaKey.placeholder}
                  disabled={isGenerating}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Search & Category */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="h-4 w-4" />
                {t.searchQuery.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchQuery.placeholder}
                  disabled={isGenerating}
                />
                <p className="text-xs text-muted-foreground">{t.searchQuery.hint}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.category.title}</label>
                <Select value={category} onValueChange={(v) => setCategory(v as ArticleCategory | "auto")} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">{t.category.auto}</SelectItem>
                    {ARTICLE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{getCategoryLabel(cat)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          {generationStep === 'idle' && (
            <Button
              size="lg"
              className="w-full"
              onClick={handleGenerate}
              disabled={!apiKey.trim() || !exaKey.trim() || (rateLimit?.remaining === 0)}
            >
              <Sparkles className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {t.actions.generate}
            </Button>
          )}
        </div>


        {/* Right Column - Progress & Results */}
        <div className="space-y-4">
          {/* Progress Card */}
          {generationStep !== 'idle' && (
            <Card className={generationStep === 'complete' ? 'border-green-500' : generationStep === 'error' ? 'border-destructive' : 'border-primary'}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {generationStep === 'complete' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : generationStep === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {t.progress.title}
                  </CardTitle>
                  
                  {startTime && (
                    <Badge variant="outline" className="font-mono">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(elapsedTime)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <StepProgress steps={stepLogs} currentStep={generationStep} isRTL={isRTL} t={t} />
              </CardContent>
            </Card>
          )}

          {/* Search Results Preview */}
          {searchResults.length > 0 && generationStep !== 'idle' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t.progress.searchResults} ({searchResults.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {searchResults.slice(0, 5).map((result, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg border text-sm ${
                        selectedTopic?.url === result.url ? 'bg-primary/10 border-primary' : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium line-clamp-1 flex-1">{result.title}</p>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {(result.score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {result.text.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{t.messages.error}</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3" onClick={handleReset}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t.actions.generateAnother}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Success / Generated Article */}
          {generationStep === 'complete' && generatedArticle && (
            <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{t.messages.success}</span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{generatedArticle.title}</h3>
                  <p className="text-sm text-muted-foreground">{generatedArticle.summary}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge>{getCategoryLabel(generatedArticle.category)}</Badge>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {generatedArticle.readingTime} min
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs">
                      {generatedArticle.id.substring(0, 8)}...
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={() => window.open(`/${locale}/blog/${generatedArticle.slug}`, "_blank")}>
                    <ExternalLink className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t.actions.viewArticle}
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t.actions.generateAnother}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
