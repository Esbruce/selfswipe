# SelfSwipe Troubleshooting Guide

## Per-User Bucket System

### How It Works
The app now creates a **separate bucket for each user** when they upload their first photo:
- **Bucket naming**: `user-{user-id}` (e.g., `user-4eda5d63-a379-45f9-8d67-34d274ab1dd3`)
- **Automatic creation**: Buckets are created automatically when users upload
- **Better security**: Each user can only access their own bucket
- **Better organization**: Files are isolated per user

### Current Issue: RLS Policy Error

### Error Message
```
ERROR Error creating bucket: [StorageApiError: new row violates row-level security policy]
```

### Root Cause
Your Supabase project has Row Level Security (RLS) enabled for storage, which prevents automatic bucket creation through the API.

### Solution Steps

#### Option 1: Allow Automatic Bucket Creation (Recommended)
1. **Go to Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Sign in and select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run This SQL to Allow Bucket Creation**
   ```sql
   -- Allow authenticated users to create buckets
   CREATE POLICY "Authenticated users can create buckets" ON storage.buckets
   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   
   -- Allow users to manage their own buckets
   CREATE POLICY "Users can manage their own buckets" ON storage.buckets
   FOR ALL USING (name = 'user-' || auth.uid()::text);
   ```

4. **Click "Run"**

#### Option 2: Create Buckets Manually (If Option 1 Fails)
1. **Go to Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Sign in and select your project

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - Click "New bucket"

3. **Configure Bucket**
   - **Name**: `user-{your-user-id}` (replace with actual user ID)
   - **Public**: ✅ Yes
   - **File size limit**: 5 MB
   - **Allowed MIME types**: 
     - `image/jpeg`
     - `image/png`
     - `image/gif`
     - `image/webp`

4. **Create Bucket**
   - Click "Create bucket"

#### Step 3: Set Up Storage Policies for Per-User Buckets
1. **Go to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

2. **Run Storage Policies for Per-User Buckets**
   ```sql
   -- Allow users to upload files to their own bucket
   CREATE POLICY "Users can upload to their own bucket" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'user-' || auth.uid()::text
   );

   -- Allow users to view files in their own bucket
   CREATE POLICY "Users can view their own bucket files" ON storage.objects
   FOR SELECT USING (
     bucket_id = 'user-' || auth.uid()::text
   );

   -- Allow users to delete files from their own bucket
   CREATE POLICY "Users can delete their own bucket files" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'user-' || auth.uid()::text
   );

   -- Allow users to update files in their own bucket
   CREATE POLICY "Users can update their own bucket files" ON storage.objects
   FOR UPDATE USING (
     bucket_id = 'user-' || auth.uid()::text
   );
   ```

3. **Click "Run"**

#### Step 3: Test the Setup
1. **Run the setup script**
   ```bash
   node scripts/setup-bucket.js
   ```

2. **Try uploading a photo** in your app

## Alternative Solutions

### Option 1: Disable RLS (Not Recommended)
```sql
-- Only for development/testing
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

### Option 2: Use Service Role Key
If you have a service role key, you can use it for bucket creation:

1. **Get Service Role Key**
   - Go to Settings → API
   - Copy the "service_role" key (keep it secret!)

2. **Update Supabase Client**
   ```typescript
   // Only for bucket creation, not for regular app use
   const supabaseAdmin = createClient(url, serviceRoleKey);
   ```

## Verification Steps

### 1. Check Bucket Exists
```sql
SELECT name FROM storage.buckets WHERE name = 'photos';
```

### 2. Check Storage Policies
```sql
SELECT policyname, cmd, qual FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

### 3. Test File Upload
- Try uploading a photo in your app
- Check the console for success/error messages
- Verify the file appears in Supabase Storage

## Common Issues

### Issue: "Bucket not found"
**Solution**: Create the bucket manually in Supabase dashboard

### Issue: "Permission denied"
**Solution**: Check that RLS policies are correctly set up

### Issue: "File too large"
**Solution**: Ensure file size is under 5MB

### Issue: "Invalid file type"
**Solution**: Make sure the image is JPEG, PNG, GIF, or WebP

## File Structure After Setup

Your storage should look like this with per-user buckets:
```
user-{user_id_1}/          # User 1's bucket
└── upload/
    ├── image_1234567890.jpg
    └── image_1234567891.jpg

user-{user_id_2}/          # User 2's bucket
└── upload/
    └── image_1234567892.jpg

user-{user_id_3}/          # User 3's bucket
└── upload/
    ├── image_1234567893.jpg
    └── image_1234567894.jpg
```

### Benefits of Per-User Buckets:
- **Better Security**: Users can only access their own bucket
- **Better Organization**: Each user's files are completely isolated
- **Easier Management**: Can delete entire user data by removing their bucket
- **Scalability**: No single bucket becomes too large
- **Privacy**: Users cannot accidentally access other users' files

## Getting Help

If you're still having issues:

1. **Check Supabase Logs**
   - Go to Logs in your Supabase dashboard
   - Look for storage-related errors

2. **Verify Authentication**
   - Make sure users are properly signed in
   - Check that the user ID matches the folder structure

3. **Test with Different User**
   - Try creating a new user account
   - Test upload with the new user

4. **Check Network Connectivity**
   - Ensure your app can reach Supabase
   - Check for any firewall or network restrictions
