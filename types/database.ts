// Database types for SelfSwipe app
// These types match the database schema defined in database_setup.sql

export interface Photo {
  id: string;
  user_id: string;
  file_path: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
}

export interface SwipeSession {
  id: string;
  user_id: string;
  original_photo_id: string;
  session_data?: any; // JSONB field for flexible session data
  created_at: string;
  updated_at: string;
}

export interface SwipeImage {
  id: string;
  session_id: string;
  user_id: string;
  image_url: string;
  is_liked: boolean;
  generated_at: string;
}

// Insert types (without auto-generated fields)
export interface InsertPhoto {
  user_id: string;
  file_path: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
}

export interface InsertSwipeSession {
  user_id: string;
  original_photo_id: string;
  session_data?: any;
}

export interface InsertSwipeImage {
  session_id: string;
  user_id: string;
  image_url: string;
  is_liked?: boolean;
}

// Update types (partial updates)
export interface UpdatePhoto {
  file_name?: string;
  file_size?: number;
  mime_type?: string;
}

export interface UpdateSwipeSession {
  session_data?: any;
}

export interface UpdateSwipeImage {
  is_liked?: boolean;
}

// Database response types
export interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
}

export interface DatabaseListResponse<T> {
  data: T[] | null;
  error: string | null;
  count?: number;
}
