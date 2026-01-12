const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://surtchczdsahwletxhkg.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cnRjaGN6ZHNhaHdsZXR4aGtnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTk4MjI3OSwiZXhwIjoyMDc3NTU4Mjc5fQ.Ow0lzETTu2MGJZHTZlNxDJUapTqPfYKyC3bWMWxex5M';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigrations() {
  console.log('🚀 Starting migrations...');
  console.log('📍 Supabase URL:', SUPABASE_URL);
  
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`📁 Found ${files.length} migration files`);
  
  for (const file of files) {
    console.log(`\n📄 Running: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        // Try direct query if RPC doesn't exist
        console.log('⚠️ RPC not available, this migration needs to be run manually in SQL Editor');
        console.log('   Copy the content of:', file);
      } else {
        console.log(`✅ ${file} completed`);
      }
    } catch (err) {
      console.log('⚠️ Migration needs to be run manually in Supabase SQL Editor');
      console.log('   File:', file);
    }
  }
  
  console.log('\n✅ Migration process completed');
  console.log('\n📋 If any migrations failed, please run them manually:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/surtchczdsahwletxhkg/sql/new');
  console.log('   2. Copy and paste each .sql file content');
  console.log('   3. Click Run');
}

runMigrations().catch(console.error);
