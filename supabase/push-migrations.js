/**
 * Push migrations to Supabase using Management API
 * 
 * Usage: node supabase/push-migrations.js
 * 
 * Requires: SUPABASE_ACCESS_TOKEN environment variable
 * Get it from: https://supabase.com/dashboard/account/tokens
 */

const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'surtchczdsahwletxhkg';
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function pushMigration(accessToken, name, sql) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/migrations`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: sql,
        name: name,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Migration failed: ${response.status} - ${error}`);
  }

  return await response.json();
}

async function main() {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.log('❌ Missing SUPABASE_ACCESS_TOKEN');
    console.log('');
    console.log('To get your access token:');
    console.log('1. Go to: https://supabase.com/dashboard/account/tokens');
    console.log('2. Click "Generate new token"');
    console.log('3. Copy the token');
    console.log('4. Run: $env:SUPABASE_ACCESS_TOKEN="your-token"; node supabase/push-migrations.js');
    console.log('');
    console.log('Or run migrations manually in SQL Editor:');
    console.log('https://supabase.com/dashboard/project/surtchczdsahwletxhkg/sql/new');
    process.exit(1);
  }

  console.log('🚀 Pushing migrations to Supabase...');
  console.log('📍 Project:', PROJECT_REF);

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📁 Found ${files.length} migration files\n`);

  for (const file of files) {
    console.log(`📄 Pushing: ${file}`);
    
    try {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      const name = file.replace('.sql', '');
      
      await pushMigration(accessToken, name, sql);
      console.log(`✅ ${file} - Success\n`);
    } catch (error) {
      console.log(`❌ ${file} - Failed: ${error.message}\n`);
      
      // Continue with other migrations
      if (error.message.includes('already exists')) {
        console.log('   (Table/object already exists, skipping)\n');
      }
    }
  }

  console.log('✅ Migration push completed!');
}

main().catch(console.error);
