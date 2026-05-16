-- Run this in Supabase SQL Editor to enable history + feedback

create table if not exists public.analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  job_description text,
  result jsonb not null,
  feedback_decision text,        -- 'yes' | 'no'
  feedback_reasons text[],       -- array of reason strings
  created_at timestamptz default now()
);

alter table public.analyses enable row level security;

create policy "Users can read own analyses"
  on public.analyses for select using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.analyses for insert with check (auth.uid() = user_id);

create policy "Users can update own analyses"
  on public.analyses for update using (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on public.analyses for delete using (auth.uid() = user_id);

-- If the table already exists, just add the new columns:
-- alter table public.analyses add column if not exists feedback_decision text;
-- alter table public.analyses add column if not exists feedback_reasons text[];
-- create policy "Users can update own analyses" on public.analyses for update using (auth.uid() = user_id);
