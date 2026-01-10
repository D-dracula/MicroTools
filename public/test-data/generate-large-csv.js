// Script to generate large test CSV files for AI tools testing
const fs = require('fs');
const path = require('path');

// Products database
const products = [
  { code: '85123A', name: 'WHITE HANGING HEART T-LIGHT HOLDER', price: 2.55 },
  { code: '71053', name: 'WHITE METAL LANTERN', price: 3.39 },
  { code: '84406B', name: 'CREAM CUPID HEARTS COAT HANGER', price: 2.75 },
  { code: '22752', name: 'SET 7 BABUSHKA NESTING BOXES', price: 7.65 },
  { code: '84879', name: 'ASSORTED COLOUR BIRD ORNAMENT', price: 1.69 },
  { code: '22745', name: 'POPPY\'S PLAYHOUSE BEDROOM', price: 2.10 },
  { code: '22748', name: 'POPPY\'S PLAYHOUSE KITCHEN', price: 2.10 },
  { code: '22960', name: 'JAM MAKING SET WITH JARS', price: 4.25 },
  { code: '21756', name: 'BATH BUILDING BLOCK WORD', price: 5.95 },
  { code: '22728', name: 'ALARM CLOCK BAKELIKE PINK', price: 3.75 },
  { code: '22727', name: 'ALARM CLOCK BAKELIKE RED', price: 3.75 },
  { code: '22726', name: 'ALARM CLOCK BAKELIKE GREEN', price: 3.75 },
  { code: '22086', name: 'PAPER CHAIN KIT 50\'S CHRISTMAS', price: 2.55 },
  { code: '22632', name: 'HAND WARMER RED POLKA DOT', price: 1.85 },
  { code: '22633', name: 'HAND WARMER UNION JACK', price: 1.85 },
  { code: '21258', name: 'VICTORIAN SEWING BOX LARGE', price: 10.95 },
  { code: '84029G', name: 'KNITTED UNION FLAG HOT WATER BOTTLE', price: 3.39 },
  { code: '22114', name: 'HOT WATER BOTTLE TEA AND SYMPATHY', price: 3.45 },
  { code: '22423', name: 'REGENCY CAKESTAND 3 TIER', price: 12.75 },
  { code: '84029E', name: 'RED WOOLLY HOTTIE WHITE HEART', price: 3.39 },
  { code: '21730', name: 'GLASS STAR FROSTED T-LIGHT HOLDER', price: 4.25 },
  { code: '22469', name: 'HEART OF WICKER SMALL', price: 1.65 },
];

const countries = ['United Kingdom', 'France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Belgium', 'Australia', 'Japan', 'USA'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

function generateDate(startDate, dayOffset) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(randomInt(8, 18), randomInt(0, 59), 0);
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

// Generate Large Sales Data (1000 rows)
function generateSalesData(rowCount = 1000) {
  const headers = 'InvoiceNo,StockCode,Description,Quantity,InvoiceDate,UnitPrice,CustomerID,Country,ShippingCost,PaymentFee,Tax,RefundAmount';
  const rows = [headers];
  
  let invoiceNo = 536500;
  const startDate = new Date('2024-01-01');
  
  for (let i = 0; i < rowCount; i++) {
    const product = products[randomInt(0, products.length - 1)];
    const country = countries[randomInt(0, countries.length - 1)];
    const quantity = randomInt(1, 50);
    const isRefund = Math.random() < 0.05; // 5% refunds
    const customerId = randomInt(12000, 18000);
    
    const revenue = product.price * quantity;
    const shippingCost = isRefund ? 0 : parseFloat(randomFloat(2, 15));
    const paymentFee = isRefund ? 0 : parseFloat((revenue * 0.03).toFixed(2));
    const tax = isRefund ? 0 : parseFloat((revenue * 0.15).toFixed(2));
    const refundAmount = isRefund ? revenue : 0;
    
    const row = [
      isRefund ? `C${invoiceNo}` : invoiceNo,
      product.code,
      product.name,
      isRefund ? -quantity : quantity,
      generateDate(startDate, Math.floor(i / 10)),
      product.price,
      customerId,
      country,
      shippingCost,
      paymentFee,
      tax,
      refundAmount
    ].join(',');
    
    rows.push(row);
    invoiceNo++;
  }
  
  return rows.join('\n');
}

// Generate Large Reviews Data (500 rows)
function generateReviewsData(rowCount = 500) {
  const positiveReviews = [
    'Excellent product! Highly recommend.',
    'Great quality, fast shipping.',
    'Love it! Will buy again.',
    'Perfect gift, beautifully packaged.',
    'Amazing value for money.',
    'Best purchase I\'ve made this year.',
    'Exceeded my expectations!',
    'Very happy with this product.',
    'Outstanding customer service.',
    'Five stars, absolutely perfect!',
  ];
  
  const negativeReviews = [
    'Product arrived damaged.',
    'Not as described, very disappointed.',
    'Poor quality, broke after one use.',
    'Shipping took too long.',
    'Would not recommend.',
    'Waste of money.',
    'Customer service was unhelpful.',
    'Product looks cheap.',
    'Missing parts in the package.',
    'Returned for refund.',
  ];
  
  const neutralReviews = [
    'Product is okay, nothing special.',
    'Average quality for the price.',
    'It works but could be better.',
    'Decent product, met expectations.',
    'Not bad, not great.',
  ];
  
  const headers = 'ReviewID,ProductName,Rating,ReviewText,ReviewDate,CustomerName,Verified';
  const rows = [headers];
  
  for (let i = 0; i < rowCount; i++) {
    const product = products[randomInt(0, products.length - 1)];
    const rating = randomInt(1, 5);
    let reviewText;
    
    if (rating >= 4) {
      reviewText = positiveReviews[randomInt(0, positiveReviews.length - 1)];
    } else if (rating <= 2) {
      reviewText = negativeReviews[randomInt(0, negativeReviews.length - 1)];
    } else {
      reviewText = neutralReviews[randomInt(0, neutralReviews.length - 1)];
    }
    
    const row = [
      `REV${String(i + 1).padStart(5, '0')}`,
      `"${product.name}"`,
      rating,
      `"${reviewText}"`,
      generateDate(new Date('2024-01-01'), randomInt(0, 365)).split(' ')[0],
      `Customer${randomInt(1000, 9999)}`,
      Math.random() > 0.2 ? 'Yes' : 'No'
    ].join(',');
    
    rows.push(row);
  }
  
  return rows.join('\n');
}

// Generate Large Inventory Data (200 rows)
function generateInventoryData(rowCount = 200) {
  const headers = 'Date,ProductID,ProductName,QuantitySold,CurrentStock,ReorderLevel,UnitCost,SellingPrice';
  const rows = [headers];
  
  const startDate = new Date('2024-01-01');
  
  for (let i = 0; i < rowCount; i++) {
    const product = products[randomInt(0, products.length - 1)];
    const quantitySold = randomInt(1, 30);
    const currentStock = randomInt(0, 500);
    const reorderLevel = randomInt(20, 100);
    const unitCost = parseFloat((product.price * 0.4).toFixed(2));
    
    const row = [
      generateDate(startDate, Math.floor(i / 5)).split(' ')[0],
      product.code,
      `"${product.name}"`,
      quantitySold,
      currentStock,
      reorderLevel,
      unitCost,
      product.price
    ].join(',');
    
    rows.push(row);
  }
  
  return rows.join('\n');
}

// Generate Large Ad Campaign Data (100 rows)
function generateAdCampaignData(rowCount = 100) {
  const platforms = ['Facebook', 'Google', 'TikTok', 'Instagram', 'Snapchat'];
  const campaignTypes = ['Brand Awareness', 'Conversions', 'Traffic', 'Engagement', 'Retargeting'];
  
  const headers = 'CampaignID,CampaignName,Platform,Spend,Impressions,Clicks,Conversions,Revenue,StartDate,EndDate';
  const rows = [headers];
  
  for (let i = 0; i < rowCount; i++) {
    const platform = platforms[randomInt(0, platforms.length - 1)];
    const campaignType = campaignTypes[randomInt(0, campaignTypes.length - 1)];
    const spend = parseFloat(randomFloat(50, 5000));
    const impressions = randomInt(1000, 500000);
    const clicks = Math.floor(impressions * (randomInt(1, 5) / 100));
    const conversions = Math.floor(clicks * (randomInt(1, 10) / 100));
    const revenue = parseFloat((conversions * randomFloat(20, 150)).toFixed(2));
    
    const startDate = generateDate(new Date('2024-01-01'), randomInt(0, 300)).split(' ')[0];
    const endDate = generateDate(new Date(startDate), randomInt(7, 30)).split(' ')[0];
    
    const row = [
      `CAMP${String(i + 1).padStart(4, '0')}`,
      `"${platform} - ${campaignType} Campaign ${i + 1}"`,
      platform,
      spend,
      impressions,
      clicks,
      conversions,
      revenue,
      startDate,
      endDate
    ].join(',');
    
    rows.push(row);
  }
  
  return rows.join('\n');
}

// Generate Product Catalog Data (300 rows)
function generateCatalogData(rowCount = 300) {
  const categories = ['Home Decor', 'Kitchen', 'Toys', 'Gifts', 'Accessories', 'Seasonal'];
  const suppliers = ['SupplierA', 'SupplierB', 'SupplierC', 'SupplierD'];
  
  const headers = 'SKU,ProductTitle,Description,Category,SupplierPrice,SellingPrice,Stock,Supplier';
  const rows = [headers];
  
  for (let i = 0; i < rowCount; i++) {
    const product = products[randomInt(0, products.length - 1)];
    const category = categories[randomInt(0, categories.length - 1)];
    const supplier = suppliers[randomInt(0, suppliers.length - 1)];
    const supplierPrice = parseFloat((product.price * 0.4).toFixed(2));
    
    // Add some messy data for catalog cleaner to fix
    let title = product.name;
    if (Math.random() < 0.3) title = title + ' ®™';
    if (Math.random() < 0.2) title = '★★★ ' + title + ' ★★★';
    if (Math.random() < 0.1) title = title.toUpperCase();
    
    const row = [
      `SKU${String(i + 1).padStart(5, '0')}`,
      `"${title}"`,
      `"High quality ${product.name.toLowerCase()} for your home. Perfect gift idea."`,
      category,
      supplierPrice,
      product.price,
      randomInt(0, 200),
      supplier
    ].join(',');
    
    rows.push(row);
  }
  
  return rows.join('\n');
}

// Main execution
console.log('Generating large test CSV files...\n');

// Generate and save files
const testDataDir = path.join(__dirname);

fs.writeFileSync(path.join(testDataDir, 'large-sales-1000.csv'), generateSalesData(1000));
console.log('✅ Generated: large-sales-1000.csv (1000 rows)');

fs.writeFileSync(path.join(testDataDir, 'large-reviews-500.csv'), generateReviewsData(500));
console.log('✅ Generated: large-reviews-500.csv (500 rows)');

fs.writeFileSync(path.join(testDataDir, 'large-inventory-200.csv'), generateInventoryData(200));
console.log('✅ Generated: large-inventory-200.csv (200 rows)');

fs.writeFileSync(path.join(testDataDir, 'large-ads-100.csv'), generateAdCampaignData(100));
console.log('✅ Generated: large-ads-100.csv (100 rows)');

fs.writeFileSync(path.join(testDataDir, 'large-catalog-300.csv'), generateCatalogData(300));
console.log('✅ Generated: large-catalog-300.csv (300 rows)');

console.log('\n🎉 All test files generated successfully!');
console.log('\nFiles location: micro-tools/test-data/');
