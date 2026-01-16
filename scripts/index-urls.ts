#!/usr/bin/env tsx
/**
 * Google Indexing API CLI Script
 * 
 * Usage:
 *   npx tsx scripts/index-urls.ts --all          # Index all site URLs
 *   npx tsx scripts/index-urls.ts --tools        # Index tool pages only
 *   npx tsx scripts/index-urls.ts --url <url>    # Index a single URL
 *   npx tsx scripts/index-urls.ts --list         # List all indexable URLs
 * 
 * Environment:
 *   GOOGLE_SERVICE_ACCOUNT_KEY - JSON string of service account credentials
 *   NEXT_PUBLIC_SITE_URL - Base URL of the site (default: https://pinecalc.com)
 */

import { 
  submitUrl, 
  indexAllSiteUrls, 
  indexToolPages,
  getAllSiteUrls,
  isIndexingConfigured 
} from '../src/lib/google-indexing';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Google Indexing API CLI

Usage:
  npx tsx scripts/index-urls.ts [options]

Options:
  --all           Index all site URLs (tools, pages, blog)
  --tools         Index tool pages only
  --url <url>     Index a single URL
  --list          List all indexable URLs without submitting
  --help, -h      Show this help message

Environment Variables:
  GOOGLE_SERVICE_ACCOUNT_KEY  JSON string of Google service account credentials
  NEXT_PUBLIC_SITE_URL        Base URL of the site (default: https://pinecalc.com)

Setup:
  1. Create a Google Cloud Project
  2. Enable the Indexing API
  3. Create a Service Account and download JSON key
  4. Add Service Account email as Owner in Google Search Console
  5. Set GOOGLE_SERVICE_ACCOUNT_KEY with the JSON content
    `);
    return;
  }
  
  // Check configuration
  if (!args.includes('--list') && !isIndexingConfigured()) {
    console.error('❌ Error: GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
    console.log('\nTo set up:');
    console.log('1. Create a Google Cloud Project');
    console.log('2. Enable the Indexing API');
    console.log('3. Create a Service Account');
    console.log('4. Download the JSON key');
    console.log('5. Set GOOGLE_SERVICE_ACCOUNT_KEY environment variable with the JSON content');
    process.exit(1);
  }
  
  // List URLs
  if (args.includes('--list')) {
    const urls = getAllSiteUrls();
    console.log(`\n📋 Indexable URLs (${urls.length} total):\n`);
    urls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
    console.log(`\n✅ Total: ${urls.length} URLs`);
    console.log('📊 Daily limit: 200 URLs');
    return;
  }
  
  // Index single URL
  if (args.includes('--url')) {
    const urlIndex = args.indexOf('--url');
    const url = args[urlIndex + 1];
    
    if (!url) {
      console.error('❌ Error: URL is required after --url');
      process.exit(1);
    }
    
    console.log(`\n🔄 Submitting URL for indexing: ${url}`);
    const result = await submitUrl(url);
    
    if (result.success) {
      console.log('✅ Successfully submitted for indexing');
    } else {
      console.error(`❌ Failed: ${result.error}`);
      process.exit(1);
    }
    return;
  }
  
  // Index tool pages
  if (args.includes('--tools')) {
    console.log('\n🔄 Submitting tool pages for indexing...\n');
    const result = await indexToolPages();
    
    console.log(`\n📊 Results:`);
    console.log(`   Total: ${result.total}`);
    console.log(`   ✅ Successful: ${result.successful}`);
    console.log(`   ❌ Failed: ${result.failed}`);
    
    if (result.failed > 0) {
      console.log('\n❌ Failed URLs:');
      result.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.url}: ${r.error}`));
    }
    return;
  }
  
  // Index all URLs
  if (args.includes('--all')) {
    const urls = getAllSiteUrls();
    
    if (urls.length > 200) {
      console.log(`\n⚠️  Warning: ${urls.length} URLs exceed daily limit of 200`);
      console.log('   Only the first 200 URLs will be submitted today.\n');
    }
    
    console.log(`\n🔄 Submitting ${Math.min(urls.length, 200)} URLs for indexing...\n`);
    const result = await indexAllSiteUrls();
    
    console.log(`\n📊 Results:`);
    console.log(`   Total: ${result.total}`);
    console.log(`   ✅ Successful: ${result.successful}`);
    console.log(`   ❌ Failed: ${result.failed}`);
    
    if (result.failed > 0) {
      console.log('\n❌ Failed URLs:');
      result.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.url}: ${r.error}`));
    }
    return;
  }
  
  console.error('❌ Unknown option. Use --help for usage information.');
  process.exit(1);
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
