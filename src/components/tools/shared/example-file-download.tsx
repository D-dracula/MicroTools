'use client';

import { useTranslations } from 'next-intl';
import { Download, FileText, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface ExampleFileDownloadProps {
  toolName: 'smart-profit-audit' | 'ad-spend-auditor' | 'inventory-forecaster' | 'review-insight' | 'catalog-cleaner';
  requiredColumns: string[];
  optionalColumns?: string[];
  className?: string;
}

const TOOL_FILE_MAP = {
  'smart-profit-audit': 'smart-profit-audit-example.csv',
  'ad-spend-auditor': 'ad-spend-auditor-example.csv', 
  'inventory-forecaster': 'inventory-forecaster-example.csv',
  'review-insight': 'review-insight-example.csv',
  'catalog-cleaner': 'catalog-cleaner-example.csv',
} as const;

export function ExampleFileDownload({ 
  toolName, 
  requiredColumns, 
  optionalColumns = [],
  className = '' 
}: ExampleFileDownloadProps) {
  const t = useTranslations('tools.shared.exampleFiles');
  
  const fileName = TOOL_FILE_MAP[toolName];
  const downloadUrl = `/test-data/${fileName}`;
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className={`border-primary/20 bg-primary/5 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-foreground">{t('title')}</h3>
              <Info className="w-4 h-4 text-primary" />
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {t('helpText')}
            </p>
            
            <div className="space-y-2 mb-3">
              <div>
                <span className="text-xs font-medium text-foreground mb-1 block">
                  {t('requiredColumns')}:
                </span>
                <div className="flex flex-wrap gap-1">
                  {requiredColumns.map((column) => (
                    <span key={column} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      {column}
                    </span>
                  ))}
                </div>
              </div>
              
              {optionalColumns.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-foreground mb-1 block">
                    {t('optionalColumns')}:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {optionalColumns.map((column) => (
                      <span key={column} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
                        {column}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleDownload}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('downloadExample')}
            </Button>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-border">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1">
              {t('tips.title')}
              <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <div>• {t('tips.columnNames')}</div>
              <div>• {t('tips.dateFormat')}</div>
              <div>• {t('tips.numbers')}</div>
              <div>• {t('tips.encoding')}</div>
              <div>• {t('tips.fileSize')}</div>
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}