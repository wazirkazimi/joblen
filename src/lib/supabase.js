import { createClient } from '@supabase/supabase-js';

const supabaseUrl      = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase env vars missing! Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const logError = async (errorMessage, userId = null) => {
  try {
    const { error } = await supabase.from('error_logs').insert({
      error: errorMessage,
      user_id: userId || null,
      timestamp: new Date().toISOString()
    });
    if (error) console.error('Supabase logError response error:', error);
  } catch (e) {
    console.error('Failed to log error to Supabase:', e);
  }
};
