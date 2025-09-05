import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

// Get environment variables with fallback values
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if environment variables are defined
if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key') {
  console.warn('Supabase environment variables are not set. Using placeholder values. Please create a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY for full functionality.');
  console.warn('Make sure to:');
  console.warn('1. Create a .env file in your project root');
  console.warn('2. Add your Supabase URL and anon key to the .env file');
  console.warn('3. Restart your development server after creating the .env file');
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey, 
  {
  auth: {
    // Enable automatic session refresh
    autoRefreshToken: true,
    // Persist session in AsyncStorage
    persistSession: true,
    storage: AsyncStorage,
    // Detect session from URL (for deep linking)
    detectSessionInUrl: false,
  },
});
