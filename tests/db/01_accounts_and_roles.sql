-- Comptes, rôles, double authentification, journal d'audit.
-- Comptes de test (helpers.sql) :
--   …0a super_admin · …0b admin · …0c éditeur · …0d éditeur 2 · …0e sans rôle
begin;

select tests.ok(
  (select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') = 'Super Admin',
  'Le profil est créé automatiquement avec le nom du compte');
select tests.ok(
  (select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000e') = 'sansrole',
  'Sans nom fourni, le profil prend le début de l''email');
update auth.users set email = 'admin2@test.local' where id = '00000000-0000-0000-0000-00000000000b';
select tests.ok(
  (select email::text from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'admin2@test.local',
  'L''email du profil suit celui du compte');

-- Visiteur
set local role anon;
select tests.fails('select * from public.profiles', 'Un visiteur ne peut pas lire les profils', '42501');
select tests.fails('select * from public.user_roles', 'Un visiteur ne peut pas lire les rôles', '42501');
reset role;

set local role authenticated;

-- Compte sans rôle
select tests.login_as('00000000-0000-0000-0000-00000000000e');
select tests.ok((select count(*) from public.profiles) = 1,
  'Un compte sans rôle ne voit que son propre profil');
select tests.fails(
  $$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000e', 'super_admin')$$,
  'Un compte sans rôle ne peut pas se donner un rôle', '42501');

-- Éditeur (la double authentification n'est pas exigée pour lui)
select tests.login_as('00000000-0000-0000-0000-00000000000c', 'aal1');
select tests.ok((select count(*) from public.profiles) = 5, 'Un éditeur voit les profils de l''équipe');
select tests.ok((select count(*) from public.user_roles) = 1, 'Un éditeur ne voit que son propre rôle');
select tests.ok(
  tests.affected($$update public.profiles set full_name = 'Éditeur Renommé' where id = '00000000-0000-0000-0000-00000000000c'$$) = 1,
  'Chacun modifie son propre nom');
select tests.ok(
  tests.affected($$update public.profiles set full_name = 'Piraté' where id = '00000000-0000-0000-0000-00000000000b'$$) = 0,
  'Personne ne modifie le profil d''un autre');
select tests.fails(
  $$update public.profiles set email = 'x@y.z' where id = '00000000-0000-0000-0000-00000000000c'$$,
  'L''email ne se modifie pas depuis l''application', '42501');

-- Admin SANS double authentification : aucun droit
select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal1');
select tests.ok(not private.has_role('editor'), 'Un admin sans double authentification n''a aucun droit');
select tests.ok((select count(*) from public.user_roles) = 1,
  'Un admin sans double authentification ne voit que son propre rôle');
select tests.ok(tests.affected($$update public.site_settings set mission = 'Sans 2FA'$$) = 0,
  'Un admin sans double authentification ne peut rien modifier');

-- Admin AVEC double authentification
select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal2');
select tests.ok(private.has_role('admin'), 'Un admin avec double authentification a ses droits');
select tests.ok((select count(*) from public.user_roles) = 4, 'Un admin voit tous les rôles');
select tests.fails(
  $$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000e', 'editor')$$,
  'Un admin ne peut pas attribuer de rôle', '42501');
select tests.ok(
  tests.affected($$update public.user_roles set role = 'super_admin' where user_id = '00000000-0000-0000-0000-00000000000b'$$) = 0,
  'Un admin ne peut pas se promouvoir lui-même');

-- Super admin
select tests.login_as('00000000-0000-0000-0000-00000000000a', 'aal2');
select tests.ok(
  tests.affected($$insert into public.user_roles (user_id, role, granted_by) values ('00000000-0000-0000-0000-00000000000e', 'editor', '00000000-0000-0000-0000-00000000000c')$$) = 1,
  'Le super_admin attribue un rôle');
select tests.ok(
  (select granted_by from public.user_roles where user_id = '00000000-0000-0000-0000-00000000000e') = '00000000-0000-0000-0000-00000000000a',
  'Le rôle garde la trace de qui l''a vraiment attribué (valeur envoyée ignorée)');
select tests.fails(
  $$delete from public.user_roles where user_id = '00000000-0000-0000-0000-00000000000a'$$,
  'Le dernier super_admin ne peut pas être retiré', 'P0001');
select tests.fails(
  $$update public.user_roles set role = 'admin' where user_id = '00000000-0000-0000-0000-00000000000a'$$,
  'Le dernier super_admin ne peut pas être rétrogradé', 'P0001');
reset role;

select tests.fails(
  $$delete from auth.users where id = '00000000-0000-0000-0000-00000000000a'$$,
  'Le compte du dernier super_admin ne peut pas être supprimé', 'P0001');

update public.user_roles set role = 'super_admin' where user_id = '00000000-0000-0000-0000-00000000000b';
delete from public.user_roles where user_id = '00000000-0000-0000-0000-00000000000b';
select tests.ok(
  not exists (select 1 from public.user_roles where user_id = '00000000-0000-0000-0000-00000000000b'),
  'Avec deux super_admins, l''un des deux peut être retiré');

-- Journal d'audit
select tests.ok(
  (select count(*) from public.audit_logs
    where entity_type = 'user_roles' and action = 'insert'
      and details ->> 'role' = 'editor'
      and user_id = '00000000-0000-0000-0000-00000000000a') = 1,
  'L''attribution d''un rôle est tracée avec son auteur');

set local role authenticated;
select tests.login_as('00000000-0000-0000-0000-00000000000c', 'aal1');
select tests.ok((select count(*) from public.audit_logs) = 0, 'Un éditeur ne lit pas le journal d''audit');
select tests.login_as('00000000-0000-0000-0000-00000000000a', 'aal2');
select tests.ok((select count(*) from public.audit_logs) > 0, 'Le super_admin lit le journal d''audit');
select tests.fails('delete from public.audit_logs', 'Le journal d''audit ne peut pas être effacé', '42501');
reset role;

set local role service_role;
select tests.fails($$update public.audit_logs set action = 'delete'$$,
  'Même le serveur ne peut pas modifier le journal d''audit', '42501');
reset role;

rollback;
