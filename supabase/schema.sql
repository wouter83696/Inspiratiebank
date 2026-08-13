create extension if not exists pgcrypto;

create table if not exists public.bcjn_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.bcjn_state (id, data)
values (
  'bcjn-zomer-2026',
  jsonb_build_object(
    'version', 1,
    'updatedAt', null,
    'colleagueIdeas', '[]'::jsonb,
    'hiddenColleagueIdeaIds', '[]'::jsonb,
    'hiddenInspirationTitles', '[]'::jsonb,
    'customLinks', '[]'::jsonb,
    'pendingLinks', '[]'::jsonb,
    'autoAgendaItems', '[]'::jsonb,
    'hiddenAgendaItemIds', '[]'::jsonb,
    'verifiedAgendaItemIds', '[]'::jsonb
  )
)
on conflict (id) do nothing;

alter table public.bcjn_state enable row level security;

drop policy if exists "BCJN public read state" on public.bcjn_state;
create policy "BCJN public read state"
on public.bcjn_state
for select
using (id = 'bcjn-zomer-2026');

drop policy if exists "BCJN public update state" on public.bcjn_state;
drop policy if exists "BCJN public insert state" on public.bcjn_state;

-- Houd publieke bezoekers op read-only. Schrijven naar deze gedeelde state
-- hoort via een serverfunctie of GitHub Action met SUPABASE_SERVICE_ROLE_KEY te lopen.
-- Zet de service role key nooit in website-bestanden/config.js.

create table if not exists public.bcjn_admin_settings (
  id text primary key,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.bcjn_admin_settings enable row level security;

insert into public.bcjn_admin_settings (id, password_hash)
values ('bcjn-zomer-2026', crypt('6545', gen_salt('bf')))
on conflict (id) do nothing;

revoke all on public.bcjn_admin_settings from anon, authenticated;

create or replace function public.bcjn_now_iso()
returns text
language sql
stable
as $$
  select to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
$$;

create or replace function public.bcjn_verify_admin_password(password text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  stored_hash text;
begin
  select password_hash
    into stored_hash
    from public.bcjn_admin_settings
   where id = 'bcjn-zomer-2026';

  return stored_hash is not null and stored_hash = crypt(coalesce(password, ''), stored_hash);
end;
$$;

create or replace function public.bcjn_append_state_item(state_id text, field_name text, item_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  allowed_fields constant text[] := array['colleagueIdeas', 'pendingLinks', 'reports'];
  next_data jsonb;
begin
  if not field_name = any(allowed_fields) then
    raise exception 'Veld mag niet publiek worden aangepast.';
  end if;

  if item_data is null or jsonb_typeof(item_data) <> 'object' then
    raise exception 'Inzending is ongeldig.';
  end if;

  if octet_length(item_data::text) > 2500000 then
    raise exception 'Inzending is te groot.';
  end if;

  update public.bcjn_state
     set data = jsonb_set(
       jsonb_set(data, '{updatedAt}', to_jsonb(public.bcjn_now_iso()), true),
       array[field_name],
       jsonb_build_array(item_data) || coalesce(data -> field_name, '[]'::jsonb),
       true
     ),
     updated_at = now()
   where id = state_id
   returning data into next_data;

  if next_data is null then
    raise exception 'Opslagrij bestaat niet.';
  end if;

  return next_data;
end;
$$;

create or replace function public.bcjn_save_state_admin(state_id text, password text, next_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  stored_hash text;
  saved_data jsonb;
begin
  select password_hash
    into stored_hash
    from public.bcjn_admin_settings
   where id = 'bcjn-zomer-2026';

  if stored_hash is null or stored_hash <> crypt(coalesce(password, ''), stored_hash) then
    raise exception 'Wachtwoord klopt niet.';
  end if;

  if next_data is null or jsonb_typeof(next_data) <> 'object' then
    raise exception 'Beheerdata is ongeldig.';
  end if;

  update public.bcjn_state
     set data = jsonb_set(next_data, '{updatedAt}', to_jsonb(public.bcjn_now_iso()), true),
         updated_at = now()
   where id = state_id
   returning data into saved_data;

  if saved_data is null then
    raise exception 'Opslagrij bestaat niet.';
  end if;

  return saved_data;
end;
$$;

grant execute on function public.bcjn_verify_admin_password(text) to anon, authenticated;
grant execute on function public.bcjn_append_state_item(text, text, jsonb) to anon, authenticated;
grant execute on function public.bcjn_save_state_admin(text, text, jsonb) to anon, authenticated;
