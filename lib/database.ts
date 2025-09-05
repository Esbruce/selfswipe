import {
    DatabaseListResponse,
    DatabaseResponse,
    InsertPhoto,
    InsertSwipeImage,
    InsertSwipeSession,
    Photo,
    SwipeImage,
    SwipeSession,
    UpdatePhoto,
    UpdateSwipeImage,
    UpdateSwipeSession
} from '@/types/database';
import { supabase } from './supabase';

// Photo operations
export class PhotoService {
  static async createPhoto(photo: InsertPhoto): Promise<DatabaseResponse<Photo>> {
    try {
      const { data, error } = await supabase
        .from('photos')
        .insert(photo)
        .select()
        .single();

      if (error) {
        console.error('Error creating photo:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Photo creation error:', error);
      return { data: null, error: error.message };
    }
  }

  static async getPhotoById(id: string): Promise<DatabaseResponse<Photo>> {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching photo:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Photo fetch error:', error);
      return { data: null, error: error.message };
    }
  }

  static async getUserPhotos(userId: string): Promise<DatabaseListResponse<Photo>> {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user photos:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('User photos fetch error:', error);
      return { data: null, error: error.message };
    }
  }

  static async updatePhoto(id: string, updates: UpdatePhoto): Promise<DatabaseResponse<Photo>> {
    try {
      const { data, error } = await supabase
        .from('photos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating photo:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Photo update error:', error);
      return { data: null, error: error.message };
    }
  }

  static async deletePhoto(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting photo:', error);
        return { data: null, error: error.message };
      }

      return { data: true, error: null };
    } catch (error: any) {
      console.error('Photo deletion error:', error);
      return { data: null, error: error.message };
    }
  }
}

// SwipeSession operations
export class SwipeSessionService {
  static async createSession(session: InsertSwipeSession): Promise<DatabaseResponse<SwipeSession>> {
    try {
      const { data, error } = await supabase
        .from('swipe_sessions')
        .insert(session)
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Session creation error:', error);
      return { data: null, error: error.message };
    }
  }

  static async getSessionById(id: string): Promise<DatabaseResponse<SwipeSession>> {
    try {
      const { data, error } = await supabase
        .from('swipe_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching session:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Session fetch error:', error);
      return { data: null, error: error.message };
    }
  }

  static async getUserSessions(userId: string): Promise<DatabaseListResponse<SwipeSession>> {
    try {
      const { data, error } = await supabase
        .from('swipe_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user sessions:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('User sessions fetch error:', error);
      return { data: null, error: error.message };
    }
  }

  static async updateSession(id: string, updates: UpdateSwipeSession): Promise<DatabaseResponse<SwipeSession>> {
    try {
      const { data, error } = await supabase
        .from('swipe_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating session:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Session update error:', error);
      return { data: null, error: error.message };
    }
  }
}

// SwipeImage operations
export class SwipeImageService {
  static async createSwipeImage(image: InsertSwipeImage): Promise<DatabaseResponse<SwipeImage>> {
    try {
      const { data, error } = await supabase
        .from('swipe_images')
        .insert(image)
        .select()
        .single();

      if (error) {
        console.error('Error creating swipe image:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Swipe image creation error:', error);
      return { data: null, error: error.message };
    }
  }

  static async getSessionImages(sessionId: string): Promise<DatabaseListResponse<SwipeImage>> {
    try {
      const { data, error } = await supabase
        .from('swipe_images')
        .select('*')
        .eq('session_id', sessionId)
        .order('generated_at', { ascending: true });

      if (error) {
        console.error('Error fetching session images:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Session images fetch error:', error);
      return { data: null, error: error.message };
    }
  }

  static async updateSwipeImage(id: string, updates: UpdateSwipeImage): Promise<DatabaseResponse<SwipeImage>> {
    try {
      const { data, error } = await supabase
        .from('swipe_images')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating swipe image:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Swipe image update error:', error);
      return { data: null, error: error.message };
    }
  }

  static async getLikedImages(userId: string): Promise<DatabaseListResponse<SwipeImage>> {
    try {
      const { data, error } = await supabase
        .from('swipe_images')
        .select('*')
        .eq('user_id', userId)
        .eq('is_liked', true)
        .order('generated_at', { ascending: false });

      if (error) {
        console.error('Error fetching liked images:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Liked images fetch error:', error);
      return { data: null, error: error.message };
    }
  }
}

// Utility functions
export class DatabaseUtils {
  static async getUserStats(userId: string): Promise<{
    photoCount: number;
    sessionCount: number;
    likedImageCount: number;
  }> {
    try {
      const [photosResult, sessionsResult, likedImagesResult] = await Promise.all([
        PhotoService.getUserPhotos(userId),
        SwipeSessionService.getUserSessions(userId),
        SwipeImageService.getLikedImages(userId)
      ]);

      return {
        photoCount: photosResult.data?.length || 0,
        sessionCount: sessionsResult.data?.length || 0,
        likedImageCount: likedImagesResult.data?.length || 0,
      };
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      return {
        photoCount: 0,
        sessionCount: 0,
        likedImageCount: 0,
      };
    }
  }
}
