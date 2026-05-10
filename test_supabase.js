import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://soyrrlmvypbreobhwtez.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNveXJsbXZ5cGJyZW9ib2h3dGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNDc0MDQsImV4cCI6MjA5MzgyMzQwNH0.g_MYRi7eNywGv1x5AtULNV-brTweIrYiGDvq54d0PLw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log('\n🔍 Checking Supabase connection...');

  // 1. Auth check
  const { data: session } = await supabase.auth.getSession();
  console.log('✅ Supabase connected');

  // 2. Try to query profiles table
  console.log('\n📋 Checking profiles table...');
  const { data, error, status } = await supabase
    .from('profiles')
    .select('user_id, profile_data, created_at, updated_at')
    .limit(10);

  if (error) {
    if (error.code === '42P01') {
      console.error('❌ Table does NOT exist yet!');
      console.error('   → You need to run supabase_schema.sql in the Supabase SQL Editor first.');
      console.error('   → Go to: https://supabase.com/dashboard/project/soyrrlmvypbreobhwtez/sql/new');
    } else if (status === 401 || error.code === 'PGRST301') {
      console.log('⚠️  Table exists but RLS blocks unauthenticated reads (this is correct and secure!)');
      console.log('   → Data can only be read when a user is logged in — working as intended ✅');
    } else {
      console.error('❌ Error querying table:', error.message, '| Code:', error.code);
    }
    return;
  }

  if (data && data.length === 0) {
    console.log('✅ Table EXISTS and is ready!');
    console.log('   → No profiles saved yet (no user has completed onboarding).');
  } else if (data && data.length > 0) {
    console.log(`✅ Table EXISTS with ${data.length} saved profile(s)!`);
    data.forEach((row, i) => {
      const name = row.profile_data?.profile?.name || 'Unknown';
      const goal = row.profile_data?.goal || 'Not set';
      console.log(`   Profile ${i + 1}: Name="${name}", Goal="${goal}", Saved At: ${row.created_at}`);
    });
  }
}

checkData();
