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

create table if not exists public.bcjn_rate_limits (
  bucket text not null,
  client_hash text not null,
  window_start timestamptz not null default now(),
  attempt_count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (bucket, client_hash)
);

alter table public.bcjn_rate_limits enable row level security;

revoke all on public.bcjn_rate_limits from anon, authenticated;

create or replace function public.bcjn_now_iso()
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
$$;

create or replace function public.bcjn_check_rate_limit(
  bucket text,
  client_id text,
  max_attempts integer,
  window_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  safe_client_id text := left(coalesce(nullif(client_id, ''), 'anonymous'), 200);
  safe_window interval := make_interval(secs => greatest(1, least(window_seconds, 86400)));
  hash text;
  current_record public.bcjn_rate_limits%rowtype;
begin
  if bucket is null or bucket = '' then
    raise exception 'Rate-limit bucket ontbreekt.';
  end if;

  if max_attempts < 1 then
    raise exception 'Rate-limit configuratie is ongeldig.';
  end if;

  hash := encode(digest(bucket || ':' || safe_client_id, 'sha256'), 'hex');

  select *
    into current_record
    from public.bcjn_rate_limits
   where bcjn_rate_limits.bucket = bcjn_check_rate_limit.bucket
     and bcjn_rate_limits.client_hash = hash
   for update;

  if not found or current_record.window_start < now() - safe_window then
    insert into public.bcjn_rate_limits(bucket, client_hash, window_start, attempt_count, updated_at)
    values (bucket, hash, now(), 1, now())
    on conflict (bucket, client_hash)
    do update set window_start = excluded.window_start,
                  attempt_count = excluded.attempt_count,
                  updated_at = excluded.updated_at;
    return;
  end if;

  if current_record.attempt_count >= max_attempts then
    raise exception 'Te veel pogingen. Probeer het later opnieuw.';
  end if;

  update public.bcjn_rate_limits
     set attempt_count = attempt_count + 1,
         updated_at = now()
   where bcjn_rate_limits.bucket = bcjn_check_rate_limit.bucket
     and bcjn_rate_limits.client_hash = hash;
end;
$$;

drop function if exists public.bcjn_verify_admin_password(text);

create or replace function public.bcjn_verify_admin_password(password text, client_id text default null)
returns boolean
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  stored_hash text;
  password_ok boolean;
  safe_client_id text := left(coalesce(nullif(client_id, ''), 'anonymous'), 200);
begin
  select password_hash
    into stored_hash
    from public.bcjn_admin_settings
   where id = 'bcjn-zomer-2026';

  password_ok := stored_hash is not null and stored_hash = crypt(coalesce(password, ''), stored_hash);

  if password_ok then
    delete from public.bcjn_rate_limits
     where bucket = 'admin-login'
       and client_hash = encode(digest('admin-login:' || safe_client_id, 'sha256'), 'hex');
    return true;
  end if;

  perform public.bcjn_check_rate_limit('admin-login', client_id, 10, 900);
  return false;
end;
$$;

drop function if exists public.bcjn_append_state_item(text, text, jsonb);

create or replace function public.bcjn_append_state_item(state_id text, field_name text, item_data jsonb, client_id text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  allowed_fields constant text[] := array['colleagueIdeas', 'pendingLinks', 'reports'];
  next_data jsonb;
begin
  perform public.bcjn_check_rate_limit('public-' || coalesce(field_name, 'unknown'), client_id, 8, 900);

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
set search_path = public, extensions, pg_temp
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

grant execute on function public.bcjn_verify_admin_password(text, text) to anon, authenticated;
grant execute on function public.bcjn_append_state_item(text, text, jsonb, text) to anon, authenticated;
grant execute on function public.bcjn_save_state_admin(text, text, jsonb) to anon, authenticated;
revoke execute on function public.bcjn_check_rate_limit(text, text, integer, integer) from public;
revoke execute on function public.bcjn_check_rate_limit(text, text, integer, integer) from anon, authenticated;
