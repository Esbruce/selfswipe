// Test script to verify Supabase storage setup
// Run with: node scripts/test-upload.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStorageSetup() {
  console.log('🧪 Testing Supabase Storage Setup...\n');

  try {
    // Test 1: Check per-user bucket system
    console.log('1️⃣ Checking per-user bucket system...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }

    console.log('📋 All buckets:', buckets?.map(b => b.name) || []);
    
    const userBuckets = buckets?.filter(b => b.name.startsWith('user-')) || [];
    if (userBuckets.length > 0) {
      console.log('✅ User buckets found:', userBuckets.map(b => b.name));
      console.log(`   - Total user buckets: ${userBuckets.length}`);
    } else {
      console.log('ℹ️  No user buckets found yet (this is normal for new users)');
      console.log('   User buckets will be created automatically on first upload');
    }

    // Test 2: Check storage policies
    console.log('\n2️⃣ Testing storage access...');
    const testUserId = 'test-user-123';
    const testBucket = `user-${testUserId}`;
    
    // Try to list files (this will test read permissions)
    const { data: files, error: listError } = await supabase.storage
      .from(testBucket)
      .list('upload', { limit: 1 });

    if (listError) {
      console.log('⚠️  Storage access test failed:', listError.message);
      if (listError.message.includes('not found')) {
        console.log('   This is normal if the bucket doesn\'t exist yet');
      }
    } else {
      console.log('✅ Storage access working');
    }

    // Test 3: Check authentication
    console.log('\n3️⃣ Testing authentication...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('ℹ️  No active session (normal for anon key)');
    } else if (session) {
      console.log('✅ Active session found');
      console.log(`   - User ID: ${session.user.id}`);
    } else {
      console.log('ℹ️  No active session');
    }

    // Test 4: Check database tables
    console.log('\n4️⃣ Testing database tables...');
    const { data: photos, error: photosError } = await supabase
      .from('photos')
      .select('id')
      .limit(1);

    if (photosError) {
      console.log('❌ Photos table error:', photosError.message);
      console.log('   Please run the database_setup.sql migration');
    } else {
      console.log('✅ Photos table accessible');
    }

    console.log('\n🎉 Setup verification complete!');
    console.log('\nNext steps:');
    console.log('1. If bucket creation fails: Run the SQL policies from TROUBLESHOOTING.md');
    console.log('2. If storage policies fail: Run the SQL policies from TROUBLESHOOTING.md');
    console.log('3. If database tables fail: Run database_setup.sql migration');
    console.log('4. Try uploading a photo in your app (this will create your user bucket)');
    console.log('\n💡 Per-user buckets will be created automatically when users upload!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStorageSetup();
