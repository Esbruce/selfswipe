# Supabase Storage Bucket Setup Guide

## Issue: Row Level Security Policy Error

If you're getting the error: `new row violates row-level security policy`, this means your Supabase project has Row Level Security (RLS) enabled for storage, which prevents automatic bucket creation.

## Solution 1: Create Bucket Manually (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project

### Step 2: Create Storage Bucket
1. In the left sidebar, click **Storage**
2. Click **New bucket**
3. Enter bucket name: `photos`
4. Set **Public bucket** to `true`
5. Click **Create bucket**

### Step 3: Configure Bucket Settings
1. Click on the `photos` bucket
2. Go to **Settings** tab
3. Set **File size limit** to `5 MB`
4. Set **Allowed MIME types** to:
   - `image/jpeg`
   - `image/png`
   - `image/gif`
   - `image/webp`

## Solution 2: Fix RLS Policies (Advanced)

If you want to allow automatic bucket creation, you need to modify the RLS policies.

### Step 1: Access SQL Editor
1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**

### Step 2: Create Storage Policies
Run these SQL commands:

```sql
-- Allow authenticated users to create buckets
CREATE POLICY "Allow authenticated users to create buckets" ON storage.buckets
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to view buckets
CREATE POLICY "Allow authenticated users to view buckets" ON storage.buckets
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to update buckets
CREATE POLICY "Allow authenticated users to update buckets" ON storage.buckets
FOR UPDATE USING (auth.role() = 'authenticated');
```

### Step 3: Create Object Policies
```sql
-- Allow users to upload their own files
CREATE POLICY "Users can upload their own files" ON storage.objects
FOR INSERT WITH CHECK (
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own files
CREATE POLICY "Users can view their own files" ON storage.objects
FOR SELECT USING (
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Solution 3: Disable RLS (Not Recommended)

⚠️ **Warning**: This reduces security and is not recommended for production.

```sql
-- Disable RLS on storage.buckets
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- Disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

## Verification

After setting up the bucket, test the upload functionality:

1. The app should now be able to upload images
2. Files will be stored in the path: `{user_id}/upload/image_timestamp.jpg`
3. You can view uploaded files in the Supabase Storage dashboard

## Troubleshooting

### Common Issues:

1. **"Bucket not found"** - Make sure the bucket name is exactly `photos`
2. **"Permission denied"** - Check that RLS policies are correctly set up
3. **"File too large"** - Ensure file size is under 5MB
4. **"Invalid file type"** - Make sure the image is JPEG, PNG, GIF, or WebP

### File Structure:
```
photos/
├── {user_id_1}/
│   └── upload/
│       ├── image_1234567890.jpg
│       └── image_1234567891.jpg
├── {user_id_2}/
│   └── upload/
│       └── image_1234567892.jpg
```

## Security Best Practices

1. **Keep RLS enabled** - Don't disable Row Level Security
2. **Use proper policies** - Ensure users can only access their own files
3. **Set file size limits** - Prevent abuse with large file uploads
4. **Restrict file types** - Only allow image files
5. **Regular audits** - Monitor storage usage and access patterns
