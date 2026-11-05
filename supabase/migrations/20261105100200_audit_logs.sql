-- =====================================================================
-- INA-AFRICA — 3/9 Journal d'audit
-- Trace uniquement les actions importantes : publications, dons, rôles.
-- Rempli par des triggers (aucune action ne peut être oubliée), jamais
-- modifiable ni effaçable depuis l'application.
-- =====================================================================

create table public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null, -- vide = action système (ex. webhook)
  action text not null check (action in ('insert', 'update', 'delete')),
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_user_id_idx on public.audit_logs (user_id);

-- Trigger générique. Les arguments sont les colonnes surveillées : seules
-- leurs valeurs sont recopiées (jamais de données personnelles complètes).
-- Une mise à jour qui ne touche aucune colonne surveillée n'est pas tracée.
create or replace function private.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  new_row jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  changes jsonb := '{}'::jsonb;
  col text;
begin
  if tg_op = 'UPDATE' then
    foreach col in array tg_argv loop
      if (old_row -> col) is distinct from (new_row -> col) then
        changes := changes || jsonb_build_object(
          col, jsonb_build_object('old', old_row -> col, 'new', new_row -> col)
        );
      end if;
    end loop;
    if changes = '{}'::jsonb then
      return null;
    end if;
  else
    foreach col in array tg_argv loop
      changes := changes || jsonb_build_object(col, coalesce(new_row, old_row) -> col);
    end loop;
  end if;

  insert into public.audit_logs (user_id, action, entity_type, entity_id, details)
  values (
    (select p.id from public.profiles p where p.id = auth.uid()),
    lower(tg_op),
    tg_table_name,
    coalesce(new_row, old_row) ->> 'id',
    changes
  );
  return null;
end;
$$;

create trigger audit_user_roles
  after insert or update or delete on public.user_roles
  for each row execute function private.audit_trigger('user_id', 'role');

alter table public.audit_logs enable row level security;

-- Lecture seule pour tout le monde, y compris service_role.
revoke all on public.audit_logs from anon, authenticated, service_role;
grant select on public.audit_logs to authenticated, service_role;

create policy "audit_logs : lecture réservée au super_admin"
  on public.audit_logs for select to authenticated
  using ((select private.has_role('super_admin')));

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated, service_role;
