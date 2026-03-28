import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// standard Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fallback logic for demo purposes (if no env vars)
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your-project-url';
};
