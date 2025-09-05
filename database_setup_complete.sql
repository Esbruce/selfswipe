-- Complete Database Setup for SelfSwipe
-- This script sets up all necessary tables and policies for per-user bucket system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the 'photos' table
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on photos table
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for photos table
DROP POLICY IF EXISTS "Authenticated users can insert their own photos." ON public.photos;
CREATE POLICY "Authenticated users can insert their own photos." ON public.photos 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can view their own photos." ON public.photos;
CREATE POLICY "Authenticated users can view their own photos." ON public.photos 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can update their own photos." ON public.photos;
CREATE POLICY "Authenticated users can update their own photos." ON public.photos 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can delete their own photos." ON public.photos;
CREATE POLICY "Authenticated users can delete their own photos." ON public.photos 
FOR DELETE USING (auth.uid() = user_id);

-- Create the 'swipe_sessions' table
CREATE TABLE IF NOT EXISTS public.swipe_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
  variation_type TEXT NOT NULL,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on swipe_sessions table
ALTER TABLE public.swipe_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for swipe_sessions table
DROP POLICY IF EXISTS "Authenticated users can insert their own swipe sessions." ON public.swipe_sessions;
CREATE POLICY "Authenticated users can insert their own swipe sessions." ON public.swipe_sessions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can view their own swipe sessions." ON public.swipe_sessions;
CREATE POLICY "Authenticated users can view their own swipe sessions." ON public.swipe_sessions 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can update their own swipe sessions." ON public.swipe_sessions;
CREATE POLICY "Authenticated users can update their own swipe sessions." ON public.swipe_sessions 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can delete their own swipe sessions." ON public.swipe_sessions;
CREATE POLICY "Authenticated users can delete their own swipe sessions." ON public.swipe_sessions 
FOR DELETE USING (auth.uid() = user_id);

-- Create the 'swipe_images' table
CREATE TABLE IF NOT EXISTS public.swipe_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.swipe_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  is_liked BOOLEAN DEFAULT FALSE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on swipe_images table
ALTER TABLE public.swipe_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for swipe_images table
DROP POLICY IF EXISTS "Authenticated users can insert their own swipe images." ON public.swipe_images;
CREATE POLICY "Authenticated users can insert their own swipe images." ON public.swipe_images 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can view their own swipe images." ON public.swipe_images;
CREATE POLICY "Authenticated users can view their own swipe images." ON public.swipe_images 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can update their own swipe images." ON public.swipe_images;
CREATE POLICY "Authenticated users can update their own swipe images." ON public.swipe_images 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can delete their own swipe images." ON public.swipe_images;
CREATE POLICY "Authenticated users can delete their own swipe images." ON public.swipe_images 
FOR DELETE USING (auth.uid() = user_id);

-- Create a public user profiles table for better user management
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles table
DROP POLICY IF EXISTS "Users can view their own profile." ON public.user_profiles;
CREATE POLICY "Users can view their own profile." ON public.user_profiles 
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.user_profiles;
CREATE POLICY "Users can update their own profile." ON public.user_profiles 
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.user_profiles;
CREATE POLICY "Users can insert their own profile." ON public.user_profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON public.photos(created_at);
CREATE INDEX IF NOT EXISTS idx_swipe_sessions_user_id ON public.swipe_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_sessions_created_at ON public.swipe_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_swipe_images_user_id ON public.swipe_images(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_images_session_id ON public.swipe_images(session_id);
CREATE INDEX IF NOT EXISTS idx_swipe_images_is_liked ON public.swipe_images(is_liked);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_photos_updated_at ON public.photos;
CREATE TRIGGER update_photos_updated_at 
    BEFORE UPDATE ON public.photos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_swipe_sessions_updated_at ON public.swipe_sessions;
CREATE TRIGGER update_swipe_sessions_updated_at 
    BEFORE UPDATE ON public.swipe_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- STORAGE BUCKET POLICIES
-- ========================================

-- Allow authenticated users to create buckets (for per-user buckets)
DROP POLICY IF EXISTS "Authenticated users can create buckets" ON storage.buckets;
CREATE POLICY "Authenticated users can create buckets" ON storage.buckets
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to manage their own buckets
DROP POLICY IF EXISTS "Users can manage their own buckets" ON storage.buckets;
CREATE POLICY "Users can manage their own buckets" ON storage.buckets
FOR ALL USING (name = 'user-' || auth.uid()::text);

-- Allow users to upload files to their own bucket
DROP POLICY IF EXISTS "Users can upload to their own bucket" ON storage.objects;
CREATE POLICY "Users can upload to their own bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-' || auth.uid()::text
);

-- Allow users to view files in their own bucket
DROP POLICY IF EXISTS "Users can view their own bucket files" ON storage.objects;
CREATE POLICY "Users can view their own bucket files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'user-' || auth.uid()::text
);

-- Allow users to delete files from their own bucket
DROP POLICY IF EXISTS "Users can delete their own bucket files" ON storage.objects;
CREATE POLICY "Users can delete their own bucket files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-' || auth.uid()::text
);

-- Allow users to update files in their own bucket
DROP POLICY IF EXISTS "Users can update their own bucket files" ON storage.objects;
CREATE POLICY "Users can update their own bucket files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-' || auth.uid()::text
);

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get user bucket name
CREATE OR REPLACE FUNCTION public.get_user_bucket_name(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN 'user-' || user_uuid::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user bucket exists
CREATE OR REPLACE FUNCTION public.user_bucket_exists(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  bucket_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE name = 'user-' || user_uuid::text;
  
  RETURN bucket_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ========================================
-- SAMPLE DATA (Optional - for testing)
-- ========================================

-- Uncomment the following lines to create sample data for testing
/*
-- Insert sample user profile (replace with actual user ID)
INSERT INTO public.user_profiles (id, email, full_name)
VALUES (
  'your-user-id-here',
  'test@example.com',
  'Test User'
) ON CONFLICT (id) DO NOTHING;
*/

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if all tables exist
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('photos', 'swipe_sessions', 'swipe_images', 'user_profiles')
ORDER BY tablename;

-- Check if all policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename, policyname;

-- Check if all functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user', 'get_user_bucket_name', 'user_bucket_exists')
ORDER BY routine_name;
