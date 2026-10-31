-- Phase 1 integration metadata. Run in Supabase SQL Editor.
-- This stores status/metadata only, never provider access tokens or secrets.
create table if not exists public.user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected'
    check (status in ('connected', 'disconnected', 'error')),
  provider_account_id text,
  provider_username text,
  scopes text[] not null default '{}',
  connected_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.user_integrations enable row level security;

create policy "Users can read their own integrations"
on public.user_integrations for select
using (auth.uid() = user_id);

create policy "Users can insert their own integrations"
on public.user_integrations for insert
with check (auth.uid() = user_id);

create policy "Users can update their own integrations"
on public.user_integrations for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own integrations"
on public.user_integrations for delete
using (auth.uid() = user_id);
