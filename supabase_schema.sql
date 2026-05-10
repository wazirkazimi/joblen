-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/soyrrlmvypbreobhwtez/sql)

-- 1. Create the profiles table
create table if not exists public.profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Enable Row Level Security (RLS) so users can ONLY read/write their OWN profile
alter table public.profiles enable row level security;

-- 3. Policy: users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

-- 4. Policy: users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

-- 5. Policy: users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);
