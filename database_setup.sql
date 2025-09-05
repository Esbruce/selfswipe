-- SelfSwipe Database Setup
-- Run this in your Supabase SQL Editor

-- 1. Create a photos table to track uploaded images
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create a swipe_sessions table to track user sessions
CREATE TABLE IF NOT EXISTS swipe_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  original_photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create a swipe_images table to track generated variations
CREATE TABLE IF NOT EXISTS swipe_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES swipe_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_liked BOOLEAN DEFAULT FALSE,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_images ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for photos table
CREATE POLICY "Users can view their own photos" ON photos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own photos" ON photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos" ON photos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos" ON photos
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Create RLS policies for swipe_sessions table
CREATE POLICY "Users can view their own sessions" ON swipe_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON swipe_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON swipe_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON swipe_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Create RLS policies for swipe_images table
CREATE POLICY "Users can view their own swipe images" ON swipe_images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own swipe images" ON swipe_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own swipe images" ON swipe_images
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own swipe images" ON swipe_images
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_swipe_sessions_user_id ON swipe_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_sessions_created_at ON swipe_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_swipe_images_session_id ON swipe_images(session_id);
CREATE INDEX IF NOT EXISTS idx_swipe_images_user_id ON swipe_images(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_images_is_liked ON swipe_images(is_liked);

-- 9. Create storage bucket policies (if bucket exists)
-- Note: You'll need to create the 'photos' bucket manually in the Storage section first

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

-- 10. Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Create triggers for automatic timestamp updates
CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swipe_sessions_updated_at BEFORE UPDATE ON swipe_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Create a function to get user's photo count
CREATE OR REPLACE FUNCTION get_user_photo_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM photos WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create a function to get user's session count
CREATE OR REPLACE FUNCTION get_user_session_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM swipe_sessions WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
