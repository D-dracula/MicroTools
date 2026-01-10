'use client';

/**
 * AI File Upload Component
 * Drag-and-drop file upload with progress indicator and preview
 * 
 * Requirements: 7.1, 7.4
 */

import { useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, File, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseFile, ParsedFile, getFileTypeLabel, getPlatformLabel } from '@/lib/ai-tools/file-parser';
import { validateFile, getFileSizeDisplay, SUPPORTED_EXTENSIONS, ValidationOptions } from '@/lib/ai-tools/file-validation';

interface AIFileUploadProps {
  onFileProcessed: (result: ParsedFile) => void;
  onError?: (error: string) => void;
  onFileSelected?: (fileName: string) => void;
  accept?: string;
  toolType?: 'sales' | 'reviews' | 'catalog' | 'inventory' | 'ads';
  maxSizeMB?: number;
  showPreview?: boolean;
  className?: string;
}

type UploadStatus = 'idle' | 'validating' | 'parsing' | 'success' | 'error';

export function AIFileUpload({
  onFileProcessed,
  onError,
  onFileSelected,
  accept = '.csv,.xlsx,.xls,.txt',
  toolType,
  maxSizeMB = 10,
  showPreview = true,
  className = '',
}: AIFileUploadProps) {
  const t = useTranslations('common');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedFile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStatus('idle');
    setSelectedFile(null);
    setParsedResult(null);
    setErrorMessage('');
  }, []);

  const processFile = useCallback(async (file: File) => {
    setSelectedFile(file);
    setErrorMessage('');
    setStatus('validating');
    
    // Notify parent about file selection
    onFileSelected?.(file.name);

    const validationOptions: ValidationOptions = {
      maxSizeBytes: maxSizeMB * 1024 * 1024,
      toolType,
    };
    const validation = validateFile(file, validationOptions);

    if (!validation.isValid) {
      const error = validation.errors.join('. ');
      setErrorMessage(error);
      setStatus('error');
      onError?.(error);
      return;
    }

    setStatus('parsing');
    const result = await parseFile(file);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to process file');
      setStatus('error');
      onError?.(result.error || 'Failed to process file');
      return;
    }

    setParsedResult(result);
    setStatus('success');
    onFileProcessed(result);
  }, [maxSizeMB, toolType, onFileProcessed, onError, onFileSelected]);


  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'validating':
      case 'parsing':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Upload className="w-8 h-8 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'validating':
        return 'Validating file...';
      case 'parsing':
        return 'Reading data...';
      case 'success':
        return 'File uploaded successfully';
      case 'error':
        return errorMessage;
      default:
        return 'Drag file here or click to select';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        onClick={status === 'idle' || status === 'error' ? handleClick : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${status === 'idle' || status === 'error' ? 'cursor-pointer hover:border-primary hover:bg-muted/50' : ''}
          ${status === 'error' ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : ''}
          ${status === 'success' ? 'border-green-300 bg-green-50 dark:bg-green-950/20' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-3">
          {getStatusIcon()}
          <p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}>
            {getStatusText()}
          </p>
          {status === 'idle' && (
            <p className="text-xs text-muted-foreground">
              {t('supportedFormats')}: {SUPPORTED_EXTENSIONS.join(', ').toUpperCase()} ({t('maxSize')}: {maxSizeMB}MB)
            </p>
          )}
        </div>
      </div>


      {/* File Preview */}
      {showPreview && selectedFile && status === 'success' && parsedResult && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {getFileSizeDisplay(selectedFile.size)} • {getFileTypeLabel(parsedResult.fileType)}
                  {parsedResult.platform && parsedResult.platform !== 'unknown' && (
                    <> • {getPlatformLabel(parsedResult.platform)}</>
                  )}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={resetState}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Data Preview */}
          {parsedResult.data && parsedResult.data.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {parsedResult.rowCount} {t('rows')} • {parsedResult.headers?.length || 0} {t('columns')}
              </p>
              
              {/* Headers Preview */}
              {parsedResult.headers && parsedResult.headers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {parsedResult.headers.slice(0, 6).map((header, idx) => (
                    <span key={idx} className="text-xs bg-background px-2 py-1 rounded border">
                      {header}
                    </span>
                  ))}
                  {parsedResult.headers.length > 6 && (
                    <span className="text-xs text-muted-foreground px-2 py-1">
                      +{parsedResult.headers.length - 6} {t('more')}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Text File Preview */}
          {parsedResult.rawText && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {parsedResult.rowCount} {t('lines')}
              </p>
              <pre className="text-xs bg-background p-2 rounded border max-h-32 overflow-auto">
                {parsedResult.rawText.slice(0, 500)}
                {parsedResult.rawText.length > 500 && '...'}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Error State with Retry */}
      {status === 'error' && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={resetState}>
            {t('tryAgain')}
          </Button>
        </div>
      )}
    </div>
  );
}

export default AIFileUpload;
