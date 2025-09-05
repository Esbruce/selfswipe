# SelfSwipe Complete Setup Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Run Database Setup
1. **Go to Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Sign in and select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run Complete Setup**
   - Copy the entire contents of `database_setup_complete.sql`
   - Paste it into the SQL Editor
   - Click "Run"

### Step 2: Verify Setup
Run this verification query in SQL Editor:
```sql
-- Check if all tables and policies are created
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('photos', 'swipe_sessions', 'swipe_images', 'user_profiles')
ORDER BY tablename;
```

### Step 3: Test the App
1. **Start your app**
   ```bash
   npm run build
   ```

2. **Try uploading a photo**
   - The app will automatically create a `user-{your-user-id}` bucket
   - Check Supabase Storage to see your bucket

## 🔧 What This Setup Does

### Database Tables Created:
- **`photos`** - Stores photo metadata
- **`swipe_sessions`** - Tracks user swipe sessions
- **`swipe_images`** - Stores generated images
- **`user_profiles`** - Public user profiles

### Storage Policies Created:
- **Per-user bucket creation** - Users can create their own buckets
- **Bucket management** - Users can manage their own buckets
- **File access** - Users can only access their own files

### Security Features:
- **Row Level Security (RLS)** - Enabled on all tables
- **User isolation** - Users can only access their own data
- **Automatic profile creation** - User profiles created on signup

## 🎯 Per-User Bucket System

### How It Works:
1. **User signs up** → Profile created automatically
2. **User uploads photo** → `user-{user-id}` bucket created automatically
3. **Files stored** → In user's private bucket
4. **Database records** → Linked to user and bucket

### Bucket Structure:
```
user-{user-id-1}/
└── upload/
    ├── image_1234567890.jpg
    └── image_1234567891.jpg

user-{user-id-2}/
└── upload/
    └── image_1234567892.jpg
```

## 🛠️ Troubleshooting

### Issue: "new row violates row-level security policy"
**Solution**: The setup script fixes this by creating proper RLS policies

### Issue: "Bucket not found"
**Solution**: Buckets are created automatically on first upload

### Issue: "Authentication required"
**Solution**: Make sure users are signed in before uploading

## 📊 Monitoring

### Check User Buckets:
```sql
SELECT name, created_at, public 
FROM storage.buckets 
WHERE name LIKE 'user-%'
ORDER BY created_at DESC;
```

### Check User Photos:
```sql
SELECT 
  p.file_name,
  p.file_size,
  p.created_at,
  up.full_name
FROM photos p
JOIN user_profiles up ON p.user_id = up.id
ORDER BY p.created_at DESC;
```

### Check Storage Usage:
```sql
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size
FROM storage.objects
WHERE bucket_id LIKE 'user-%'
GROUP BY bucket_id
ORDER BY total_size DESC;
```

## 🔒 Security Features

### User Isolation:
- Each user has their own bucket
- Users cannot access other users' files
- RLS policies enforce data separation

### Data Protection:
- All tables have RLS enabled
- Policies restrict access to user's own data
- Automatic profile creation on signup

### File Security:
- Files stored in user-specific buckets
- Public access only to user's own files
- Automatic cleanup when user is deleted

## 🚀 Next Steps

1. **Test the upload** - Try uploading a photo
2. **Check storage** - Verify bucket creation in Supabase
3. **Monitor usage** - Use the monitoring queries above
4. **Scale up** - The system handles unlimited users automatically

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all SQL policies were created successfully
3. Check Supabase logs for detailed error messages
4. Ensure users are properly authenticated before uploading
