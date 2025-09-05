import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Please create a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    // Persist session in AsyncStorage
    persistSession: true,
    // Detect session from URL (for deep linking)
    detectSessionInUrl: false,
  },
});
