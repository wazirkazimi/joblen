import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://soyrlmvypbreobohwtez.supabase.co').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNveXJsbXZ5cGJyZW9ib2h3dGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDc0MDQsImV4cCI6MjA5MzgyMzQwNH0.g_MYRi7eNywGv1x5AtULNV-brTweIrYiGDvq54d0PLw').trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
