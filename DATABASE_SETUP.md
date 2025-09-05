# Database Setup Guide

## Overview

This guide will help you set up the database tables for the SelfSwipe app using Supabase.

## Prerequisites

1. A Supabase project with authentication enabled
2. Access to your Supabase dashboard
3. Your Supabase URL and anon key configured in your app

## Setup Steps

### 1. Run the Database Migration

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the contents of `database_setup.sql`
5. Click **Run** to execute the migration

### 2. Verify Tables Created

After running the migration, you should see these tables in your **Table Editor**:

- `photos` - Stores uploaded photo metadata
- `swipe_sessions` - Tracks user swipe sessions
- `swipe_images` - Stores generated image variations

### 3. Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Name: `photos`
4. Set as **Public**
5. Click **Create bucket**

### 4. Verify RLS Policies

The migration automatically creates Row Level Security (RLS) policies. You can verify them in:

1. **Authentication** → **Policies**
2. Look for policies on `photos`, `swipe_sessions`, and `swipe_images` tables

## Database Schema

### Photos Table
```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Swipe Sessions Table
```sql
CREATE TABLE swipe_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  original_photo_id UUID REFERENCES photos(id),
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Swipe Images Table
```sql
CREATE TABLE swipe_images (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES swipe_sessions(id),
  user_id UUID REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  is_liked BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMP WITH TIME ZONE
);
```

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Policies prevent unauthorized access

### Storage Policies
- Users can only upload to their own folders
- File access is restricted to the owner
- Automatic cleanup when users are deleted

## Usage in Code

### Upload a Photo
```typescript
import { uploadFileToSupabase } from '@/lib/fileUpload';

const result = await uploadFileToSupabase(fileUri, {
  bucket: 'photos',
  userId: user.id,
  folder: 'upload'
});

if (result.success) {
  console.log('Photo uploaded:', result.url);
  console.log('Photo ID:', result.photoId);
}
```

### Create a Swipe Session
```typescript
import { SwipeSessionService } from '@/lib/database';

const session = await SwipeSessionService.createSession({
  user_id: user.id,
  original_photo_id: photoId,
  session_data: { variationType: 'hairstyle' }
});
```

### Track Swipe Images
```typescript
import { SwipeImageService } from '@/lib/database';

const image = await SwipeImageService.createSwipeImage({
  session_id: sessionId,
  user_id: user.id,
  image_url: generatedImageUrl,
  is_liked: false
});
```

## Troubleshooting

### Common Issues

1. **"Table doesn't exist"** - Make sure you ran the migration
2. **"Permission denied"** - Check RLS policies are enabled
3. **"Foreign key constraint"** - Ensure referenced records exist
4. **"Storage bucket not found"** - Create the `photos` bucket manually

### Verification Queries

Test your setup with these queries:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('photos', 'swipe_sessions', 'swipe_images');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('photos', 'swipe_sessions', 'swipe_images');

-- Check storage bucket
SELECT name FROM storage.buckets WHERE name = 'photos';
```

## Next Steps

1. **Test the upload functionality** - Try uploading a photo
2. **Verify data persistence** - Check that records are created in the database
3. **Test user isolation** - Ensure users can only see their own data
4. **Monitor performance** - Check query performance with indexes

## Maintenance

### Regular Tasks
- Monitor storage usage
- Clean up old sessions if needed
- Update RLS policies as requirements change
- Backup important data

### Performance Optimization
- The migration includes indexes for common queries
- Monitor slow queries in the Supabase dashboard
- Consider additional indexes based on usage patterns
