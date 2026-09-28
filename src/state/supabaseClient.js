import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('=== SUPABASE CLIENT DEBUG ===');
console.log('VITE_SUPABASE_URL:', supabaseUrl);
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET (length: ' + supabaseAnonKey.length + ')' : 'UNDEFINED');
console.log('import.meta.env:', import.meta.env);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ MISSING ENV VARS! Check .env file and restart dev server.');
}

// Singleton pattern to prevent multiple GoTrueClient instances in dev (HMR)
let supabaseInstance = null;

export const supabase = supabaseInstance ?? (supabaseInstance = createClient(supabaseUrl, supabaseAnonKey));