const fs = require('fs');

// Generate 5000 rows of ad campaign data
function generateLargeAdsData() {
  const platforms = ['Facebook', 'Google', 'Instagram', 'TikTok', 'Snapchat', 'LinkedIn', 'Twitter', 'YouTube'];
  const campaignTypes = ['Traffic', 'Conversions', 'Brand Awareness', 'Engagement', 'Retargeting', 'Lead Generation'];
  
  let csvContent = 'CampaignID,CampaignName,Platform,Spend,Impressions,Clicks,Conversions,Revenue,StartDate,EndDate\n';
  
  let totalSpend = 0;
  let totalRevenue = 0;
  let profitableCampaigns = 0;
  let unprofitableCampaigns = 0;
  let wastedBudget = 0;
  
  for (let i = 1; i <= 5000; i++) {
    const campaignId = `CAMP${i.toString().padStart(4, '0')}`;
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const campaignType = campaignTypes[Math.floor(Math.random() * campaignTypes.length)];
    const campaignName = `${platform} - ${campaignType} Campaign ${i}`;
    
    // Generate realistic spend (100 to 5000)
    const spend = Math.round((Math.random() * 4900 + 100) * 100) / 100;
    
    // Generate impressions based on spend
    const impressions = Math.floor(spend * (50 + Math.random() * 200));
    
    // Generate clicks (1-5% of impressions)
    const ctr = 0.01 + Math.random() * 0.04;
    const clicks = Math.floor(impressions * ctr);
    
    // Generate conversions (1-10% of clicks)
    const conversionRate = 0.01 + Math.random() * 0.09;
    const conversions = Math.floor(clicks * conversionRate);
    
    // Generate revenue - 80% chance of profit, 20% chance of loss
    let revenue;
    if (Math.random() < 0.8) {
      // Profitable campaign (1.2x to 10x return)
      const multiplier = 1.2 + Math.random() * 8.8;
      revenue = Math.round(spend * multiplier * 100) / 100;
    } else {
      // Unprofitable campaign (0.1x to 0.9x return)
      const multiplier = 0.1 + Math.random() * 0.8;
      revenue = Math.round(spend * multiplier * 100) / 100;
    }
    
    // Generate random dates in 2024
    const startDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const endDate = new Date(startDate.getTime() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Add to CSV
    csvContent += `${campaignId},"${campaignName}",${platform},${spend},${impressions},${clicks},${conversions},${revenue},${startDateStr},${endDateStr}\n`;
    
    // Calculate totals
    totalSpend += spend;
    totalRevenue += revenue;
    
    if (revenue > spend) {
      profitableCampaigns++;
    } else {
      unprofitableCampaigns++;
      wastedBudget += (spend - revenue);
    }
  }
  
  // Write CSV file
  fs.writeFileSync('test-data/large-ads-5000.csv', csvContent);
  
  // Calculate results
  const netProfit = totalRevenue - totalSpend;
  const roiPercent = ((totalRevenue - totalSpend) / totalSpend) * 100;
  
  // Write results file
  const results = `# Ad Spend Auditor Results - 5000 Campaigns

## Expected Results:
- **Total Ad Spend**: $${totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
- **Total Revenue**: $${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
- **Net Profit**: $${netProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
- **Overall ROI**: ${roiPercent >= 0 ? '+' : ''}${roiPercent.toFixed(1)}%
- **Wasted Budget**: $${wastedBudget.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
- **Profitable Campaigns**: ${profitableCampaigns}
- **Unprofitable Campaigns**: ${unprofitableCampaigns}

## File Details:
- **Total Campaigns**: 5,000
- **Platforms**: Facebook, Google, Instagram, TikTok, Snapchat, LinkedIn, Twitter, YouTube
- **Campaign Types**: Traffic, Conversions, Brand Awareness, Engagement, Retargeting, Lead Generation
- **Date Range**: 2024 (Random dates)
- **Spend Range**: $100 - $5,000 per campaign
- **Success Rate**: ~80% profitable campaigns

## Usage:
1. Upload the file \`large-ads-5000.csv\` to Ad Spend Auditor
2. Compare results with expected values above
3. Verify the tool's accuracy with large datasets

Generated on: ${new Date().toISOString()}
`;
  
  fs.writeFileSync('test-data/large-ads-5000-results.md', results);
  
  console.log('✅ Generated large-ads-5000.csv with 5000 campaigns');
  console.log('✅ Generated large-ads-5000-results.md with expected results');
  console.log(`📊 Expected Results:`);
  console.log(`   Total Spend: $${totalSpend.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`   Total Revenue: $${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`   Net Profit: $${netProfit.toLocaleString('en-US', {minimumFractionDigits: 2})}`);
  console.log(`   ROI: ${roiPercent >= 0 ? '+' : ''}${roiPercent.toFixed(1)}%`);
  console.log(`   Profitable: ${profitableCampaigns} | Unprofitable: ${unprofitableCampaigns}`);
}

generateLargeAdsData();