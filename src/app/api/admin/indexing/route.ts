import { NextRequest, NextResponse } from 'next/server';
import { 
  submitUrl, 
  submitUrls, 
  indexAllSiteUrls, 
  indexToolPages,
  getAllSiteUrls,
  isIndexingConfigured,
  type BatchIndexingResult 
} from '@/lib/google-indexing';

// Check admin authorization
function isAuthorized(request: NextRequest): boolean {
  // Check for admin API key or session
  const apiKey = request.headers.get('x-admin-key');
  const adminKey = process.env.ADMIN_API_KEY;
  
  if (adminKey && apiKey === adminKey) {
    return true;
  }
  
  // You can add session-based auth here if needed
  return false;
}

/**
 * GET /api/admin/indexing
 * Get indexing status and available URLs
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const configured = isIndexingConfigured();
  const urls = getAllSiteUrls();
  
  return NextResponse.json({
    configured,
    totalUrls: urls.length,
    dailyLimit: 200,
    urls: urls.slice(0, 50), // Return first 50 for preview
  });
}

/**
 * POST /api/admin/indexing
 * Submit URLs for indexing
 * 
 * Body options:
 * - { action: 'single', url: string } - Index a single URL
 * - { action: 'batch', urls: string[] } - Index multiple URLs
 * - { action: 'tools' } - Index all tool pages
 * - { action: 'all' } - Index all site URLs
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!isIndexingConfigured()) {
    return NextResponse.json(
      { error: 'Google Indexing API is not configured. Set GOOGLE_SERVICE_ACCOUNT_KEY environment variable.' },
      { status: 500 }
    );
  }
  
  try {
    const body = await request.json();
    const { action, url, urls, type = 'URL_UPDATED' } = body;
    
    let result: BatchIndexingResult | { url: string; success: boolean; error?: string };
    
    switch (action) {
      case 'single':
        if (!url) {
          return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }
        result = await submitUrl(url, type);
        break;
        
      case 'batch':
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
          return NextResponse.json({ error: 'URLs array is required' }, { status: 400 });
        }
        if (urls.length > 200) {
          return NextResponse.json(
            { error: 'Maximum 200 URLs per request (daily limit)' },
            { status: 400 }
          );
        }
        result = await submitUrls(urls, type);
        break;
        
      case 'tools':
        result = await indexToolPages();
        break;
        
      case 'all':
        result = await indexAllSiteUrls();
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: single, batch, tools, or all' },
          { status: 400 }
        );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Indexing API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
