// Database Setup Script for SelfSwipe
// This script helps you set up the complete database schema

const fs = require('fs');
const path = require('path');

console.log('🚀 SelfSwipe Database Setup Helper\n');

// Read the SQL file
const sqlFilePath = path.join(__dirname, '..', 'database_setup_complete.sql');

if (!fs.existsSync(sqlFilePath)) {
  console.error('❌ database_setup_complete.sql not found!');
  console.log('Please make sure the file exists in the project root.');
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('📋 Database Setup Instructions:');
console.log('================================\n');

console.log('1. Go to your Supabase Dashboard:');
console.log('   https://supabase.com/dashboard\n');

console.log('2. Select your project\n');

console.log('3. Click "SQL Editor" in the left sidebar\n');

console.log('4. Click "New query"\n');

console.log('5. Copy and paste the following SQL:\n');

console.log('─'.repeat(80));
console.log(sqlContent);
console.log('─'.repeat(80));

console.log('\n6. Click "Run" to execute the setup\n');

console.log('7. Verify the setup by running this query:');
console.log(`
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('photos', 'swipe_sessions', 'swipe_images', 'user_profiles')
ORDER BY tablename;
`);

console.log('\n✅ Expected Results:');
console.log('   - 4 tables should be listed');
console.log('   - All should have rls_enabled = true\n');

console.log('8. Test your app by uploading a photo!');
console.log('   - A user bucket will be created automatically');
console.log('   - Check Supabase Storage to see your bucket\n');

console.log('🎉 Setup Complete!');
console.log('\nYour app now supports:');
console.log('✅ Per-user bucket creation');
console.log('✅ Automatic profile creation');
console.log('✅ Secure file storage');
console.log('✅ Row-level security');
console.log('✅ User data isolation');

console.log('\n📚 For more details, see SETUP_GUIDE.md');
