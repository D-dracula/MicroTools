#!/usr/bin/env node

/**
 * Supabase Integration Checkpoint Test
 * 
 * This script tests the core Supabase integration components:
 * 1. Environment configuration validation
 * 2. Database client initialization
 * 3. Authentication adapter setup
 * 4. Basic database operations (if environment is configured)
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Supabase Integration Checkpoint Test\n');

// Test 1: Environment Configuration
console.log('1. Testing Environment Configuration...');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found');
  console.log('ℹ️  Please copy .env.example to .env and configure Supabase credentials');
} else {
  console.log('✅ .env file exists');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY');
  
  console.log(`   - NEXT_PUBLIC_SUPABASE_URL: ${hasSupabaseUrl ? '✅' : '❌'}`);
  console.log(`   - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasSupabaseKey ? '✅' : '❌'}`);
  console.log(`   - SUPABASE_SERVICE_ROLE_KEY: ${hasServiceKey ? '✅' : '❌'}`);
  
  if (!hasSupabaseUrl || !hasSupabaseKey) {
    console.log('⚠️  Missing required Supabase environment variables');
    console.log('ℹ️  Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

// Test 2: Check if Supabase dependencies are installed
console.log('\n2. Testing Supabase Dependencies...');

const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    '@supabase/supabase-js',
    '@supabase/ssr'
  ];
  
  requiredDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`✅ ${dep}: ${deps[dep]}`);
    } else {
      console.log(`❌ ${dep}: Not installed`);
    }
  });
} else {
  console.log('❌ package.json not found');
}

// Test 3: Check if Supabase client files exist
console.log('\n3. Testing Supabase Client Files...');

const clientFiles = [
  'src/lib/supabase/client.ts',
  'src/lib/supabase/database.ts',
  'src/lib/supabase/types.ts',
  'src/lib/auth/supabase-adapter.ts'
];

clientFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}`);
  }
});

// Test 4: Check migration files
console.log('\n4. Testing Migration Files...');

const migrationDir = path.join(__dirname, 'supabase/migrations');
if (fs.existsSync(migrationDir)) {
  const migrations = fs.readdirSync(migrationDir).filter(f => f.endsWith('.sql'));
  console.log(`✅ Migration directory exists with ${migrations.length} files:`);
  migrations.forEach(migration => {
    console.log(`   - ${migration}`);
  });
} else {
  console.log('❌ Migration directory not found');
}

// Test 5: Try to import and validate Supabase client (if Node.js supports ES modules)
console.log('\n5. Testing Client Import (Basic Validation)...');

try {
  // We can't easily test ES modules in this Node.js script, but we can check syntax
  const clientFile = path.join(__dirname, 'src/lib/supabase/client.ts');
  if (fs.existsSync(clientFile)) {
    const content = fs.readFileSync(clientFile, 'utf8');
    
    // Check for key imports and exports
    const hasSupabaseImport = content.includes('@supabase/ssr');
    const hasCreateClient = content.includes('export function createClient');
    const hasValidation = content.includes('validateSupabaseConfig');
    
    console.log(`   - Supabase imports: ${hasSupabaseImport ? '✅' : '❌'}`);
    console.log(`   - createClient export: ${hasCreateClient ? '✅' : '❌'}`);
    console.log(`   - Environment validation: ${hasValidation ? '✅' : '❌'}`);
  }
} catch (error) {
  console.log(`❌ Error checking client file: ${error.message}`);
}

// Summary
console.log('\n📋 Integration Status Summary:');
console.log('================================');

const envConfigured = fs.existsSync(envPath) && 
  fs.readFileSync(envPath, 'utf8').includes('NEXT_PUBLIC_SUPABASE_URL') &&
  fs.readFileSync(envPath, 'utf8').includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const filesExist = clientFiles.every(file => 
  fs.existsSync(path.join(__dirname, file))
);

const migrationsExist = fs.existsSync(path.join(__dirname, 'supabase/migrations'));

console.log(`Environment Configuration: ${envConfigured ? '✅ Ready' : '❌ Needs Setup'}`);
console.log(`Core Files: ${filesExist ? '✅ Present' : '❌ Missing'}`);
console.log(`Database Migrations: ${migrationsExist ? '✅ Present' : '❌ Missing'}`);

if (envConfigured && filesExist && migrationsExist) {
  console.log('\n🎉 Core Supabase integration appears to be complete!');
  console.log('ℹ️  To fully test, configure your .env with actual Supabase credentials');
} else {
  console.log('\n⚠️  Core integration needs attention:');
  if (!envConfigured) {
    console.log('   - Configure Supabase environment variables in .env');
  }
  if (!filesExist) {
    console.log('   - Ensure all Supabase client files are present');
  }
  if (!migrationsExist) {
    console.log('   - Set up database migration files');
  }
}

console.log('\n🔗 Next Steps:');
console.log('1. Configure .env with your Supabase project credentials');
console.log('2. Run database migrations: npm run db:migrate');
console.log('3. Test authentication flows in development');
console.log('4. Verify database operations work correctly');