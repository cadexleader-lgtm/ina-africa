-- Opérations de l'administration (Phase 3) : chaque requête ci-dessous a la
-- même forme que celle envoyée par src/server/actions/admin/* avec le client
-- de SESSION (les règles RLS s'appliquent).
--   …0a super_admin · …0b admin · …0c éditeur · …0d éditeur 2 · …0e sans rôle
begin;

set local role authenticated;

-- ---------------------------------------------------------------------
-- Articles : création avec retour de la ligne, circuit de relecture
-- ---------------------------------------------------------------------
select tests.login_as('00000000-0000-0000-0000-00000000000c', 'aal1');
select tests.ok(
  tests.affected($$insert into public.articles (title, slug, status, content) values ('Rentrée solidaire', 'rentree-solidaire', 'draft', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Kits scolaires"}]}]}') returning id, slug, status$$) = 1,
  'Un éditeur crée un brouillon et reçoit la ligne créée (insert … returning)');
select tests.ok(
  tests.affected($$update public.articles set excerpt = 'Résumé' where slug = 'rentree-solidaire' returning id, slug, status$$) = 1,
  'Un éditeur modifie son brouillon');
select tests.ok(
  tests.affected($$update public.articles set status = 'in_review' where slug = 'rentree-solidaire' and status = 'draft' returning id$$) = 1,
  'Soumission à relecture conditionnée au statut lu (deux personnes sur le même article)');
select tests.ok(
  tests.affected($$update public.articles set status = 'in_review' where slug = 'rentree-solidaire' and status = 'draft' returning id$$) = 0,
  'Une seconde soumission simultanée ne change rien');
select tests.ok(
  tests.affected($$update public.articles set title = 'Rentrée solidaire 2026' where slug = 'rentree-solidaire'$$) = 1,
  'Un éditeur peut encore corriger un article en relecture');

select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal2');
select tests.ok(
  tests.affected($$update public.articles set status = 'draft', review_note = 'Ajoutez la date de distribution.' where slug = 'rentree-solidaire' and status = 'in_review' returning id$$) = 1,
  'L''admin renvoie l''article à son auteur');
select tests.ok(
  (select status = 'draft' and review_note = 'Ajoutez la date de distribution.' from public.articles where slug = 'rentree-solidaire'),
  'La remarque de relecture est conservée sur le brouillon');

select tests.login_as('00000000-0000-0000-0000-00000000000c', 'aal1');
select tests.ok(
  tests.affected($$update public.articles set review_note = 'Effacée par l''éditeur' where slug = 'rentree-solidaire'$$) = 1,
  'La mise à jour d''un brouillon par l''éditeur passe…');
select tests.ok(
  (select review_note from public.articles where slug = 'rentree-solidaire') = 'Ajoutez la date de distribution.',
  '… mais la remarque de relecture n''est pas modifiable par l''éditeur');

select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal2');
update public.articles set status = 'published' where slug = 'rentree-solidaire' and status = 'draft';
select tests.ok((select status = 'published' and review_note is null from public.articles where slug = 'rentree-solidaire'),
  'Publication : la remarque interne est effacée');
select tests.ok(
  tests.affected($$update public.articles set status = 'draft', review_note = 'Retiré : photo à remplacer.' where slug = 'rentree-solidaire' and status = 'published' returning id$$) = 1,
  'Dépublication par l''admin avec une remarque');
select tests.ok(
  (select status = 'draft' and review_note = 'Retiré : photo à remplacer.' from public.articles where slug = 'rentree-solidaire'),
  'La remarque de dépublication est conservée');
select tests.ok(
  tests.affected($$update public.articles set status = 'archived' where slug = 'rentree-solidaire' and status = 'draft' returning id$$) = 1,
  'L''admin archive un article');

-- ---------------------------------------------------------------------
-- Ordre d'affichage, paramètres
-- ---------------------------------------------------------------------
select tests.ok(
  tests.affected($$update public.action_areas set display_order = 1 where slug = 'innovation-sociale' returning id$$) = 1,
  'L''admin réordonne les domaines');
select tests.fails(
  $$update public.site_settings set hero_image_path = 'site/2026/11/accueil.webp', hero_image_alt = null where id = 1$$,
  'Une image d''accueil sans texte alternatif est refusée', '23514');
select tests.ok(
  tests.affected($$update public.site_settings set hero_title = 'Agir ensemble', social_links = '{"facebook":"https://facebook.com/inaafrica"}' where id = 1 returning updated_at$$) = 1,
  'L''admin met à jour une partie des paramètres');

select tests.login_as('00000000-0000-0000-0000-00000000000c', 'aal1');
select tests.ok(
  tests.affected($$update public.action_areas set display_order = 99 where slug = 'education' returning id$$) = 0,
  'Un éditeur ne réordonne pas les domaines');

-- ---------------------------------------------------------------------
-- Boîte de réception et newsletter : suppression avec retour de la ligne
-- ---------------------------------------------------------------------
reset role;
insert into public.contact_requests (request_type, full_name, email, consent_at)
  values ('contact', 'Awa Dossou', 'awa@exemple.bj', now());
insert into public.newsletter_subscribers (email, status, consent_at, confirmed_at, unsubscribe_token_hash)
  values ('lectrice@exemple.bj', 'subscribed', now(), now(), 'empreinte-1'),
         ('attente@exemple.bj', 'pending', now(), null, 'empreinte-2');
set local role authenticated;

select tests.login_as('00000000-0000-0000-0000-00000000000c', 'aal1');
select tests.ok(tests.affected($$delete from public.contact_requests returning id$$) = 0,
  'Un éditeur ne supprime pas de demande');

select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal2');
select tests.ok(
  (select count(*) from public.newsletter_subscribers where status = 'subscribed') = 1,
  'L''export de la newsletter ne lit que les abonnés confirmés');
select tests.ok(
  tests.affected($$update public.contact_requests set status = 'read' where email = 'awa@exemple.bj' returning id, status, handled_at$$) = 1,
  'L''admin change le statut d''une demande');
select tests.ok(tests.affected($$delete from public.contact_requests where email = 'awa@exemple.bj' returning id$$) = 1,
  'L''admin supprime une demande (droit à l''effacement)');
select tests.ok(tests.affected($$delete from public.newsletter_subscribers where email = 'attente@exemple.bj' returning id$$) = 1,
  'L''admin supprime un inscrit');

-- Sans double authentification, un admin n'a aucun droit.
select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal1');
select tests.ok(tests.affected($$delete from public.newsletter_subscribers returning id$$) = 0,
  'Admin sans double authentification : aucune suppression');

-- ---------------------------------------------------------------------
-- Rôles : changement par « upsert » (requête envoyée par changeMemberRole)
-- ---------------------------------------------------------------------
select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal2');
select tests.fails(
  $$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000c', 'admin') on conflict (user_id) do update set role = excluded.role$$,
  'Un admin ne change pas les rôles', '42501');

select tests.login_as('00000000-0000-0000-0000-00000000000a', 'aal2');
select tests.ok(
  tests.affected($$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000c', 'admin') on conflict (user_id) do update set role = excluded.role returning user_id, role$$) = 1,
  'Le super_admin change un rôle existant (« upsert »)');
select tests.ok((select role from public.user_roles where user_id = '00000000-0000-0000-0000-00000000000c') = 'admin',
  'Le nouveau rôle est enregistré');
select tests.ok(
  tests.affected($$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000e', 'editor') on conflict (user_id) do update set role = excluded.role returning user_id, role$$) = 1,
  'Le super_admin donne un rôle à un compte qui n''en avait pas');
select tests.ok(
  (select granted_by from public.user_roles where user_id = '00000000-0000-0000-0000-00000000000e') = '00000000-0000-0000-0000-00000000000a',
  'La personne qui a attribué le rôle est enregistrée');
select tests.ok(
  tests.error_hint($$insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000a', 'admin') on conflict (user_id) do update set role = excluded.role$$) = 'ina-africa',
  'Rétrograder le dernier super_admin par « upsert » est refusé avec un message pour l''utilisateur');
select tests.ok(
  tests.affected($$delete from public.user_roles where user_id = '00000000-0000-0000-0000-00000000000e' returning user_id$$) = 1,
  'Le super_admin retire l''accès d''un membre');

-- ---------------------------------------------------------------------
-- Médiathèque : fiche créée avec retour, vérification des usages
-- ---------------------------------------------------------------------
select tests.login_as('00000000-0000-0000-0000-00000000000d', 'aal1');
select tests.ok(
  tests.affected($$insert into public.media (bucket, storage_path, file_name, file_type, file_size, alt_text) values ('public-media', 'galerie/2026/11/0123456789abcdef0123456789abcdef.webp', 'IMG_1.webp', 'image/webp', 120000, 'Atelier couture') returning id, file_name$$) = 1,
  'Un éditeur crée la fiche d''un fichier envoyé');
select tests.ok(
  (select count(*) from public.projects where cover_image_path = 'galerie/2026/11/0123456789abcdef0123456789abcdef.webp') = 0,
  'L''équipe peut vérifier si une image est utilisée avant sa suppression');

reset role;
rollback;
