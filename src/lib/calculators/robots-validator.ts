/**
 * Robots.txt Validator Logic
 * 
 * Validates robots.txt content for syntax and best practices.
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  line: number;
  message: string;
  severity: ValidationSeverity;
  suggestion?: string;
}

export interface RobotsValidatorResult {
  isValid: boolean;
  issues: ValidationIssue[];
  userAgents: string[];
  sitemaps: string[];
  summary: {
    errorCount: number;
    warningCount: number;
    infoCount: number;
  };
}

// Valid directives in robots.txt
const VALID_DIRECTIVES = [
  'user-agent',
  'disallow',
  'allow',
  'sitemap',
  'crawl-delay',
  'host',
];

/**
 * Validates robots.txt content.
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */
export function validateRobotsTxt(content: string): RobotsValidatorResult {
  const issues: ValidationIssue[] = [];
  const userAgents: string[] = [];
  const sitemaps: string[] = [];
  
  // Handle empty input
  if (!content || !content.trim()) {
    return {
      isValid: false,
      issues: [{
        line: 0,
        message: 'Empty robots.txt file',
        severity: 'error',
        suggestion: 'Add at least one User-agent directive',
      }],
      userAgents: [],
      sitemaps: [],
      summary: { errorCount: 1, warningCount: 0, infoCount: 0 },
    };
  }
  
  const lines = content.split('\n');
  let hasUserAgent = false;
  let currentUserAgent: string | null = null;
  let hasRulesForCurrentAgent = false;
  
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }
    
    // Check for colon separator
    if (!line.includes(':')) {
      issues.push({
        line: lineNum,
        message: 'Invalid line format - missing colon separator',
        severity: 'error',
        suggestion: 'Each directive should be in format: Directive: value',
      });
      continue;
    }
    
    const colonIndex = line.indexOf(':');
    const directive = line.substring(0, colonIndex).trim().toLowerCase();
    const value = line.substring(colonIndex + 1).trim();
    
    // Check for valid directive
    if (!VALID_DIRECTIVES.includes(directive)) {
      issues.push({
        line: lineNum,
        message: `Unknown directive: ${directive}`,
        severity: 'warning',
        suggestion: `Valid directives are: ${VALID_DIRECTIVES.join(', ')}`,
      });
      continue;
    }
    
    // Process specific directives
    switch (directive) {
      case 'user-agent':
        if (!value) {
          issues.push({
            line: lineNum,
            message: 'User-agent directive has no value',
            severity: 'error',
            suggestion: 'Specify a user agent (e.g., * for all bots)',
          });
        } else {
          hasUserAgent = true;
          if (!userAgents.includes(value)) {
            userAgents.push(value);
          }
          // Check if previous user-agent had rules
          if (currentUserAgent && !hasRulesForCurrentAgent) {
            issues.push({
              line: lineNum - 1,
              message: `User-agent "${currentUserAgent}" has no rules`,
              severity: 'warning',
              suggestion: 'Add Allow or Disallow rules for this user agent',
            });
          }
          currentUserAgent = value;
          hasRulesForCurrentAgent = false;
        }
        break;
        
      case 'disallow':
      case 'allow':
        if (!hasUserAgent) {
          issues.push({
            line: lineNum,
            message: `${directive} directive before User-agent`,
            severity: 'error',
            suggestion: 'Add a User-agent directive before Allow/Disallow rules',
          });
        } else {
          hasRulesForCurrentAgent = true;
          // Check for valid path format
          if (value && !value.startsWith('/') && value !== '') {
            issues.push({
              line: lineNum,
              message: 'Path should start with /',
              severity: 'warning',
              suggestion: 'Paths should be absolute (e.g., /admin/)',
            });
          }
        }
        break;
        
      case 'sitemap':
        if (!value) {
          issues.push({
            line: lineNum,
            message: 'Sitemap directive has no URL',
            severity: 'error',
            suggestion: 'Provide a full URL to your sitemap',
          });
        } else {
          // Validate URL format
          try {
            new URL(value);
            if (!sitemaps.includes(value)) {
              sitemaps.push(value);
            }
          } catch {
            issues.push({
              line: lineNum,
              message: 'Invalid sitemap URL format',
              severity: 'error',
              suggestion: 'Use a full URL (e.g., https://example.com/sitemap.xml)',
            });
          }
        }
        break;
        
      case 'crawl-delay':
        if (!value) {
          issues.push({
            line: lineNum,
            message: 'Crawl-delay has no value',
            severity: 'error',
            suggestion: 'Specify a delay in seconds',
          });
        } else {
          const delay = parseFloat(value);
          if (isNaN(delay) || delay < 0) {
            issues.push({
              line: lineNum,
              message: 'Invalid crawl-delay value',
              severity: 'error',
              suggestion: 'Use a positive number (seconds)',
            });
          } else if (delay > 60) {
            issues.push({
              line: lineNum,
              message: 'Crawl-delay is very high',
              severity: 'warning',
              suggestion: 'High delays may slow down indexing',
            });
          }
        }
        break;
        
      case 'host':
        if (!value) {
          issues.push({
            line: lineNum,
            message: 'Host directive has no value',
            severity: 'error',
            suggestion: 'Specify your preferred domain',
          });
        }
        break;
    }
  }
  
  // Check if last user-agent had rules
  if (currentUserAgent && !hasRulesForCurrentAgent) {
    issues.push({
      line: lines.length,
      message: `User-agent "${currentUserAgent}" has no rules`,
      severity: 'warning',
      suggestion: 'Add Allow or Disallow rules for this user agent',
    });
  }
  
  // Check for missing User-agent
  if (!hasUserAgent) {
    issues.push({
      line: 0,
      message: 'No User-agent directive found',
      severity: 'error',
      suggestion: 'Add at least one User-agent directive (e.g., User-agent: *)',
    });
  }
  
  // Add info about sitemap
  if (sitemaps.length === 0) {
    issues.push({
      line: 0,
      message: 'No Sitemap directive found',
      severity: 'info',
      suggestion: 'Consider adding a Sitemap directive for better SEO',
    });
  }
  
  // Calculate summary
  const summary = {
    errorCount: issues.filter(i => i.severity === 'error').length,
    warningCount: issues.filter(i => i.severity === 'warning').length,
    infoCount: issues.filter(i => i.severity === 'info').length,
  };
  
  return {
    isValid: summary.errorCount === 0,
    issues,
    userAgents,
    sitemaps,
    summary,
  };
}
