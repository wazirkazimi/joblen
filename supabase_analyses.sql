-- Add this to your Supabase SQL Editor to enable history saving

create table if not exists public.analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  job_description text,
  result jsonb not null,
  created_at timestamptz default now()
);

alter table public.analyses enable row level security;

create policy "Users can read own analyses"
  on public.analyses for select using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.analyses for insert with check (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on public.analyses for delete using (auth.uid() = user_id);
