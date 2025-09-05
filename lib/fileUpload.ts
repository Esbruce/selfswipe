import { InsertPhoto } from '@/types/database';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { PhotoService } from './database';
import { supabase } from './supabase';

function guessMimeFromUri(uri: string): string {
  const ext = (uri.split('.').pop() || '').toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'heic':
    case 'heif':
      return 'image/heic';
    default:
      return 'application/octet-stream';
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  // Remove any non-base64 chars (newlines, spaces)
  const sanitized = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  let bufferLength = sanitized.length * 0.75;
  if (sanitized[sanitized.length - 1] === '=') bufferLength--;
  if (sanitized[sanitized.length - 2] === '=') bufferLength--;

  const bytes = new Uint8Array(bufferLength);
  let encoded1: number, encoded2: number, encoded3: number, encoded4: number;
  let p = 0;

  for (let i = 0; i < sanitized.length; i += 4) {
    encoded1 = chars.indexOf(sanitized[i]);
    encoded2 = chars.indexOf(sanitized[i + 1]);
    encoded3 = chars.indexOf(sanitized[i + 2]);
    encoded4 = chars.indexOf(sanitized[i + 3]);

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (encoded3 !== 64) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    if (encoded4 !== 64) bytes[p++] = ((encoded3 & 3) << 6) | encoded4;
  }

  return bytes;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
  photoId?: string;
}

export interface UploadOptions {
  bucket?: string; // Defaults to a single shared bucket (e.g., 'photos')
  fileName?: string;
  userId: string;
  folder?: string;
  upsert?: boolean;
  sourceMimeType?: string;
}

/**
 * Uploads a file to Supabase storage
 * @param fileUri - Local file URI (from expo-image-picker)
 * @param options - Upload configuration options
 * @returns Promise with upload result
 */
export async function uploadFileToSupabase(
  fileUri: string,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    const { fileName, userId, folder = 'upload', upsert = false } = options;

    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('No authenticated session found:', sessionError);
      return {
        success: false,
        error: 'Authentication required. Please sign in to upload files.',
      };
    }

    const bucket = options.bucket || 'photos';

    // Determine source and desired output mime/extension
    const sourceMime = options.sourceMimeType || guessMimeFromUri(fileUri);
    const keepPng = sourceMime === 'image/png';
    const outputExt = keepPng ? 'png' : 'jpg';
    const outputMime = keepPng ? 'image/png' : 'image/jpeg';

    // Preprocess: resize; convert HEIC/HEIF and other formats to JPEG; keep PNG if source is PNG
    const maxDimension = 1024;
    const manipulateOptions = keepPng
      ? { format: ImageManipulator.SaveFormat.PNG }
      : { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG };
    const manipulated = await ImageManipulator.manipulateAsync(
      fileUri,
      [{ resize: { width: maxDimension } }],
      manipulateOptions as any
    );

    // Optional: enforce size limit after compression
    const info = await FileSystem.getInfoAsync(manipulated.uri, { size: true });
    const compressedSize = (info.size as number) || 0;
    if (compressedSize > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'Image is still larger than 5MB after compression. Try a smaller image.',
      };
    }

    // Build filename and path: <userId>/<folder>/<filename>
    const safeBase = fileName?.replace(/[^a-zA-Z0-9-_]/g, '') || `image_${Date.now()}`;
    const finalFileName = `${safeBase}.${outputExt}`;
    const filePath = `${userId}/${folder}/${finalFileName}`;

    // Read processed file as base64 and convert to bytes (RN-safe)
    const base64Data = await FileSystem.readAsStringAsync(manipulated.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const uint8Array = base64ToUint8Array(base64Data);

    // Upload binary bytes directly
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, uint8Array, {
        cacheControl: '3600',
        upsert,
        contentType: outputMime,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      if (uploadError.message.includes('not found')) {
        return {
          success: false,
          error: `Storage bucket '${bucket}' not found. Please create it in your Supabase dashboard. See TROUBLESHOOTING.md.`,
        };
      }
      if (uploadError.message.includes('row-level security')) {
        return {
          success: false,
          error: 'Storage access denied due to security policies. Check your storage policies.',
        };
      }
      if (uploadError.message.toLowerCase().includes('file size')) {
        return {
          success: false,
          error: 'File too large. Please choose an image smaller than 5MB.',
        };
      }
      return {
        success: false,
        error: uploadError.message || 'Upload failed. Please try again.',
      };
    }

    // Public URL for public buckets. For private buckets, use signed URLs instead
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);

    // Save photo record to database (non-blocking errors are logged)
    const photoData: InsertPhoto = {
      user_id: session.user.id,
      file_path: `${bucket}/${filePath}`,
      file_url: urlData.publicUrl,
      file_name: finalFileName,
      file_size: compressedSize,
      mime_type: outputMime,
    };
    const photoResult = await PhotoService.createPhoto(photoData);
    if (photoResult.error) {
      console.error('Error saving photo to database:', photoResult.error);
    }

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      photoId: photoResult.data?.id,
    };
  } catch (error: any) {
    console.error('File upload error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during upload',
    };
  }
}

/**
 * Deletes a file from Supabase storage
 * @param filePath - Path to the file in storage
 * @param bucket - Storage bucket name
 * @returns Promise with deletion result
 */
export async function deleteFileFromSupabase(
  filePath: string,
  bucket: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error.message || 'Delete failed',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('File deletion error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during deletion',
    };
  }
}

/**
 * Gets a signed URL for a file in Supabase storage
 * @param filePath - Path to the file in storage
 * @param bucket - Storage bucket name
 * @param expiresIn - URL expiration time in seconds (default: 3600)
 * @returns Promise with signed URL
 */
export async function getSignedUrl(
  filePath: string,
  bucket: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create signed URL',
      };
    }

    return {
      success: true,
      url: data.signedUrl,
    };
  } catch (error: any) {
    console.error('Signed URL creation error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
}

/**
 * Creates a storage bucket if it doesn't exist
 * @param bucketName - Name of the bucket to create
 * @param options - Bucket configuration options
 * @returns Promise with creation result
 */
export async function createBucketIfNotExists(
  bucketName: string,
  options: {
    public?: boolean;
    allowedMimeTypes?: string[];
    fileSizeLimit?: number;
  } = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('No authenticated session found:', sessionError);
      return {
        success: false,
        error: 'Authentication required to create storage buckets.',
      };
    }

    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return {
        success: false,
        error: 'Failed to check storage buckets',
      };
    }

    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (bucketExists) {
      return { success: true }; // Bucket already exists
    }

    // Create bucket with default options
    const bucketOptions = {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB limit
      ...options,
    };

    console.log(`Creating bucket: ${bucketName}`);
    const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, bucketOptions);

    if (createError) {
      console.error('Error creating bucket:', createError);
      return {
        success: false,
        error: `Failed to create storage bucket: ${createError.message}`,
      };
    }
    
    console.log(`Bucket ${bucketName} created successfully`);
    return { success: true };
  } catch (error: any) {
    console.error('Bucket creation error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
}

/**
 * Lists files in a user's folder
 * @param userId - User ID
 * @param bucket - Storage bucket name (optional, will use user-specific bucket if not provided)
 * @param folder - Folder name (default: 'upload')
 * @returns Promise with file list
 */
export async function listUserFiles(
  userId: string,
  bucket?: string,
  folder: string = 'upload'
): Promise<{ success: boolean; files?: any[]; error?: string }> {
  try {
    // Use user-specific bucket if not provided
    const userBucket = bucket || `user-${userId}`;
    
    const { data, error } = await supabase.storage
      .from(userBucket)
      .list(folder); // No need for userId in path since bucket is user-specific

    if (error) {
      console.error('List files error:', error);
      return {
        success: false,
        error: error.message || 'Failed to list files',
      };
    }

    return {
      success: true,
      files: data || [],
    };
  } catch (error: any) {
    console.error('List files error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
}

/**
 * Gets user-specific bucket name
 * @param userId - User ID
 * @returns User-specific bucket name
 */
export function getUserBucketName(userId: string): string {
  return `user-${userId}`;
}

/**
 * Checks if a user's bucket exists
 * @param userId - User ID
 * @returns Promise with bucket existence status
 */
export async function checkUserBucketExists(userId: string): Promise<{ success: boolean; exists?: boolean; error?: string }> {
  try {
    const userBucket = getUserBucketName(userId);
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to check buckets',
      };
    }

    const exists = buckets?.some(b => b.name === userBucket) || false;
    
    return {
      success: true,
      exists,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
}
