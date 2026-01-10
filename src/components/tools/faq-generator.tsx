"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HelpCircle, Copy, Check, Plus, Trash2, Code, FileText, ChevronDown } from "lucide-react";
import {
  generateFAQ,
  getFAQTemplates,
  getFAQTemplateById,
  type FAQItem,
  type FAQResult,
} from "@/lib/calculators/faq-generator";

export function FAQGenerator() {
  const t = useTranslations("tools.faqGenerator");
  const locale = useLocale() as 'ar' | 'en';
  
  const [questions, setQuestions] = useState<FAQItem[]>([
    { question: '', answer: '' },
  ]);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const templates = useMemo(() => getFAQTemplates(locale), [locale]);

  // Generate FAQ in real-time
  const result: FAQResult | null = useMemo(() => {
    const validQuestions = questions.filter(q => 
      q.question.trim() !== '' && q.answer.trim() !== ''
    );
    
    if (validQuestions.length === 0) return null;

    return generateFAQ({
      questions: validQuestions,
      language: locale,
    });
  }, [questions, locale]);

  const handleQuestionChange = (index: number, field: 'question' | 'answer', value: string) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddQuestion = () => {
    setQuestions(prev => [...prev, { question: '', answer: '' }]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyTemplate = (templateId: string) => {
    const templateQuestions = getFAQTemplateById(templateId, locale);
    if (templateQuestions) {
      setQuestions(templateQuestions);
      setShowTemplates(false);
    }
  };

  const handleCopyText = async () => {
    if (!result?.formattedText) return;
    try {
      await navigator.clipboard.writeText(result.formattedText);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopySchema = async () => {
    if (!result?.schemaMarkup) return;
    try {
      await navigator.clipboard.writeText(result.schemaMarkup);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const validQuestionsCount = questions.filter(q => 
    q.question.trim() !== '' && q.answer.trim() !== ''
  ).length;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6" role="form" aria-label={t("title")}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selector */}
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("useTemplate")}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
            </Button>
            
            {showTemplates && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleApplyTemplate(template.id)}
                    className="text-start p-3 rounded-md border bg-background hover:bg-accent transition-colors"
                  >
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            <Label className="flex items-center justify-between">
              <span>{t("questionsAndAnswers")}</span>
              <span className="text-sm text-muted-foreground">
                {validQuestionsCount} {locale === 'ar' ? 'سؤال صالح' : 'valid questions'}
              </span>
            </Label>
            
            {questions.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {locale === 'ar' ? `سؤال ${index + 1}` : `Question ${index + 1}`}
                  </span>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveQuestion(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Input
                    placeholder={locale === 'ar' ? 'اكتب السؤال هنا...' : 'Enter question here...'}
                    value={item.question}
                    onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                    className="font-medium"
                  />
                </div>
                
                <div className="space-y-2">
                  <textarea
                    placeholder={locale === 'ar' ? 'اكتب الإجابة هنا...' : 'Enter answer here...'}
                    value={item.answer}
                    onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                    className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-sm resize-y"
                  />
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={handleAddQuestion}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t("addQuestion")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated FAQ Text Section */}
      {result?.formattedText && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("formattedFAQ")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyText}
                className="flex items-center gap-2"
              >
                {copiedText ? (
                  <>
                    <Check className="h-4 w-4" />
                    {locale === 'ar' ? 'تم النسخ' : 'Copied'}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {t("copy")}
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
                {result.formattedText}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* JSON-LD Schema Section */}
      {result?.schemaMarkup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                {t("schemaMarkup")}
                {result.isValidSchema && (
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded">
                    {locale === 'ar' ? 'صالح' : 'Valid'}
                  </span>
                )}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySchema}
                className="flex items-center gap-2"
              >
                {copiedSchema ? (
                  <>
                    <Check className="h-4 w-4" />
                    {locale === 'ar' ? 'تم النسخ' : 'Copied'}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {t("copySchema")}
                  </>
                )}
              </Button>
            </CardTitle>
            <CardDescription>
              {locale === 'ar' 
                ? 'أضف هذا الكود في قسم <head> من صفحتك لتظهر الأسئلة في نتائج بحث جوجل'
                : 'Add this code to the <head> section of your page to display FAQs in Google search results'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 rounded-lg p-4 max-h-[300px] overflow-y-auto">
              <pre className="text-sm text-slate-100 font-mono whitespace-pre-wrap" dir="ltr">
                <code>{`<script type="application/ld+json">\n${result.schemaMarkup}\n</script>`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      {validQuestionsCount === 0 && questions.some(q => q.question !== '' || q.answer !== '') && (
        <p className="text-sm text-muted-foreground text-center" role="alert">
          {locale === 'ar' 
            ? 'يرجى إدخال سؤال وإجابة واحدة على الأقل'
            : 'Please enter at least one question and answer'
          }
        </p>
      )}
    </div>
  );
}
