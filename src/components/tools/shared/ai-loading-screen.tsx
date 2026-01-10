"use client";

/**
 * AI Loading Screen Component
 * Beautiful animated loading screen for AI processing
 */

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Sparkles, 
  FileSearch, 
  Calculator, 
  Lightbulb,
  CheckCircle2,
  Loader2
} from "lucide-react";

export type ProcessingStep = 'parsing' | 'classifying' | 'calculating' | 'analyzing' | 'complete';

interface AILoadingScreenProps {
  isVisible: boolean;
  currentStep: ProcessingStep;
  progress?: number;
  fileName?: string;
}

const stepIcons: Record<ProcessingStep, React.ReactNode> = {
  parsing: <FileSearch className="h-8 w-8" />,
  classifying: <Brain className="h-8 w-8" />,
  calculating: <Calculator className="h-8 w-8" />,
  analyzing: <Lightbulb className="h-8 w-8" />,
  complete: <CheckCircle2 className="h-8 w-8" />,
};

const stepOrder: ProcessingStep[] = ['parsing', 'classifying', 'calculating', 'analyzing', 'complete'];

export function AILoadingScreen({ 
  isVisible, 
  currentStep, 
  progress = 0,
  fileName 
}: AILoadingScreenProps) {
  const t = useTranslations("common.aiLoading");
  const locale = useLocale();
  const isRTL = locale === "ar";
  const [dots, setDots] = useState("");

  // Animated dots
  useEffect(() => {
    if (!isVisible || currentStep === 'complete') return;
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);
    return () => clearInterval(interval);
  }, [isVisible, currentStep]);

  const currentStepIndex = stepOrder.indexOf(currentStep);

  const getStepLabel = (step: ProcessingStep): string => {
    const labels: Record<ProcessingStep, Record<string, string>> = {
      parsing: { ar: "قراءة الملف", en: "Reading file" },
      classifying: { ar: "تصنيف البيانات", en: "Classifying data" },
      calculating: { ar: "حساب النتائج", en: "Calculating results" },
      analyzing: { ar: "تحليل ذكي", en: "AI Analysis" },
      complete: { ar: "اكتمل!", en: "Complete!" },
    };
    return labels[step][locale] || labels[step]["en"];
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md mx-4 p-8 bg-card rounded-2xl shadow-2xl border"
          >
            {/* Sparkles decoration */}
            <div className="absolute -top-3 -right-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-8 w-8 text-primary" />
              </motion.div>
            </div>
            <div className="absolute -bottom-2 -left-2">
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-6 w-6 text-primary/60" />
              </motion.div>
            </div>

            {/* Main content */}
            <div className="text-center space-y-6">
              {/* Animated brain icon */}
              <div className="relative mx-auto w-24 h-24">
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/20"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full bg-primary/30"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                />
                <div className="absolute inset-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  <motion.div
                    animate={{ 
                      rotateY: currentStep === 'complete' ? 0 : [0, 180, 360],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: currentStep === 'complete' ? 0 : Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {stepIcons[currentStep]}
                  </motion.div>
                </div>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-xl font-bold mb-1">
                  {currentStep === 'complete' 
                    ? (isRTL ? "تم التحليل بنجاح! ✨" : "Analysis Complete! ✨")
                    : (isRTL ? "الذكاء الاصطناعي يعمل" : "AI is Working")
                  }
                  {currentStep !== 'complete' && dots}
                </h3>
                {fileName && (
                  <p className="text-sm text-muted-foreground truncate max-w-xs mx-auto">
                    {fileName}
                  </p>
                )}
              </div>

              {/* Progress steps */}
              <div className="space-y-3">
                {stepOrder.slice(0, -1).map((step, index) => {
                  const isActive = index === currentStepIndex;
                  const isCompleted = index < currentStepIndex;
                  
                  return (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isActive 
                          ? "bg-primary/10 border border-primary/30" 
                          : isCompleted 
                            ? "bg-green-500/10" 
                            : "bg-muted/50"
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : isCompleted 
                            ? "bg-green-500 text-white" 
                            : "bg-muted text-muted-foreground"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isActive ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        isActive ? "text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground"
                      }`}>
                        {getStepLabel(step)}
                      </span>
                      {isActive && (
                        <motion.div
                          className="ms-auto"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Sparkles className="h-4 w-4 text-primary" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Progress bar */}
              {progress > 0 && (
                <div className="space-y-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{progress}%</p>
                </div>
              )}

              {/* Fun tip */}
              <motion.p
                className="text-xs text-muted-foreground italic"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {isRTL 
                  ? "💡 نصيحة: الذكاء الاصطناعي يحلل بياناتك بدقة عالية"
                  : "💡 Tip: AI is analyzing your data with high precision"
                }
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AILoadingScreen;
