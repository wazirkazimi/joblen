import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://soyrrlmvypbreobhwtez.supabase.co').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNveXJybXZ5cGJyZW9iaHd0ZXoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc3ODI0NzQwNCwiZXhwIjoyMDkzODIzNDA0fQ.g_MYRi7eNywGv1x5AtULNV-brTweIrYiGDvq54d0PLw').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
