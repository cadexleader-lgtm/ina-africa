-- Contenus : visibilité publique, circuit de publication des articles,
-- contrôles de format, droits de l'éditeur et de l'admin.
begin;

-- Visiteur
set local role anon;
select tests.ok((select count(*) from public.action_areas) = 0,
  'Les domaines initiaux sont en brouillon : invisibles des visiteurs');
select tests.ok((select count(*) from public.site_settings) = 1, 'Les visiteurs lisent les paramètres du site');
select tests.fails($$insert into public.articles (title, slug) values ('Test', 'test')$$,
  'Un visiteur ne peut pas écrire d''article', '42501');
select tests.fails($$update public.site_settings set mission = 'x'$$,
  'Un visiteur ne peut pas modifier les paramètres', '42501');
reset role;

set local role authenticated;

-- Éditeur
select tests.login_as('00000000-0000-0000-0000-00000000000c', 'aal1');
select tests.ok((select count(*) from public.action_areas) = 7, 'L''équipe voit les 7 domaines confirmés, en brouillon');

insert into public.articles (title, slug, content, author_id) values (
  'Premier article', 'premier-article',
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Bonjour"},{"type":"text","marks":[{"type":"bold"}],"text":"Cotonou"}]}]}',
  '00000000-0000-0000-0000-00000000000b');
select tests.ok(
  (select author_id from public.articles where slug = 'premier-article') = '00000000-0000-0000-0000-00000000000c',
  'L''auteur est toujours la personne connectée (valeur envoyée ignorée)');
select tests.ok(
  (select content_text from public.articles where slug = 'premier-article') = 'Bonjour Cotonou',
  'Le texte brut est extrait du contenu par la base');
select tests.fails($$insert into public.articles (title, slug, status) values ('Pub', 'pub-directe', 'published')$$,
  'Un éditeur ne peut pas créer un article déjà publié', '42501');

select tests.ok(
  tests.affected($$update public.articles set status = 'in_review' where slug = 'premier-article'$$) = 1,
  'L''éditeur soumet son article pour validation');
select tests.ok((select submitted_at is not null from public.articles where slug = 'premier-article'),
  'La date de soumission est enregistrée');
select tests.fails($$update public.articles set status = 'published' where slug = 'premier-article'$$,
  'Un éditeur ne peut pas publier', '42501');
select tests.fails($$update public.articles set author_id = '00000000-0000-0000-0000-00000000000d' where slug = 'premier-article'$$,
  'Un éditeur ne peut pas changer l''auteur', '42501');
select tests.fails($$insert into public.articles (title, slug) values ('Mauvaise adresse', 'Mauvaise Adresse!')$$,
  'Une adresse (slug) mal formée est refusée', '23514');
select tests.fails($$insert into public.articles (title, slug, content) values ('HTML', 'html-brut', '"<script>alert(1)</script>"')$$,
  'Un contenu qui n''est pas un document de l''éditeur (HTML brut) est refusé', '23514');
select tests.fails($$insert into public.articles (title, slug, cover_image_path) values ('Image externe', 'image-externe', 'https://exemple.com/photo.jpg')$$,
  'Une image externe (adresse web) est refusée : seulement la médiathèque', '23514');
select tests.fails($$insert into public.action_areas (title, slug) values ('Nouveau', 'nouveau')$$,
  'Un éditeur ne peut pas créer de domaine', '42501');
select tests.fails($$insert into public.donation_campaigns (title, slug) values ('Appel', 'appel')$$,
  'Un éditeur ne peut pas créer d''appel aux dons', '42501');
select tests.ok(tests.affected($$update public.site_settings set mission = 'Piratage'$$) = 0,
  'Un éditeur ne peut pas modifier les paramètres du site');

-- Admin : publication
select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal2');
select tests.ok(
  tests.affected($$update public.articles set status = 'published', review_note = 'Parfait' where slug = 'premier-article'$$) = 1,
  'L''admin publie l''article');
select tests.ok(
  (select published_at is not null
      and published_by = '00000000-0000-0000-0000-00000000000b'
      and review_note is null
     from public.articles where slug = 'premier-article'),
  'Date et auteur de publication posés automatiquement, remarque interne effacée');
select tests.fails(
  $$update public.articles set cover_image_path = 'articles/2026/11/photo.webp' where slug = 'premier-article'$$,
  'Publier une image sans texte alternatif est refusé', '23514');

-- Éditeur : ne touche pas à un article publié, ne supprime que ses brouillons
select tests.login_as('00000000-0000-0000-0000-00000000000c', 'aal1');
select tests.ok(
  tests.affected($$update public.articles set title = 'Modifié en douce' where slug = 'premier-article'$$) = 0,
  'Un éditeur ne peut pas modifier un article publié');
insert into public.articles (title, slug) values ('Brouillon de C', 'brouillon-c');
select tests.login_as('00000000-0000-0000-0000-00000000000d', 'aal1');
insert into public.articles (title, slug) values ('Brouillon de D', 'brouillon-d');
select tests.ok(tests.affected($$delete from public.articles where slug = 'brouillon-c'$$) = 0,
  'Un éditeur ne supprime pas le brouillon d''un autre');
select tests.ok(tests.affected($$delete from public.articles where slug = 'brouillon-d'$$) = 1,
  'Un éditeur supprime son propre brouillon');
select tests.ok(tests.affected($$delete from public.articles where slug = 'premier-article'$$) = 0,
  'Un éditeur ne supprime pas un article publié');
reset role;

set local role anon;
select tests.logout();
select tests.ok((select count(*) from public.articles) = 1, 'Les visiteurs ne voient que les articles publiés');
reset role;

-- Admin : projets, galerie, partenaires, paramètres
set local role authenticated;
select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal2');
insert into public.projects (title, slug, start_date, end_date) values ('Projet pilote', 'projet-pilote', '2026-01-10', '2026-06-30');
select tests.fails($$insert into public.projects (title, slug, start_date, end_date) values ('Dates', 'dates-inversees', '2026-06-30', '2026-01-10')$$,
  'Un projet qui finit avant de commencer est refusé', '23514');
update public.projects set is_published = true where slug = 'projet-pilote';
select tests.ok((select published_at is not null from public.projects where slug = 'projet-pilote'),
  'La date de publication d''un projet est posée automatiquement');
select tests.fails(
  $$insert into public.gallery_items (item_type, video_provider, video_url) values ('video', 'youtube', 'https://evil.example/watch?v=1')$$,
  'Une vidéo qui ne vient pas de YouTube ou Facebook est refusée', '23514');
insert into public.gallery_items (item_type, video_provider, video_url, is_published)
  values ('video', 'youtube', 'https://www.youtube.com/watch?v=abc123', true);
select tests.fails(
  $$insert into public.gallery_items (item_type, image_path, is_published) values ('photo', 'galerie/2026/11/photo.webp', true)$$,
  'Une photo publiée sans texte alternatif est refusée', '23514');
select tests.fails($$insert into public.partners (name, website_url) values ('Partenaire', 'javascript:alert(1)')$$,
  'Un lien de partenaire qui n''est pas une adresse web est refusé', '23514');
insert into public.partners (name, kind) values ('Sponsor en attente d''autorisation', 'sponsor');
select tests.ok(tests.affected($$update public.site_settings set mission = 'Mission de l''ONG'$$) = 1,
  'L''admin modifie les paramètres du site');
select tests.ok((select updated_by from public.site_settings) = '00000000-0000-0000-0000-00000000000b',
  'La dernière modification des paramètres est attribuée');
select tests.fails($$update public.site_settings set donation_suggested_amounts = '{5000,-1}'$$,
  'Un montant suggéré négatif est refusé', '23514');
reset role;

set local role anon;
select tests.ok((select count(*) from public.projects) = 1 and (select count(*) from public.gallery_items) = 1,
  'Les visiteurs voient le projet et la vidéo publiés');
select tests.ok((select count(*) from public.partners where name = 'Sponsor en attente d''autorisation') = 0,
  'Un partenaire non activé reste invisible des visiteurs');
reset role;

select tests.ok(
  (select count(*) from public.audit_logs
    where entity_type = 'articles'
      and details -> 'status' ->> 'new' = 'published'
      and user_id = '00000000-0000-0000-0000-00000000000b') = 1,
  'La publication d''un article est tracée avec son auteur');

rollback;
