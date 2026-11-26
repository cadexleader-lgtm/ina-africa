-- Pages du site : textes et photos modifiables par les admins seulement.
begin;

-- Visiteur : lecture seule.
set local role anon;
select tests.logout();
select tests.ok((select count(*) = 0 from public.page_sections), 'Aucune section modifiée au départ : le site affiche ses textes d''origine');
select tests.fails($$insert into public.page_sections (id, content) values ('a-propos.vision', '{}')$$,
  'Un visiteur ne peut pas modifier une page', '42501');
reset role;

set local role authenticated;

-- Éditeur : lecture seule (il écrit des articles, pas les pages).
select tests.login_as('00000000-0000-0000-0000-00000000000c', 'aal1');
select tests.fails($$insert into public.page_sections (id, content) values ('a-propos.vision', '{"title": "x"}')$$,
  'Un éditeur ne peut pas modifier une page', '42501');

-- Admin sans double authentification : aucun droit.
select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal1');
select tests.fails($$insert into public.page_sections (id, content) values ('a-propos.vision', '{"title": "x"}')$$,
  'Un admin sans double authentification ne peut pas modifier une page', '42501');

-- Admin : création, modification, retour au texte d'origine.
select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal2');
insert into public.page_sections (id, content) values ('a-propos.vision', '{"title": "Notre vision commune"}');
select tests.ok((select updated_by = '00000000-0000-0000-0000-00000000000b' from public.page_sections where id = 'a-propos.vision'),
  'L''auteur de la modification est enregistré');
update public.page_sections set content = '{"title": "Une vision"}' where id = 'a-propos.vision';
select tests.ok((select content ->> 'title' = 'Une vision' from public.page_sections where id = 'a-propos.vision'),
  'Un admin modifie une section');
select tests.fails($$insert into public.page_sections (id, content) values ('A propos', '{}')$$,
  'Un identifiant mal formé est refusé', '23514');
select tests.fails($$insert into public.page_sections (id, content) values ('a-propos.missions', '[]')$$,
  'Le contenu doit être un objet', '23514');
select tests.ok(tests.affected($$delete from public.page_sections where id = 'a-propos.vision'$$) = 1,
  'Un admin peut revenir au texte d''origine (suppression)');

reset role;
-- Création et suppression (une modification est notée quand updated_at change,
-- c'est-à-dire dans une autre transaction que la création).
select tests.ok((select count(*) = 2 from public.audit_logs where entity_type = 'page_sections' and entity_id = 'a-propos.vision'),
  'Création et suppression sont inscrites au journal d''audit');
rollback;
