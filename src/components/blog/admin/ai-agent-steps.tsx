"use client";

/**
 * AI Agent Steps Display Component
 * 
 * Shows detailed progress of AI Agent operations:
 * - Fetching existing articles
 * - Generating search queries
 * - Searching multiple sources
 * - Analyzing results
 * - Selecting best topic
 * - Generating content
 */

import { 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  Clock,
  Database,
  Search,
  Brain,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// ============================================================================
// Types
// ============================================================================

export interface AIAgentStep {
  id: string;
  phase: 'dedup' | 'query-gen' | 'search' | 'analysis' | 'selection' | 'generation';
  title: string;
  description: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  startTime?: Date;
  endTime?: Date;
  details?: {
    existingArticles?: number;
    queries?: string[];
    searchResults?: number;
    sources?: string[];
    selectedTopic?: string;
    relevanceScore?: number;
    uniqueAngle?: string;
    wordCount?: number;
  };
  error?: string;
}

interface AIAgentStepsProps {
  steps: AIAgentStep[];
  isRTL?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function AIAgentSteps({ steps, isRTL = false }: AIAgentStepsProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const getPhaseIcon = (phase: AIAgentStep['phase']) => {
    switch (phase) {
      case 'dedup': return <Database className="h-4 w-4" />;
      case 'query-gen': return <Brain className="h-4 w-4" />;
      case 'search': return <Search className="h-4 w-4" />;
      case 'analysis': return <Brain className="h-4 w-4" />;
      case 'selection': return <FileText className="h-4 w-4" />;
      case 'generation': return <Sparkles className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: AIAgentStep['status']) => {
    switch (status) {
      case 'running': return 'text-primary bg-primary/10 border-primary/30';
      case 'complete': return 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/30';
      case 'error': return 'text-destructive bg-destructive/10 border-destructive/30';
      default: return 'text-muted-foreground bg-muted/30 border-muted';
    }
  };

  const formatDuration = (start?: Date, end?: Date) => {
    if (!start) return null;
    const duration = end ? end.getTime() - start.getTime() : Date.now() - start.getTime();
    return `${(duration / 1000).toFixed(1)}s`;
  };

  if (steps.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          {isRTL ? "خطوات وكيل الذكاء الاصطناعي" : "AI Agent Steps"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step) => {
          const isExpanded = expandedSteps.has(step.id);
          const hasDetails = step.details && Object.keys(step.details).length > 0;
          const duration = formatDuration(step.startTime, step.endTime);

          return (
            <div
              key={step.id}
              className={`border rounded-lg transition-all ${getStatusColor(step.status)}`}
            >
              {/* Step Header */}
              <div className="p-3">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {step.status === 'running' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : step.status === 'complete' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : step.status === 'error' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      getPhaseIcon(step.phase)
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{step.title}</p>
                      {duration && (
                        <Badge variant="outline" className="text-xs font-mono">
                          <Clock className="h-3 w-3 mr-1" />
                          {duration}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>

                    {/* Error Message */}
                    {step.error && (
                      <div className="mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive">
                        {step.error}
                      </div>
                    )}
                  </div>

                  {/* Expand Button */}
                  {hasDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleStep(step.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && hasDetails && step.details && (
                <div className="px-3 pb-3 pt-0 space-y-2 border-t border-current/10">
                  {/* Existing Articles Count */}
                  {step.details.existingArticles !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {isRTL ? "المقالات الموجودة:" : "Existing Articles:"}
                      </span>
                      <Badge variant="secondary" className="font-mono">
                        {step.details.existingArticles}
                      </Badge>
                    </div>
                  )}

                  {/* Generated Queries */}
                  {step.details.queries && step.details.queries.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {isRTL ? "استعلامات البحث:" : "Search Queries:"}
                      </p>
                      <div className="space-y-1">
                        {step.details.queries.map((query, i) => (
                          <div key={i} className="text-xs bg-background/50 rounded px-2 py-1 font-mono">
                            {i + 1}. {query}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {step.details.searchResults !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {isRTL ? "نتائج البحث:" : "Search Results:"}
                      </span>
                      <Badge variant="secondary" className="font-mono">
                        {step.details.searchResults}
                      </Badge>
                    </div>
                  )}

                  {/* Sources Used */}
                  {step.details.sources && step.details.sources.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {isRTL ? "المصادر:" : "Sources:"}
                      </span>
                      <div className="flex gap-1">
                        {step.details.sources.map((source, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Topic */}
                  {step.details.selectedTopic && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {isRTL ? "الموضوع المختار:" : "Selected Topic:"}
                      </p>
                      <div className="text-xs bg-primary/5 border border-primary/20 rounded px-2 py-1.5">
                        {step.details.selectedTopic}
                      </div>
                    </div>
                  )}

                  {/* Relevance Score */}
                  {step.details.relevanceScore !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {isRTL ? "نسبة الصلة:" : "Relevance Score:"}
                      </span>
                      <Badge 
                        variant={step.details.relevanceScore >= 70 ? "default" : "secondary"}
                        className="font-mono"
                      >
                        {step.details.relevanceScore}%
                      </Badge>
                    </div>
                  )}

                  {/* Unique Angle */}
                  {step.details.uniqueAngle && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {isRTL ? "الزاوية الفريدة:" : "Unique Angle:"}
                      </p>
                      <div className="text-xs bg-background/50 rounded px-2 py-1.5 italic">
                        {step.details.uniqueAngle}
                      </div>
                    </div>
                  )}

                  {/* Word Count */}
                  {step.details.wordCount !== undefined && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {isRTL ? "عدد الكلمات:" : "Word Count:"}
                      </span>
                      <Badge variant="secondary" className="font-mono">
                        {step.details.wordCount.toLocaleString()}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
