// Script to help set up Supabase storage bucket
// Run this with: node scripts/setup-bucket.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.log('Please add:');
  console.log('EXPO_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupBucket() {
  try {
    console.log('🔍 Checking Supabase connection...');
    
    // Test connection
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.log('ℹ️  No authenticated user (this is normal for anon key)');
    } else {
      console.log('✅ Authenticated user:', user?.id);
    }

    // List existing buckets
    console.log('📦 Checking existing buckets...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return;
    }

    console.log('📋 Existing buckets:', buckets?.map(b => b.name) || []);

    const bucketName = 'photos';
    const bucketExists = buckets?.some(b => b.name === bucketName);

    if (bucketExists) {
      console.log(`✅ Bucket '${bucketName}' already exists`);
    } else {
      console.log(`❌ Bucket '${bucketName}' does not exist`);
      console.log('\n📝 To create the bucket manually:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to Storage');
      console.log('3. Click "New bucket"');
      console.log(`4. Name: ${bucketName}`);
      console.log('5. Set as Public');
      console.log('6. Click "Create bucket"');
    }

    // Test storage policies
    console.log('\n🔒 Testing storage access...');
    const { data: testData, error: testError } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 1 });

    if (testError) {
      console.error('❌ Storage access error:', testError.message);
      if (testError.message.includes('not found')) {
        console.log('💡 The bucket needs to be created manually');
      }
    } else {
      console.log('✅ Storage access working');
    }

  } catch (error) {
    console.error('❌ Setup error:', error.message);
  }
}

setupBucket();
