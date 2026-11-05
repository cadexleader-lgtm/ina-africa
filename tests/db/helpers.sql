-- =====================================================================
-- Outils de test : se connecter « en tant que », assertions.
-- =====================================================================
create schema tests;
grant usage on schema tests to public;

-- Simule la session d'un utilisateur Supabase (jeton JWT).
-- aal = 'aal2' quand la double authentification a été validée.
create function tests.login_as(p_user uuid, p_aal text default 'aal2')
returns void
language sql
as $$
  select set_config(
    'request.jwt.claims',
    json_build_object('sub', p_user, 'role', 'authenticated', 'aal', p_aal)::text,
    true
  );
$$;

create function tests.logout()
returns void
language sql
as $$
  select set_config('request.jwt.claims', '', true);
$$;

create function tests.ok(condition boolean, description text)
returns void
language plpgsql
as $$
begin
  if condition is not true then
    raise exception 'ÉCHEC : %', description;
  end if;
  raise notice 'OK    %', description;
end;
$$;

-- Vérifie qu'une instruction échoue (éventuellement avec un code précis).
create function tests.fails(statement text, description text, expected_sqlstate text default null)
returns void
language plpgsql
as $$
begin
  begin
    execute statement;
  exception when others then
    if expected_sqlstate is not null and sqlstate <> expected_sqlstate then
      raise exception 'ÉCHEC : % (erreur % au lieu de % : %)', description, sqlstate, expected_sqlstate, sqlerrm;
    end if;
    raise notice 'OK    % [% %]', description, sqlstate, sqlerrm;
    return;
  end;
  raise exception 'ÉCHEC : % (aucune erreur levée)', description;
end;
$$;

-- Indice (HINT) de l'erreur levée par une instruction, ou null.
create function tests.error_hint(statement text)
returns text
language plpgsql
as $$
declare
  hint text;
begin
  execute statement;
  return null;
exception when others then
  get stacked diagnostics hint = pg_exception_hint;
  return hint;
end;
$$;

-- Nombre de lignes touchées par une instruction (0 = bloquée par RLS).
create function tests.affected(statement text)
returns bigint
language plpgsql
as $$
declare
  n bigint;
begin
  execute statement;
  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on all functions in schema tests to public;

-- Comptes de test communs à tous les fichiers (créés par la « plateforme »).
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'super@test.local', '{"full_name": "Super Admin"}'),
  ('00000000-0000-0000-0000-00000000000b', 'admin@test.local', '{"full_name": "Admin"}'),
  ('00000000-0000-0000-0000-00000000000c', 'editeur@test.local', '{"full_name": "Éditeur"}'),
  ('00000000-0000-0000-0000-00000000000d', 'editeur2@test.local', '{"full_name": "Éditeur 2"}'),
  ('00000000-0000-0000-0000-00000000000e', 'sansrole@test.local', '{}');

insert into public.user_roles (user_id, role) values
  ('00000000-0000-0000-0000-00000000000a', 'super_admin'),
  ('00000000-0000-0000-0000-00000000000b', 'admin'),
  ('00000000-0000-0000-0000-00000000000c', 'editor'),
  ('00000000-0000-0000-0000-00000000000d', 'editor');
