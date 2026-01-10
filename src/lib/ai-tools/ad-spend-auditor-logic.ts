/**
 * Ad Spend Auditor Module - Simplified Direct Analysis
 * AI-powered campaign performance analysis
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { chat, chatWithTools, estimateTokens, type ChatMessage } from './openrouter-client';
import {
  parseNumber,
  parseDate,
  selectDiverseSample,
  formatSampleForAI,
  validateData,
  explainDataProblem,
  generateFallbackExplanation,
  keywordClassify,
  logStep,
  logComplete,
  getLanguageInstruction,
  formatCurrency,
  formatNumber,
  formatPercentage,
  getCommonLabel,
  type ValidationResult,
} from './shared-utils';

// Types
export interface CampaignRecord {
  campaignId: string;
  campaignName: string;
  platform: 'facebook' | 'tiktok' | 'google' | 'snapchat' | 'instagram' | 'unknown';
  spend: number;
  revenue: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  date?: string;
}

export interface CampaignAnalysis {
  campaignId: string;
  campaignName: string;
  platform: string;
  spend: number;
  revenue: number;
  profit: number;
  roi: number;
  roas: number;
  cpa: number;
  cpc: number;
  ctr: number;
  conversionRate: number;
  conversions: number;
  clicks: number;
  impressions: number;
  isProfitable: boolean;
  profitPerConversion: number;
  status: 'profitable' | 'break_even' | 'unprofitable';
}

export interface CampaignRecommendation {
  campaignId: string;
  campaignName: string;
  action: 'stop' | 'reduce' | 'maintain' | 'increase';
  reason: string;
  potentialSavings?: number;
  priority: 'high' | 'medium' | 'low';
}

export interface AdAuditSummary {
  totalAdSpend: number;
  totalRevenue: number;
  totalProfit: number;
  overallROI: number;
  overallROAS: number;
  wastedBudget: number;
  totalCampaigns: number;
  profitableCampaigns: number;
  unprofitableCampaigns: number;
  breakEvenCampaigns: number;
  averageCPA: number;
  averageCPC: number;
  totalConversions: number;
  totalClicks: number;
  totalImpressions: number;
}

export interface AdAuditResult {
  campaignPerformance: CampaignAnalysis[];
  summary: AdAuditSummary;
  profitableCampaigns: string[];
  unprofitableCampaigns: string[];
  recommendations: CampaignRecommendation[];
  aiInsights: string[];
  tokensUsed: number;
  processingTime: number;
}

export interface AdAuditData {
  campaigns: CampaignRecord[];
  platform: string;
  dateRange: { start: string; end: string };
  totalRows: number;
  // Data quality info
  dataQuality?: {
    skippedRows: number;
    warnings: string[];
    explanation?: string;
  };
}

// AI Prompt Templates
const RECOMMENDATIONS_SYSTEM_PROMPT_BASE = `You are a digital marketing consultant specializing in ad campaign optimization.

Based on the campaign analysis provided, give practical recommendations to improve ROI.

Provide 3-5 specific and actionable recommendations.
Focus on:
1. Stopping losing campaigns
2. Increasing budget for profitable campaigns
3. Improving audience targeting
4. Reducing customer acquisition cost

Return the result as a JSON array of strings only.`;

/**
 * Get recommendations prompt with locale-specific response language
 */
function getRecommendationsPrompt(responseLanguage?: string): string {
  const languageInstruction = getLanguageInstruction(responseLanguage);
  return `${RECOMMENDATIONS_SYSTEM_PROMPT_BASE}\n\n${languageInstruction}`;
}

const AD_DATA_PARSER_SYSTEM_PROMPT = `You are a data analyst specializing in advertising campaign data. Your task is to correctly identify and extract campaign performance data.

CRITICAL RULES:
1. Spend is the ADVERTISING COST (what was paid to the platform)
2. Revenue is the SALES GENERATED from the campaign
3. Look for columns like: "Spend", "Cost", "Amount Spent" for advertising costs
4. Look for columns like: "Revenue", "Sales", "Conversions Value" for revenue generated
5. Platform can be inferred from campaign names or explicit platform columns

Extract for each row:
- campaignId: campaign identifier
- campaignName: campaign name  
- platform: advertising platform (facebook, tiktok, google, snapchat, instagram, unknown)
- spend: advertising cost (what was paid to platform)
- revenue: sales revenue generated from campaign
- impressions: number of impressions (optional)
- clicks: number of clicks (optional)
- conversions: number of conversions (optional)
- date: campaign date (format as YYYY-MM-DD)

IMPORTANT: Spend and Revenue are different - don't confuse them!

Return JSON format:
{"campaigns": [{"campaignId": "...", "campaignName": "...", "platform": "...", "spend": 0, "revenue": 0, "impressions": 0, "clicks": 0, "conversions": 0, "date": "YYYY-MM-DD"}]}`;

// Platform detection patterns
const PLATFORM_PATTERNS: Record<string, string[]> = {
  facebook: ['facebook', 'fb', 'meta'],
  tiktok: ['tiktok', 'tt'],
  google: ['google', 'adwords', 'ads'],
  snapchat: ['snapchat', 'snap'],
  instagram: ['instagram', 'ig'],
};

/**
 * Parse campaign data using AI - simplified single file approach
 */
export async function parseAdData(
  apiKey: string,
  data: Record<string, unknown>[],
  headers: string[] | Record<string, unknown>,
  options: { locale?: string; currency?: string } = {}
): Promise<AdAuditData> {
  const { locale = 'en', currency = 'USD' } = options;
  
  // Ensure headers is an array
  const headerArray = Array.isArray(headers) 
    ? headers 
    : Object.keys(headers);
  
  // Validate data first
  console.log('   🔍 Validating campaign data...');
  const validation = validateData(data, headerArray, {
    requiredKeywords: ['spend', 'cost', 'revenue', 'sales', 'campaign'],
    minRows: 1,
    maxRows: 10000,
  });
  
  if (!validation.isValid) {
    console.log('   ❌ Validation failed:', validation.errors);
    throw new Error(validation.errors.join('. '));
  }
  
  console.log(`   ✅ Validation passed: ${validation.stats.validRows}/${validation.stats.totalRows} valid rows`);

  // Select diverse sample rows for AI (9 rows representing different scenarios)
  const sampleRows = selectDiverseSample(data, headerArray, 9);
  const dataPreview = formatSampleForAI(headerArray, sampleRows, data.length);

  console.log(`   📄 Sending ${sampleRows.length} diverse sample rows to AI (file has ${data.length} rows)`);

  const messages: ChatMessage[] = [
    { role: 'system', content: AD_DATA_PARSER_SYSTEM_PROMPT },
    { role: 'user', content: `Analyze the following campaign data:\n\n${dataPreview}` }
  ];

  try {
    const response = await chat(apiKey, messages, { temperature: 0.1, maxTokens: 2000 });
    const parsed = JSON.parse(response.content);
    
    if (parsed.campaigns && Array.isArray(parsed.campaigns)) {
      console.log('   🗺️ AI returned campaign data, processing all rows...');
      
      const campaigns: CampaignRecord[] = [];
      let minDate = '';
      let maxDate = '';
      let skippedRows = 0;
      let detectedPlatform = 'unknown';

      // Process all rows based on AI understanding
      for (const row of data) {
        try {
          // Use AI sample to understand the structure, then process all rows
          const campaign: CampaignRecord = {
            campaignId: String(row[headerArray[0]] || `campaign-${campaigns.length + 1}`),
            campaignName: String(row[headerArray[1]] || 'Unknown Campaign'),
            platform: detectPlatform(String(row[headerArray[1]] || '')),
            spend: parseNumber(findValueInRow(row, ['spend', 'cost', 'amount_spent', 'budget'])),
            revenue: parseNumber(findValueInRow(row, ['revenue', 'sales', 'conversion_value', 'value'])),
            impressions: parseNumber(findValueInRow(row, ['impressions', 'impr'])),
            clicks: parseNumber(findValueInRow(row, ['clicks', 'click'])),
            conversions: parseNumber(findValueInRow(row, ['conversions', 'conv', 'purchases'])),
            date: parseDate(findValueInRow(row, ['date', 'day', 'time'])),
          };

          if (campaign.spend <= 0 && campaign.revenue <= 0) {
            skippedRows++;
            continue;
          }

          campaigns.push(campaign);
          const campaignDate = campaign.date || new Date().toISOString().split('T')[0];
          if (!minDate || campaignDate < minDate) minDate = campaignDate;
          if (!maxDate || campaignDate > maxDate) maxDate = campaignDate;
          
          // Detect most common platform
          if (campaign.platform !== 'unknown') {
            detectedPlatform = campaign.platform;
          }
        } catch {
          skippedRows++;
          continue;
        }
      }

      console.log(`   ✅ Parsed ${campaigns.length} campaigns from ${data.length} rows (skipped: ${skippedRows})`);
      
      if (campaigns.length === 0) {
        throw new Error('No valid campaigns found in the data');
      }

      // Generate explanation if there were issues
      let explanation: string | undefined;
      if (skippedRows > 0 || validation.warnings.length > 0) {
        console.log('   💬 Generating explanation for data issues...');
        try {
          explanation = await explainDataProblem(apiKey, {
            toolName: 'Ad Spend Auditor',
            headers: headerArray,
            sampleRow: data[0] as Record<string, unknown>,
            errors: [],
            warnings: validation.warnings,
            skippedRows,
            totalRows: data.length,
          }, locale);
        } catch {
          explanation = generateFallbackExplanation({
            errors: [],
            warnings: validation.warnings,
            skippedRows,
            totalRows: data.length,
          }, locale);
        }
      }

      return {
        campaigns,
        platform: detectedPlatform,
        dateRange: { 
          start: minDate || new Date().toISOString().split('T')[0], 
          end: maxDate || new Date().toISOString().split('T')[0] 
        },
        totalRows: campaigns.length,
        dataQuality: {
          skippedRows,
          warnings: validation.warnings,
          explanation,
        },
      };
    }
  } catch (error) {
    console.log('   ⚠️ AI parsing failed, using fallback...');
  }

  // Fallback parsing without AI
  return fallbackParseAdData(data, headerArray);
}

/**
 * Fallback parsing without AI
 */
function fallbackParseAdData(
  data: Record<string, unknown>[],
  headers: string[]
): AdAuditData {
  const campaigns: CampaignRecord[] = [];
  let minDate = '';
  let maxDate = '';

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    const campaign: CampaignRecord = {
      campaignId: String(row[headers[0]] || `campaign-${i + 1}`),
      campaignName: String(row[headers[1]] || 'Unknown Campaign'),
      platform: detectPlatform(String(row[headers[1]] || '')),
      spend: parseNumber(findValueInRow(row, ['spend', 'cost', 'amount_spent', 'budget'])),
      revenue: parseNumber(findValueInRow(row, ['revenue', 'sales', 'conversion_value', 'value'])),
      impressions: parseNumber(findValueInRow(row, ['impressions', 'impr'])),
      clicks: parseNumber(findValueInRow(row, ['clicks', 'click'])),
      conversions: parseNumber(findValueInRow(row, ['conversions', 'conv', 'purchases'])),
      date: parseDate(findValueInRow(row, ['date', 'day', 'time'])),
    };

    if (campaign.spend > 0 || campaign.revenue > 0) {
      campaigns.push(campaign);
      const campaignDate = campaign.date || new Date().toISOString().split('T')[0];
      if (!minDate || campaignDate < minDate) minDate = campaignDate;
      if (!maxDate || campaignDate > maxDate) maxDate = campaignDate;
    }
  }

  const today = new Date().toISOString().split('T')[0];
  
  return {
    campaigns,
    platform: 'unknown',
    dateRange: { start: minDate || today, end: maxDate || today },
    totalRows: campaigns.length,
  };
}

/**
 * Helper function to find value in row by multiple possible column names
 */
function findValueInRow(row: Record<string, unknown>, possibleNames: string[]): unknown {
  for (const name of possibleNames) {
    for (const [key, value] of Object.entries(row)) {
      if (key.toLowerCase().includes(name.toLowerCase())) {
        return value;
      }
    }
  }
  return 0;
}

/**
 * Detect platform from campaign name
 */
function detectPlatform(campaignName: string): CampaignRecord['platform'] {
  const nameLower = campaignName.toLowerCase();
  
  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    if (patterns.some(pattern => nameLower.includes(pattern))) {
      return platform as CampaignRecord['platform'];
    }
  }
  
  return 'unknown';
}

/**
 * Calculate performance metrics for each campaign
 */
function calculateCampaignPerformance(campaigns: CampaignRecord[]): CampaignAnalysis[] {
  return campaigns.map(campaign => {
    const profit = campaign.revenue - campaign.spend;
    const roi = campaign.spend > 0 ? ((profit / campaign.spend) * 100) : 0;
    const roas = campaign.spend > 0 ? (campaign.revenue / campaign.spend) : 0;
    const cpa = (campaign.conversions || 0) > 0 ? campaign.spend / (campaign.conversions || 1) : Infinity;
    const cpc = (campaign.clicks || 0) > 0 ? campaign.spend / (campaign.clicks || 1) : 0;
    const ctr = (campaign.impressions || 0) > 0 ? ((campaign.clicks || 0) / (campaign.impressions || 1)) * 100 : 0;
    const conversionRate = (campaign.clicks || 0) > 0 ? ((campaign.conversions || 0) / (campaign.clicks || 1)) * 100 : 0;
    
    let status: 'profitable' | 'break_even' | 'unprofitable';
    if (profit > campaign.spend * 0.1) { // 10% profit margin
      status = 'profitable';
    } else if (profit >= -campaign.spend * 0.05) { // Within 5% of break-even
      status = 'break_even';
    } else {
      status = 'unprofitable';
    }

    return {
      campaignId: campaign.campaignId,
      campaignName: campaign.campaignName,
      platform: campaign.platform,
      spend: campaign.spend,
      revenue: campaign.revenue,
      profit,
      roi,
      roas,
      cpa,
      cpc,
      ctr,
      conversionRate,
      conversions: campaign.conversions || 0,
      clicks: campaign.clicks || 0,
      impressions: campaign.impressions || 0,
      isProfitable: profit > 0,
      profitPerConversion: (campaign.conversions || 0) > 0 ? profit / (campaign.conversions || 1) : 0,
      status,
    };
  });
}

/**
 * Generate audit summary
 */
function generateAuditSummary(campaigns: CampaignAnalysis[]): AdAuditSummary {
  const totalAdSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const totalProfit = totalRevenue - totalAdSpend;
  const overallROI = totalAdSpend > 0 ? ((totalProfit / totalAdSpend) * 100) : 0;
  const overallROAS = totalAdSpend > 0 ? (totalRevenue / totalAdSpend) : 0;
  
  const profitableCampaigns = campaigns.filter(c => c.status === 'profitable').length;
  const unprofitableCampaigns = campaigns.filter(c => c.status === 'unprofitable').length;
  const breakEvenCampaigns = campaigns.filter(c => c.status === 'break_even').length;
  
  const wastedBudget = campaigns
    .filter(c => c.status === 'unprofitable')
    .reduce((sum, c) => sum + Math.abs(c.profit), 0);
  
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
  
  const averageCPA = totalConversions > 0 ? totalAdSpend / totalConversions : 0;
  const averageCPC = totalClicks > 0 ? totalAdSpend / totalClicks : 0;

  return {
    totalAdSpend,
    totalRevenue,
    totalProfit,
    overallROI,
    overallROAS,
    wastedBudget,
    totalCampaigns: campaigns.length,
    profitableCampaigns,
    unprofitableCampaigns,
    breakEvenCampaigns,
    averageCPA,
    averageCPC,
    totalConversions,
    totalClicks,
    totalImpressions,
  };
}

/**
 * Generate AI recommendations and insights
 */
async function generateAIRecommendations(
  apiKey: string,
  campaigns: CampaignAnalysis[],
  summary: AdAuditSummary,
  locale: string
): Promise<{ recommendations: CampaignRecommendation[]; aiInsights: string[] }> {
  const analysisContext = `
Campaign Performance Analysis:
- Total Campaigns: ${summary.totalCampaigns}
- Total Ad Spend: ${summary.totalAdSpend.toFixed(2)}
- Total Revenue: ${summary.totalRevenue.toFixed(2)}
- Total Profit: ${summary.totalProfit.toFixed(2)}
- Overall ROI: ${summary.overallROI.toFixed(1)}%
- Overall ROAS: ${summary.overallROAS.toFixed(2)}x
- Wasted Budget: ${summary.wastedBudget.toFixed(2)}

Campaign Status:
- Profitable: ${summary.profitableCampaigns}
- Break Even: ${summary.breakEvenCampaigns}  
- Unprofitable: ${summary.unprofitableCampaigns}

Top Performing Campaigns:
${campaigns.filter(c => c.isProfitable).slice(0, 3).map(c => 
  `- ${c.campaignName}: ${c.spend.toFixed(2)} spend → ${c.revenue.toFixed(2)} revenue (${c.roi.toFixed(1)}% ROI)`
).join('\n')}

Worst Performing Campaigns:
${campaigns.filter(c => !c.isProfitable).slice(0, 3).map(c => 
  `- ${c.campaignName}: ${c.spend.toFixed(2)} spend → ${c.revenue.toFixed(2)} revenue (${c.roi.toFixed(1)}% ROI)`
).join('\n')}
`;

  const messages: ChatMessage[] = [
    { role: 'system', content: getRecommendationsPrompt(locale) },
    { role: 'user', content: analysisContext },
  ];

  try {
    const response = await chat(apiKey, messages, { temperature: 0.7, maxTokens: 1500 });
    const aiInsights = JSON.parse(response.content);
    
    // Generate specific recommendations for campaigns
    const recommendations: CampaignRecommendation[] = [];
    
    // Stop worst performing campaigns
    campaigns
      .filter(c => c.status === 'unprofitable' && c.roi < -50)
      .slice(0, 3)
      .forEach(c => {
        recommendations.push({
          campaignId: c.campaignId,
          campaignName: c.campaignName,
          action: 'stop',
          reason: `Campaign is losing money with ${c.roi.toFixed(1)}% ROI. Stop to prevent further losses.`,
          potentialSavings: Math.abs(c.profit),
          priority: 'high',
        });
      });
    
    // Increase budget for top performers
    campaigns
      .filter(c => c.status === 'profitable' && c.roi > 100)
      .slice(0, 2)
      .forEach(c => {
        recommendations.push({
          campaignId: c.campaignId,
          campaignName: c.campaignName,
          action: 'increase',
          reason: `High performing campaign with ${c.roi.toFixed(1)}% ROI. Consider increasing budget.`,
          priority: 'medium',
        });
      });
    
    return {
      recommendations,
      aiInsights: Array.isArray(aiInsights) ? aiInsights : [aiInsights],
    };
  } catch {
    // Fallback recommendations
    return {
      recommendations: [],
      aiInsights: ['Analysis complete. Review campaign performance above for optimization opportunities.'],
    };
  }
}

/**
 * Main audit function - simplified single file approach
 */
export async function auditAdSpend(
  apiKey: string,
  data: Record<string, unknown>[],
  headers: string[],
  options: { locale?: string; currency?: string } = {}
): Promise<AdAuditResult> {
  const { locale = 'en', currency = 'USD' } = options;
  const startTime = Date.now();
  let tokensUsed = 0;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 [Ad Spend Auditor] Starting analysis...');
  console.log(`📊 Data: ${data.length} rows`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Step 1: Parse campaign data
  logStep(1, 4, 'Parsing campaign data...');
  const adData = await parseAdData(apiKey, data, headers, { locale, currency });
  tokensUsed += estimateTokens(JSON.stringify(adData.campaigns.slice(0, 9))) * 2;

  // Step 2: Calculate campaign performance
  logStep(2, 4, 'Calculating campaign performance...');
  const campaignPerformance = calculateCampaignPerformance(adData.campaigns);

  // Step 3: Generate summary
  logStep(3, 4, 'Generating summary...');
  const summary = generateAuditSummary(campaignPerformance);

  // Step 4: Generate AI recommendations
  logStep(4, 4, 'Generating AI recommendations...');
  const { recommendations, aiInsights } = await generateAIRecommendations(
    apiKey,
    campaignPerformance,
    summary,
    locale
  );
  tokensUsed += 2000; // Estimate for recommendations

  const totalTime = Date.now() - startTime;
  logComplete('Ad Spend Auditor', startTime, {
    campaigns: campaignPerformance.length,
    tokensUsed,
  });

  return {
    campaignPerformance,
    summary,
    profitableCampaigns: campaignPerformance.filter(c => c.isProfitable).map(c => c.campaignName),
    unprofitableCampaigns: campaignPerformance.filter(c => !c.isProfitable).map(c => c.campaignName),
    recommendations,
    aiInsights,
    tokensUsed,
    processingTime: totalTime,
  };
}

/**
 * Estimate tokens for audit analysis
 */
export function estimateAuditTokens(data: Record<string, unknown>[]): number {
  const dataTokens = estimateTokens(JSON.stringify(data.slice(0, 9)));
  const recommendationsTokens = 2000;
  return dataTokens + recommendationsTokens;
}

// Utility functions for formatting and labels
export { formatCurrency, formatPercentage } from './shared-utils';

export function getStatusLabel(status: string, locale: string = 'en'): string {
  const labels: Record<string, Record<string, string>> = {
    profitable: { en: 'Profitable', ar: 'مربح' },
    break_even: { en: 'Break Even', ar: 'متعادل' },
    unprofitable: { en: 'Unprofitable', ar: 'خاسر' },
  };
  return labels[status]?.[locale] || labels[status]?.['en'] || status;
}

export function getStatusColor(status: string): string {
  const colors = {
    profitable: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20',
    break_even: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20',
    unprofitable: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20',
  };
  return colors[status as keyof typeof colors] || colors.unprofitable;
}

export function getActionLabel(action: string, locale: string = 'en'): string {
  const labels: Record<string, Record<string, string>> = {
    stop: { en: 'Stop', ar: 'إيقاف' },
    reduce: { en: 'Reduce', ar: 'تقليل' },
    maintain: { en: 'Maintain', ar: 'الحفاظ' },
    increase: { en: 'Increase', ar: 'زيادة' },
  };
  return labels[action]?.[locale] || labels[action]?.['en'] || action;
}

export function getPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    facebook: 'Facebook',
    tiktok: 'TikTok',
    google: 'Google Ads',
    snapchat: 'Snapchat',
    instagram: 'Instagram',
    unknown: 'Unknown',
  };
  return labels[platform] || platform;
}