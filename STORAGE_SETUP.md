# Storage Setup

## Recommended strategy

- Use a single bucket (e.g., `photos`) rather than per-user buckets.
- Store files at path: `<userId>/<folder>/<filename>`.
- Prefer keeping the bucket private; if public, `getPublicUrl` will work. For private, use signed URLs.

## Client configuration

- Client uploads are done with Blob uploads (no base64) and optional compression via `expo-image-manipulator`.
- Filenames include a timestamp to avoid collisions.
- Enforced size limit: 5MB.

## Policies (if bucket is private)

Example policies for authenticated users to only access their own files:

1. Allow insert for own folder
```
create policy "Allow users to upload their own files" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'photos' and
  (storage.foldername(name))[1] = auth.uid()::text
);
```

2. Allow read for own folder
```
create policy "Allow users to read their own files" on storage.objects
for select to authenticated
using (
  bucket_id = 'photos' and
  (storage.foldername(name))[1] = auth.uid()::text
);
```

3. Allow delete for own folder
```
create policy "Allow users to delete their own files" on storage.objects
for delete to authenticated
using (
  bucket_id = 'photos' and
  (storage.foldername(name))[1] = auth.uid()::text
);
```

Note: Adjust policies to your exact path structure if needed.

## Environment

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in your Expo config or `.env`, and ensure `lib/supabase.js` uses AsyncStorage for auth persistence.
# Supabase Storage Setup Guide

This guide explains how to set up Supabase storage for the photo upload functionality in your SelfSwipe app.

## Prerequisites

1. A Supabase project with authentication enabled
2. Your Supabase URL and anon key configured in your app

## Storage Bucket Setup

### 1. Bucket Creation

The app will attempt to automatically create the storage bucket when you first upload an image. However, if you encounter a **Row Level Security (RLS) policy error**, you'll need to create the bucket manually.

**For detailed setup instructions, see: [BUCKET_SETUP_GUIDE.md](./BUCKET_SETUP_GUIDE.md)**

The system will:
- ✅ Check if the `photos` bucket exists
- ✅ Attempt to create it automatically if it doesn't exist
- ✅ Provide clear error messages if manual setup is required
- ✅ Configure proper settings (public access, file type restrictions, size limits)

### Manual Setup (Optional)

If you prefer to create the bucket manually:

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Name the bucket: `photos`
5. Set it as **Public** (for easy access to uploaded images)
6. Click **Create bucket**

### 2. Configure Storage Policies

You need to set up Row Level Security (RLS) policies for the storage bucket:

#### Policy 1: Allow authenticated users to upload files
```sql
CREATE POLICY "Users can upload their own files" ON storage.objects
FOR INSERT WITH CHECK (
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 2: Allow authenticated users to view their own files
```sql
CREATE POLICY "Users can view their own files" ON storage.objects
FOR SELECT USING (
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 3: Allow authenticated users to delete their own files
```sql
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. File Structure

The upload system uses the following file structure:
```
photos/
├── {user_id}/
│   └── upload/
│       ├── image_1234567890.jpg
│       ├── image_1234567891.jpg
│       └── ...
```

Where:
- `{user_id}` is the authenticated user's UUID
- `upload/` is the folder for user uploads
- Files are named with timestamp for uniqueness

## Testing the Upload Functionality

### 1. Authentication Required

The upload functionality requires users to be authenticated. Make sure to:
1. Sign up or log in through the app
2. Verify the user is authenticated before attempting upload

### 2. Testing on Different Platforms

#### iOS Simulator/Device
- Camera and photo library permissions are handled automatically
- Test both "Take Photo" and "Choose from Gallery" options

#### Android Emulator/Device
- Ensure camera and storage permissions are granted
- Test both camera capture and gallery selection

### 3. Upload Flow

1. User selects an image (camera or gallery)
2. User chooses variation type (hairstyle or outfit)
3. User clicks "Upload & Generate"
4. Image is uploaded to Supabase storage with progress indicator
5. Upon successful upload, user can proceed to generate variations

### 4. Error Handling

The system handles various error scenarios:
- Network connectivity issues
- Authentication failures
- Storage quota exceeded
- Invalid file formats
- Permission denials

## Troubleshooting

### Common Issues

1. **Upload fails with authentication error**
   - Ensure user is logged in
   - Check Supabase auth configuration

2. **Storage policy errors**
   - Verify RLS policies are correctly set up
   - Check bucket permissions

3. **File upload fails**
   - Check network connectivity
   - Verify file size limits
   - Ensure proper file format (JPEG/PNG)

4. **Progress indicator not showing**
   - Check if upload is actually starting
   - Verify error handling is working

### Debug Information

The upload utility logs detailed information to the console:
- Upload progress
- Error messages
- File paths and URLs
- Authentication status

## File Upload Utility Features

The `lib/fileUpload.ts` utility provides:

- **uploadFileToSupabase()**: Main upload function with progress tracking
- **deleteFileFromSupabase()**: Delete uploaded files
- **getSignedUrl()**: Generate signed URLs for private access
- **listUserFiles()**: List user's uploaded files

## Security Considerations

1. **File Validation**: Only image files are accepted
2. **User Isolation**: Users can only access their own files
3. **Authentication**: All operations require valid authentication
4. **File Size Limits**: Consider implementing size restrictions
5. **Content Moderation**: Consider adding content filtering

## Performance Optimization

1. **Image Compression**: Images are compressed before upload (quality: 0.8)
2. **Progress Feedback**: Real-time upload progress for better UX
3. **Error Recovery**: Automatic retry mechanisms for failed uploads
4. **Caching**: Consider implementing local caching for uploaded images
