create extension if not exists "pgcrypto";

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  occurred_at timestamptz not null default now(),
  duration_minutes integer check (duration_minutes >= 0),
  status text not null default 'draft' check (status in ('draft', 'completed')),
  processing_status text not null default 'draft' check (processing_status in ('draft', 'uploaded', 'transcribing', 'organizing', 'completed', 'failed')),
  processing_error text,
  audio_path text,
  audio_mime_type text,
  audio_size_bytes bigint check (audio_size_bytes >= 0),
  notes text,
  transcript text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  name text not null,
  email text
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.action_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  content text not null,
  assignee text,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.meetings enable row level security;
alter table public.participants enable row level security;
alter table public.decisions enable row level security;
alter table public.action_items enable row level security;
create policy "owners manage meetings" on public.meetings for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owners manage participants" on public.participants for all using (exists (select 1 from public.meetings m where m.id = meeting_id and m.owner_id = auth.uid())) with check (exists (select 1 from public.meetings m where m.id = meeting_id and m.owner_id = auth.uid()));
create policy "owners manage decisions" on public.decisions for all using (exists (select 1 from public.meetings m where m.id = meeting_id and m.owner_id = auth.uid())) with check (exists (select 1 from public.meetings m where m.id = meeting_id and m.owner_id = auth.uid()));
create policy "owners manage action items" on public.action_items for all using (exists (select 1 from public.meetings m where m.id = meeting_id and m.owner_id = auth.uid())) with check (exists (select 1 from public.meetings m where m.id = meeting_id and m.owner_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meeting-audios',
  'meeting-audios',
  false,
  209715200,
  array['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/ogg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "users read own meeting audio" on storage.objects
for select to authenticated
using (bucket_id = 'meeting-audios' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users upload own meeting audio" on storage.objects
for insert to authenticated
with check (bucket_id = 'meeting-audios' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update own meeting audio" on storage.objects
for update to authenticated
using (bucket_id = 'meeting-audios' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'meeting-audios' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete own meeting audio" on storage.objects
for delete to authenticated
using (bucket_id = 'meeting-audios' and (storage.foldername(name))[1] = auth.uid()::text);
create index if not exists meetings_owner_date_idx on public.meetings(owner_id, occurred_at desc);
create index if not exists participants_meeting_idx on public.participants(meeting_id);
create index if not exists decisions_meeting_idx on public.decisions(meeting_id);
create index if not exists action_items_meeting_idx on public.action_items(meeting_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger meetings_set_updated_at
before update on public.meetings
for each row execute function public.set_updated_at();
