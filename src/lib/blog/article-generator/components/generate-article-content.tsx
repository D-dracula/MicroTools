"use client";

/**
 * Generate Article Content Component
 * 
 * Professional AI-powered article generation interface.
 * Uses multi-source search (NewsAPI + Exa) for fresh topics
 * and OpenRouter for content generation.
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
  Search,
  Globe,
  FileText,
  Brain,
  Database,
  Clock,
  ChevronDown,
  ChevronUp,
  Target,
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

interface SearchResult {
  title: string;
  url: string;
  publishedDate: string;
  score: number;
  text: string;
  source: 'exa' | 'newsapi' | 'fallback';
  sourceName?: string;
  author?: string;
}

interface AISearchPlan {
  queries: string[];
  reasoning: string;
}

interface AIFilterStats {
  totalResults: number;
  filteredResults: number;
  rejectedResults: number;
  filteringEnabled: boolean;
}

interface AITopicSelection {
  title: string;
  relevanceScore: number;
  uniqueAngle: string;
  suggestedCategory: string;
  reasoning: string;
}

interface AIAnalysis {
  searchPlan: AISearchPlan | null;
  filterStats: AIFilterStats | null;
  topicSelection: AITopicSelection | null;
  selectedTopic: {
    title: string;
    url: string;
    relevanceScore: number;
    uniqueAngle: string;
    suggestedCategory: string;
  } | null;
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
    subtitle: isRTL ? "أنشئ مقالاً احترافياً باستخدام NewsAPI + Exa + AI" : "Create a professional article using NewsAPI + Exa + AI",
    back: isRTL ? "العودة" : "Back",

    apiKey: {
      title: isRTL ? "مفتاح OpenRouter API" : "OpenRouter API Key",
      placeholder: isRTL ? "sk-or-v1-..." : "sk-or-v1-...",
      hint: isRTL ? "للتوليد بالذكاء الاصطناعي" : "For AI content generation",
      getKey: isRTL ? "احصل على مفتاح" : "Get Key",
    },

    exaKey: {
      title: isRTL ? "مفتاح Exa API (اختياري)" : "Exa API Key (optional)",
      placeholder: isRTL ? "أدخل مفتاح Exa..." : "Enter Exa key...",
      hint: isRTL ? "للبحث العميق - يستخدم مفتاح السيرفر إذا فارغ" : "For deep search - uses server key if empty",
      getKey: isRTL ? "احصل على مفتاح" : "Get Key",
    },

    newsApiKey: {
      title: isRTL ? "مفتاح NewsAPI (اختياري)" : "NewsAPI Key (optional)",
      placeholder: isRTL ? "أدخل مفتاح NewsAPI..." : "Enter NewsAPI key...",
      hint: isRTL ? "للأخبار الحديثة - يستخدم مفتاح السيرفر إذا فارغ" : "For fresh news - uses server key if empty",
      getKey: isRTL ? "احصل على مفتاح" : "Get Key",
    },

    searchQuery: {
      title: isRTL ? "موضوع البحث" : "Search Topic",
      placeholder: isRTL ? "مثال: اتجاهات التجارة الإلكترونية 2026" : "e.g., e-commerce trends 2026",
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

    actions: {
      generate: isRTL ? "🚀 إطلاق الوكلاء" : "🚀 Launch Agents",
      generating: isRTL ? "الوكلاء يعملون..." : "Agents Working...",
      viewArticle: isRTL ? "عرض المقال" : "View Article",
      generateAnother: isRTL ? "توليد مقال آخر" : "Generate Another",
      showLogs: isRTL ? "عرض العمليات" : "Show Operations",
      hideLogs: isRTL ? "إخفاء العمليات" : "Hide Operations",
    },

    steps: {
      validating: isRTL ? "التحقق من صلاحية الوكلاء..." : "Validating Agent Access...",
      searching: isRTL ? "وكيل البحث: استكشاف المواضيع..." : "Search Agent: Exploring Topics...",
      analyzing: isRTL ? "وكيل الفلترة: تحليل جودة النتائج..." : "Filter Agent: Analyzing Relevance...",
      selecting: isRTL ? "وكيل التحرير: اختيار أفضل فرصة..." : "Editorial Agent: Selecting Best Topic...",
      generating: isRTL ? "وكيل المحتوى: صياغة المقال..." : "Content Agent: Writing Article...",
      formatting: isRTL ? "وكيل التنسيق: تحسين المظهر..." : "Format Agent: Polishing Content...",
      saving: isRTL ? "تحزين البيانات..." : "Storing Data...",
      complete: isRTL ? "اكتملت مهمة الوكلاء!" : "Agent Mission Complete!",
    },

    progress: {
      title: isRTL ? "تقدم مهمة الوكلاء" : "Agent Mission Progress",
      logs: isRTL ? "سجل اتصالات الوكلاء" : "Agent Communication Log",
      elapsed: isRTL ? "الوقت النشط" : "Active Session Time",
      searchResults: isRTL ? "قاعدة معرفة البحث" : "Search Knowledge Base",
      selectedTopic: isRTL ? "فرصة المحتوى المختارة" : "Selected Content Opportunity",
    },

    messages: {
      success: isRTL ? "🎉 تم توليد المقال بنجاح!" : "🎉 Article generated successfully!",
      error: isRTL ? "حدث خطأ" : "An error occurred",
      apiKeyRequired: isRTL ? "مفتاح OpenRouter مطلوب" : "OpenRouter key required",
      searchKeyRequired: isRTL ? "مطلوب مفتاح واحد على الأقل (Exa أو NewsAPI)" : "At least one search key required (Exa or NewsAPI)",
    },

    sources: {
      newsapi: "NewsAPI",
      exa: "Exa",
      fallback: isRTL ? "مخزن مؤقت" : "Cached",
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
    <div className="space-y-3">
      {allSteps.map((step, index) => {
        const status = getStepStatus(step);
        const stepLog = steps.find(s => s.step === step);

        return (
          <div
            key={step}
            className={`flex flex-col gap-1 p-3 rounded-xl border transition-all duration-300 ${status === 'running'
              ? 'bg-primary/5 border-primary/30 shadow-md scale-[1.02]'
              : status === 'complete'
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-muted/20 border-transparent opacity-60'
              }`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${status === 'running' ? 'bg-primary text-primary-foreground animate-pulse' :
                status === 'complete' ? 'bg-green-500 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                {status === 'running' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : status === 'complete' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  getStepIcon(step)
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${status === 'running' ? 'text-primary' :
                  status === 'complete' ? 'text-green-700 dark:text-green-400' :
                    'text-muted-foreground'
                  }`}>
                  {t.steps[step as keyof typeof t.steps] || step}
                </p>

                {stepLog?.details && (
                  <p className={`text-[11px] leading-tight mt-1 ${status === 'running' ? 'text-primary/70 animate-pulse font-medium' : 'text-muted-foreground'
                    }`}>
                    {stepLog.details}
                  </p>
                )}
              </div>

              {stepLog?.duration && status === 'complete' && (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-mono font-medium text-muted-foreground">
                    {(stepLog.duration / 1000).toFixed(1)}s
                  </span>
                </div>
              )}
            </div>
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
  const [newsApiKey, setNewsApiKey] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<ArticleCategory | "auto">("auto");
  const [generationStep, setGenerationStep] = useState<GenerationStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<SearchResult | null>(null);
  const [stepLogs, setStepLogs] = useState<StepLog[]>([]);
  const [showLogs, setShowLogs] = useState(true);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sourcesUsed, setSourcesUsed] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [showAIDetails, setShowAIDetails] = useState(true);

  const stepStartTimeRef = useRef<Date | null>(null);

  // Load API keys from localStorage
  useEffect(() => {
    const savedOpenRouterKey = localStorage.getItem("openrouter_api_key");
    const savedExaKey = localStorage.getItem("exa_api_key");
    const savedNewsApiKey = localStorage.getItem("newsapi_key");
    if (savedOpenRouterKey) setApiKey(savedOpenRouterKey);
    if (savedExaKey) setExaKey(savedExaKey);
    if (savedNewsApiKey) setNewsApiKey(savedNewsApiKey);
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

  const handleNewsApiKeyChange = (value: string) => {
    setNewsApiKey(value);
    if (value) localStorage.setItem("newsapi_key", value);
  };

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
    // Note: Search keys are optional - server will use env keys if not provided

    // Reset state
    setError(null);
    setGeneratedArticle(null);
    setSearchResults([]);
    setSelectedTopic(null);
    setStepLogs([]);
    setStartTime(new Date());
    setElapsedTime(0);
    setSourcesUsed([]);
    stepStartTimeRef.current = new Date();

    try {
      // Step 1: Validating
      setGenerationStep("validating");
      addLog("validating", t.steps.validating, "Agent [SYSLOG]: Initializing secure connection to OpenRouter...");
      await new Promise(r => setTimeout(r, 400));
      addLog("validating", t.steps.validating, "Agent [AUTH]: Verifying administrative credentials and rate limits...");
      await new Promise(r => setTimeout(r, 300));
      updateLogStatus("validating", "complete", "✓ Protocol established. All systems ready for mission.");

      // Step 2: Searching with NewsAPI + Exa
      setGenerationStep("searching");
      const searchSources = [
        newsApiKey.trim() ? "NewsAPI" : null,
        exaKey.trim() ? "Exa" : null,
      ].filter(Boolean).join(" + ") || "Server Keys";
      addLog("searching", t.steps.searching, `Agent [NET]: Dispatching research drones to ${searchSources}...`);

      const searchResponse = await fetch("/api/blog/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exaKey: exaKey.trim() || undefined,
          newsApiKey: newsApiKey.trim() || undefined,
          openRouterKey: apiKey.trim() || undefined, // Required for AI Agent
          query: searchQuery.trim() || undefined,
          category: category !== "auto" ? category : undefined,
          fetchFullContent: true, // Enable deep content fetching
          useAIFilter: true, // Enable AI Agent filtering
        }),
      });

      const searchResult = await searchResponse.json();

      if (!searchResponse.ok || !searchResult.success) {
        throw new Error(searchResult.error?.message || "Search failed");
      }

      const results = searchResult.data.results || [];
      const usingFallback = searchResult.data.usingFallback;
      const sources = searchResult.data.sourcesUsed || [];
      const aiAgentUsed = searchResult.data.aiAgentUsed || false;
      const aiAnalysisData = searchResult.data.aiAnalysis || null;

      addLog("searching", t.steps.searching, "Agent [NET]: Data stream received. Parsing raw search packets...");
      await new Promise(r => setTimeout(r, 400));

      setSearchResults(results);
      setSourcesUsed(sources);
      setAiAnalysis(aiAnalysisData);

      updateLogStatus("searching", "complete",
        usingFallback
          ? `Using ${results.length} cached topics`
          : aiAgentUsed
            ? `AI Agent found ${results.length} topics from ${sources.join(" + ")}`
            : `Found ${results.length} topics from ${sources.join(" + ")}`
      );

      // Step 3: Analyzing results (AI filtering if enabled)
      setGenerationStep("analyzing");
      if (aiAnalysisData?.filterStats) {
        addLog("analyzing", t.steps.analyzing,
          `AI Filter: Analyzing ${aiAnalysisData.filterStats.totalResults} results...`);
        await new Promise(r => setTimeout(r, 800));
        updateLogStatus("analyzing", "complete",
          `AI filtered: Kept ${aiAnalysisData.filterStats.filteredResults}/${aiAnalysisData.filterStats.totalResults} (rejected ${aiAnalysisData.filterStats.rejectedResults} irrelevant)`);
      } else {
        addLog("analyzing", t.steps.analyzing, `Processing ${results.length} search results...`);
        await new Promise(r => setTimeout(r, 800));
        updateLogStatus("analyzing", "complete", `Analyzed ${results.length} topics for relevance`);
      }

      // Step 4: Selecting best topic (AI selection if enabled)
      setGenerationStep("selecting");
      if (aiAnalysisData?.topicSelection) {
        const selection = aiAnalysisData.topicSelection;
        addLog("selecting", t.steps.selecting, `Agent Reasoning: ${selection.reasoning.substring(0, 100)}...`);
        await new Promise(r => setTimeout(r, 800));
        if (results.length > 0) {
          setSelectedTopic(results[0]);
        }
        updateLogStatus("selecting", "complete",
          `Selected "${selection.title.substring(0, 40)}..." with ${selection.relevanceScore}% relevance score.`);
      } else {
        addLog("selecting", t.steps.selecting, "Ranking topics by traditional relevance algorithms...");
        await new Promise(r => setTimeout(r, 800));
        if (results.length > 0) {
          const bestTopic = results[0];
          setSelectedTopic(bestTopic);
          updateLogStatus("selecting", "complete", `Selected: "${bestTopic.title.substring(0, 50)}..."`);
        } else {
          updateLogStatus("selecting", "complete", "Using default topic due to empty search results.");
        }
      }

      // Step 5: Generating content
      setGenerationStep("generating");
      addLog("generating", t.steps.generating, "Agent [LMM]: Synthesizing research data and establishing narrative structure...");
      await new Promise(r => setTimeout(r, 600));
      addLog("generating", t.steps.generating, "Agent [CONTENT]: Drafting comprehensive 1500+ word article with SEO architecture...");

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

      updateLogStatus("generating", "complete", `Content core drafted: ${result.data.article.readingTime} min read.`);

      // Step 6: Formatting
      setGenerationStep("formatting");
      addLog("formatting", t.steps.formatting, "Agent [FORMAT]: Injecting interactive content blocks (Pro-tips, Comparison tables, Info boxes)...");
      await new Promise(r => setTimeout(r, 800));
      updateLogStatus("formatting", "complete", "✓ Semantic HTML and SEO metadata optimized.");

      // Step 7: Saving
      setGenerationStep("saving");
      addLog("saving", t.steps.saving, "Agent [DB]: Committing article to persistent storage and notifying search indices...");
      await new Promise(r => setTimeout(r, 500));
      updateLogStatus("saving", "complete", `Saved with ID: ${result.data.article.id.substring(0, 8)}... ✓ Transaction complete.`);

      // Complete
      setGenerationStep("complete");
      addLog("complete", t.steps.complete, "🎉 Deployment successful. Article is now live!");
      setGeneratedArticle(result.data.article);
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
    setSourcesUsed([]);
    setAiAnalysis(null);
  };

  const getCategoryLabel = (cat: ArticleCategory) => t.categories[cat] || cat;
  const getSourceLabel = (source: string) => (t.sources as Record<string, string>)[source] || source;
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

              {/* NewsAPI Key - Primary for fresh news */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    {t.newsApiKey.title}
                    <Badge variant="secondary" className="text-xs">Fresh News</Badge>
                  </label>
                  <a href="https://newsapi.org/register" target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1">
                    {t.newsApiKey.getKey} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Input
                  type="password"
                  value={newsApiKey}
                  onChange={(e) => handleNewsApiKeyChange(e.target.value)}
                  placeholder={t.newsApiKey.placeholder}
                  disabled={isGenerating}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">{t.newsApiKey.hint}</p>
              </div>

              {/* Exa Key - For deep search */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    {t.exaKey.title}
                    <Badge variant="outline" className="text-xs">Deep Search</Badge>
                  </label>
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
                <p className="text-xs text-muted-foreground">{t.exaKey.hint}</p>
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
              disabled={!apiKey.trim()}
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
                  {sourcesUsed.length > 0 && (
                    <div className="flex gap-1 ml-auto">
                      {sourcesUsed.map(source => (
                        <Badge key={source} variant="outline" className="text-xs">
                          {getSourceLabel(source)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {searchResults.slice(0, 5).map((result, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-lg border text-sm ${selectedTopic?.url === result.url ? 'bg-primary/10 border-primary' : 'bg-muted/30'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium line-clamp-1 flex-1">{result.title}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Badge variant={result.source === 'newsapi' ? 'default' : 'secondary'} className="text-xs">
                            {getSourceLabel(result.source)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {(result.score * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                        {result.sourceName && <span className="font-medium">{result.sourceName} • </span>}
                        {result.text.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Agent System Monitor (Premium Design) */}
          {aiAnalysis && (
            <Card className="border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20 overflow-hidden shadow-lg shadow-purple-500/10 active:scale-[0.99] transition-all relative">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 animate-pulse" />
              <CardHeader className="pb-3 bg-purple-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg shadow-lg shadow-purple-500/30">
                      <Brain className="h-4 w-4 text-white animate-pulse" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-black tracking-tight text-purple-700 dark:text-purple-300">
                        {isRTL ? "مراقب نظام الوكلاء AI" : "AI AGENT SYSTEM MONITOR"}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                        <p className="text-[9px] text-purple-600/70 dark:text-purple-400/70 font-mono font-bold uppercase tracking-widest">
                          {isRTL ? "الحالة: نظام نشط" : "Core Status: Online"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAIDetails(!showAIDetails)}
                    className="h-8 w-8 p-0 rounded-full hover:bg-purple-200/50 dark:hover:bg-purple-800/50"
                  >
                    {showAIDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>

              {showAIDetails && (
                <CardContent className="pt-4 space-y-6">
                  {/* Research Agent Section */}
                  {aiAnalysis.searchPlan && (
                    <div className="relative pl-6 border-l-2 border-purple-200 dark:border-purple-800 space-y-3">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-purple-500 border-2 border-white dark:border-gray-900" />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">{isRTL ? "وكيل البحث" : "Research Agent"}</span>
                        <div className="h-px flex-1 bg-purple-100 dark:bg-purple-900" />
                      </div>
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-lg bg-white/50 dark:bg-black/20 border border-purple-100 dark:border-purple-900/50">
                          <p className="text-xs italic text-muted-foreground flex items-start gap-2 leading-relaxed">
                            <span className="text-purple-500 font-bold shrink-0">AID-COG:</span>
                            {aiAnalysis.searchPlan.reasoning}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5 ml-2">
                          {aiAnalysis.searchPlan.queries.map((query, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] font-mono bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 py-0.5">
                              <Search className="h-2 w-2 mr-1" />
                              {query}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Knowledge Filter Agent Section */}
                  {aiAnalysis.filterStats && (
                    <div className="relative pl-6 border-l-2 border-orange-200 dark:border-orange-800/30 space-y-3">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-500 border-2 border-white dark:border-gray-900" />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500">{isRTL ? "وكيل تصفية المعرفة" : "Knowledge Filter Agent"}</span>
                        <div className="h-px flex-1 bg-orange-100 dark:bg-orange-900/20" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 ml-2">
                        <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-center shadow-sm">
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black">{aiAnalysis.filterStats.totalResults}</p>
                          <p className="text-[8px] text-muted-foreground uppercase font-bold">{isRTL ? "المواضيع" : "Found"}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 text-center shadow-sm">
                          <p className="text-[10px] text-green-600 dark:text-green-400 font-black">{aiAnalysis.filterStats.filteredResults}</p>
                          <p className="text-[8px] text-muted-foreground uppercase font-bold text-green-600">{isRTL ? "مقبول" : "Kept"}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-center shadow-sm">
                          <p className="text-[10px] text-red-600 dark:text-red-400 font-black">{aiAnalysis.filterStats.rejectedResults}</p>
                          <p className="text-[8px] text-muted-foreground uppercase font-bold text-red-600">{isRTL ? "مستبعد" : "Rejected"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Editorial Strategy Agent Section */}
                  {aiAnalysis.topicSelection && (
                    <div className="relative pl-6 border-l-2 border-green-200 dark:border-green-800/30 space-y-3">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-900" />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">{isRTL ? "وكيل التحرير الإستراتيجي" : "Strategic Editorial Agent"}</span>
                        <div className="h-px flex-1 bg-green-100 dark:bg-green-900/20" />
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/50 dark:border-green-800 shadow-sm ml-2">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h4 className="text-xs font-bold text-green-800 dark:text-green-200 leading-tight flex-1">{aiAnalysis.topicSelection.title}</h4>
                          <Badge className="bg-green-600 hover:bg-green-700 text-white text-[9px] font-black tracking-tighter shrink-0 px-1.5 h-4">
                            {aiAnalysis.topicSelection.relevanceScore}% MATCH
                          </Badge>
                        </div>
                        <div className="space-y-2 mt-3">
                          <div className="flex items-start gap-2 text-[10px]">
                            <Target className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                            <p className="leading-relaxed"><span className="font-bold text-green-700 dark:text-green-300">{isRTL ? "الزاوية الفريدة: " : "Unique Angle: "}</span>{aiAnalysis.topicSelection.uniqueAngle}</p>
                          </div>
                          <div className="flex items-start gap-2 text-[10px]">
                            <Brain className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                            <p className="leading-relaxed"><span className="font-bold text-green-700 dark:text-green-300">{isRTL ? "التحليل الإستراتيجي: " : "Strategic Reasoning: "}</span>{aiAnalysis.topicSelection.reasoning}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
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
