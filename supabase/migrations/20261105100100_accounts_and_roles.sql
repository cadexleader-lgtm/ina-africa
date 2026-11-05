-- =====================================================================
-- INA-AFRICA — 2/9 Comptes de l'administration et rôles
-- Pas d'inscription publique : chaque compte est créé par un super_admin
-- (ou, pour le tout premier, à la main — voir docs/database.md).
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles : un par compte Supabase Auth, créé automatiquement
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  email public.email_address not null unique,
  phone text check (phone is null or char_length(phone) <= 30),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.profiles
  for each row execute function private.set_updated_at();

-- Création automatique du profil à la création du compte.
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      split_part(new.email, '@', 1)
    ),
    lower(new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

-- L'email du profil suit toujours celui du compte.
create or replace function private.sync_auth_user_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = lower(new.email) where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.sync_auth_user_email();

-- ---------------------------------------------------------------------
-- user_roles : au plus un rôle par personne. Sans rôle = aucun accès.
-- ---------------------------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.user_roles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Rôle effectif de l'utilisateur courant.
-- Un admin ou un super_admin dont la session n'a pas été validée par le
-- second facteur (aal2) n'a AUCUN droit : la double authentification est
-- exigée par la base, pas seulement par l'interface.
-- SECURITY DEFINER : lit user_roles sans repasser par ses règles RLS.
-- ---------------------------------------------------------------------
create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when ur.role = 'editor' then ur.role
    when coalesce(auth.jwt() ->> 'aal', '') = 'aal2' then ur.role
    else null
  end
  from public.user_roles ur
  where ur.user_id = auth.uid();
$$;

create or replace function private.has_role(min_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_app_role() >= min_role, false);
$$;

-- Trigger générique : renseigne la colonne passée en argument avec
-- l'utilisateur courant (uploaded_by, updated_by, created_by…).
-- Les valeurs fournies par un navigateur sont écrasées.
create or replace function private.set_actor()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not private.is_backend() then
    new := jsonb_populate_record(new, jsonb_build_object(tg_argv[0], auth.uid()));
  end if;
  return new;
end;
$$;

create trigger set_granted_by before insert or update on public.user_roles
  for each row execute function private.set_actor('granted_by');

-- Impossible de retirer ou de rétrograder le dernier super_admin
-- (y compris en supprimant son compte).
create or replace function private.protect_last_super_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'super_admin'
     and (tg_op = 'DELETE' or new.role <> 'super_admin') then
    -- Verrouille les super_admins pour éviter deux retraits simultanés.
    perform 1 from public.user_roles where role = 'super_admin' for update;
    if not exists (
      select 1 from public.user_roles
      where role = 'super_admin' and id <> old.id
    ) then
      raise exception 'Impossible de retirer le dernier super administrateur.'
        using errcode = 'P0001', hint = 'ina-africa';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger protect_last_super_admin before update or delete on public.user_roles
  for each row execute function private.protect_last_super_admin();

-- ---------------------------------------------------------------------
-- Droits et règles RLS
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
-- L'email n'est jamais modifiable ici : il suit le compte Auth.
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
grant all on public.profiles to service_role;

revoke all on public.user_roles from anon, authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

create policy "profiles : lecture de son profil ou par l'équipe"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.has_role('editor')));

create policy "profiles : chacun modifie son propre profil"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "user_roles : lecture de son rôle ou par un admin"
  on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select private.has_role('admin')));

create policy "user_roles : seul un super_admin attribue un rôle"
  on public.user_roles for insert to authenticated
  with check ((select private.has_role('super_admin')));

create policy "user_roles : seul un super_admin modifie un rôle"
  on public.user_roles for update to authenticated
  using ((select private.has_role('super_admin')))
  with check ((select private.has_role('super_admin')));

create policy "user_roles : seul un super_admin retire un rôle"
  on public.user_roles for delete to authenticated
  using ((select private.has_role('super_admin')));

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated, service_role;
