import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only create the client if we have BOTH the URL and the Key
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'undefined')
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

export const isSupabaseConfigured = () => {
  return !!supabaseUrl && 
         !!supabaseAnonKey && 
         supabaseUrl !== 'your-project-url' &&
         supabaseUrl !== 'undefined';
};
