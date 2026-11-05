-- Champs ajoutés pour le site (plan frontend validé le 05/11/2026).
begin;

select tests.ok(
  (select array_agg(slug order by display_order) from public.action_areas) = array[
    'education', 'sante-sexuelle-et-reproductive', 'autonomisation-des-femmes',
    'jeunesse-et-adolescents', 'inclusion-et-egalite-de-genre',
    'developpement-local-durable', 'innovation-sociale'],
  'Les 7 domaines confirmés sont créés, dans l''ordre');
select tests.ok(
  (select bool_and(not is_active and description is null and summary is null) from public.action_areas),
  'Les domaines sont en brouillon et sans texte inventé');

-- Textes officiels de départ (statuts, articles 8 à 11)
select tests.ok((select vision like 'Œuvrer à l''inclusion%' from public.site_settings),
  'La vision reprend l''article 8 des statuts');
select tests.ok((select array_length(string_to_array(mission, E'\n'), 1) = 3 from public.site_settings),
  'Les 3 missions de l''article 9 sont présentes, une par ligne');
select tests.ok((select array_length(string_to_array(objectives, E'\n'), 1) = 5 from public.site_settings),
  'Les 5 objectifs de l''article 10 sont présents, un par ligne');
select tests.ok((select array_length(string_to_array(approach, E'\n'), 1) = 5 from public.site_settings),
  'Les 5 moyens d''action de l''article 11 sont présents');
select tests.ok((select values_text is null from public.site_settings),
  'Les valeurs restent vides tant que l''ONG ne les a pas validées');

set local role authenticated;
select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal2');

insert into public.projects (id, title, slug, action_area_id, is_published, is_featured)
values ('50000000-0000-0000-0000-000000000001', 'Formation couture', 'formation-couture',
        (select id from public.action_areas where slug = 'autonomisation-des-femmes'), true, true);
insert into public.gallery_items (item_type, image_path, image_alt, project_id, is_published)
values ('photo', 'projets/2026/11/atelier.webp', 'Atelier de couture', '50000000-0000-0000-0000-000000000001', true);
reset role;

set local role anon;
select tests.logout();
select tests.ok(
  (select a.slug from public.projects p join public.action_areas a on a.id = p.action_area_id
    where p.slug = 'formation-couture') is null,
  'Un visiteur ne voit pas le domaine d''un projet tant que le domaine est en brouillon');
select tests.ok(
  (select count(*) from public.gallery_items where project_id = '50000000-0000-0000-0000-000000000001') = 1,
  'Les photos publiées d''un projet sont visibles');
select tests.ok(
  (select is_featured from public.projects where slug = 'formation-couture'),
  'Le projet mis en avant est connu des visiteurs');
reset role;

set local role authenticated;
select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal2');
select tests.fails(
  $$update public.site_settings set hero_image_path = 'accueil/hero.webp'$$,
  'Une image d''accueil sans texte alternatif est refusée', '23514');
select tests.ok(
  tests.affected($$update public.site_settings set hero_title = 'Un avenir meilleur commence par l''action.', hero_image_path = 'accueil/hero.webp', hero_image_alt = 'Atelier de formation'$$) = 1,
  'L''admin modifie le texte et la photo de l''accueil');
select tests.fails(
  $$update public.site_settings set legal_notice = '"<p>HTML</p>"'$$,
  'Les mentions légales doivent être un document de l''éditeur (pas du HTML)', '23514');
select tests.fails(
  $$update public.action_areas set summary = repeat('x', 301) where slug = 'education'$$,
  'Le résumé d''un domaine est limité à 300 caractères', '23514');

delete from public.action_areas where slug = 'autonomisation-des-femmes';
select tests.ok(
  (select action_area_id is null from public.projects where slug = 'formation-couture'),
  'Supprimer un domaine ne supprime pas ses projets');
reset role;

rollback;
