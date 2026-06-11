-- JobLens Admin Panel Database Setup
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Create app_config table
create table if not exists public.app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Seed initial values (Change admin123 to your desired default password)
insert into public.app_config (key, value)
values 
  ('admin_password', 'admin123'),
  ('MAX_FREE_ANALYSES_PER_MONTH', '20'),
  ('maintenance_mode', 'false')
on conflict (key) do nothing;

-- Enable Row Level Security on app_config
alter table public.app_config enable row level security;

-- Policy: Anyone can read settings EXCEPT the admin password
create policy "Allow public read of non-sensitive settings"
  on public.app_config for select
  using (key != 'admin_password');

-- 2. Create error_logs table
create table if not exists public.error_logs (
  id uuid default gen_random_uuid() primary key,
  error text not null,
  user_id uuid references auth.users(id) on delete set null,
  timestamp timestamptz default now()
);

-- Enable Row Level Security on error_logs
alter table public.error_logs enable row level security;

-- Policy: Anyone can insert logs
create policy "Allow public inserts of error logs"
  on public.error_logs for insert
  with check (true);

-- 3. Profile Email Synchronization Setup
-- Add email column to profiles if missing
alter table public.profiles add column if not exists email text;

-- Sync existing profiles
update public.profiles p
set email = u.email
from auth.users u
where p.user_id = u.id and p.email is null;

-- Trigger to sync email upon new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, profile_data)
  values (new.id, new.email, '{}'::jsonb)
  on conflict (user_id) do update
  set email = new.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 4. Admin RPC Functions (Bypass RLS securely via security definer)

-- A. Verify password
create or replace function public.admin_verify_password(admin_pass text)
returns boolean as $$
declare
  correct_pass text;
begin
  select value into correct_pass from public.app_config where key = 'admin_password';
  return (admin_pass = correct_pass);
end;
$$ language plpgsql security definer;

-- B. Get all users
create or replace function public.admin_get_users(admin_pass text)
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  profile_data jsonb,
  total_analyses bigint,
  last_active timestamptz
) as $$
declare
  correct_pass text;
begin
  select value into correct_pass from public.app_config where key = 'admin_password';
  if admin_pass != correct_pass then
    raise exception 'Unauthorized';
  end if;
  
  return query
  select 
    p.user_id,
    p.email,
    p.created_at,
    p.profile_data,
    count(a.id)::bigint as total_analyses,
    max(a.created_at) as last_active
  from public.profiles p
  left join public.analyses a on p.user_id = a.user_id
  group by p.user_id, p.email, p.created_at, p.profile_data;
end;
$$ language plpgsql security definer;

-- C. Get all analyses
create or replace function public.admin_get_analyses(admin_pass text)
returns table (
  id uuid,
  user_id uuid,
  email text,
  job_description text,
  result jsonb,
  feedback_decision text,
  feedback_reasons text[],
  created_at timestamptz
) as $$
declare
  correct_pass text;
begin
  select value into correct_pass from public.app_config where key = 'admin_password';
  if admin_pass != correct_pass then
    raise exception 'Unauthorized';
  end if;

  return query
  select 
    a.id,
    a.user_id,
    p.email,
    a.job_description,
    a.result,
    a.feedback_decision,
    a.feedback_reasons,
    a.created_at
  from public.analyses a
  left join public.profiles p on a.user_id = p.user_id
  order by a.created_at desc;
end;
$$ language plpgsql security definer;

-- D. Get db size
create or replace function public.admin_get_db_size(admin_pass text)
returns text as $$
declare
  correct_pass text;
  db_size text;
begin
  select value into correct_pass from public.app_config where key = 'admin_password';
  if admin_pass != correct_pass then
    raise exception 'Unauthorized';
  end if;

  select pg_size_pretty(pg_database_size(current_database())) into db_size;
  return db_size;
end;
$$ language plpgsql security definer;

-- E. Delete user
create or replace function public.admin_delete_user(admin_pass text, target_user_id uuid)
returns boolean as $$
declare
  correct_pass text;
begin
  select value into correct_pass from public.app_config where key = 'admin_password';
  if admin_pass != correct_pass then
    raise exception 'Unauthorized';
  end if;

  delete from auth.users where id = target_user_id;
  return true;
end;
$$ language plpgsql security definer;

-- F. Delete analysis
create or replace function public.admin_delete_analysis(admin_pass text, analysis_id uuid)
returns boolean as $$
declare
  correct_pass text;
begin
  select value into correct_pass from public.app_config where key = 'admin_password';
  if admin_pass != correct_pass then
    raise exception 'Unauthorized';
  end if;

  delete from public.analyses where id = analysis_id;
  return true;
end;
$$ language plpgsql security definer;

-- G. Get error logs
create or replace function public.admin_get_errors(admin_pass text)
returns table (
  id uuid,
  error text,
  user_id uuid,
  email text,
  log_timestamp timestamptz
) as $$
declare
  correct_pass text;
begin
  select value into correct_pass from public.app_config where key = 'admin_password';
  if admin_pass != correct_pass then
    raise exception 'Unauthorized';
  end if;

  return query
  select 
    e.id,
    e.error,
    e.user_id,
    p.email,
    e.timestamp as log_timestamp
  from public.error_logs e
  left join public.profiles p on e.user_id = p.user_id
  order by e.timestamp desc
  limit 50;
end;
$$ language plpgsql security definer;


-- H. Update configs
create or replace function public.admin_set_config(admin_pass text, config_key text, config_val text)
returns boolean as $$
declare
  correct_pass text;
begin
  select value into correct_pass from public.app_config where key = 'admin_password';
  if admin_pass != correct_pass then
    raise exception 'Unauthorized';
  end if;

  insert into public.app_config (key, value, updated_at)
  values (config_key, config_val, now())
  on conflict (key) do update
  set value = config_val, updated_at = now();
  
  return true;
end;
$$ language plpgsql security definer;
