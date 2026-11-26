-- =====================================================================
-- INA-AFRICA : les domaines d'action deviennent les 7 domaines
-- d'intervention transmis par l'ONG (27/11/2026), au lieu des 8 piliers.
-- Les anciennes fiches sont masquées (pas supprimées : les projets qui y
-- sont rattachés gardent leur lien). Résumés : proposition à valider par
-- l'ONG (modifiables dans Pages du site → Domaines → Modifier).
-- =====================================================================
update public.action_areas set is_active = false;

insert into public.action_areas (title, slug, summary, is_active, display_order) values
  ('Formation', 'formation',
   'Des formations pratiques pour les femmes, les jeunes et les personnes en situation de handicap : métiers, entrepreneuriat, gestion et savoir-faire utiles au quotidien.', true, 1),
  ('Action d''intermédiation', 'intermediation',
   'INA-AFRICA fait le lien entre les communautés, les institutions et les partenaires pour faciliter l''accès aux services, aux opportunités et aux ressources.', true, 2),
  ('Appui à l''autonomisation économique des femmes', 'autonomisation-economique-des-femmes',
   'Accompagner les femmes, les veuves et les filles-mères vers l''indépendance financière : activités génératrices de revenus, transformation de produits locaux, entrepreneuriat social.', true, 3),
  ('Apprentissage et insertion socio-professionnelle des femmes, des jeunes et des personnes en situation de handicap', 'insertion-socio-professionnelle',
   'Accompagner les femmes, les jeunes et les personnes en situation de handicap vers un métier, un emploi décent ou la création de leur propre activité.', true, 4),
  ('Lutte contre le travail des enfants dans les mines et carrières, les BTP et les activités marchandes', 'lutte-contre-le-travail-des-enfants',
   'Protéger les enfants contre le travail dans les mines et carrières, les BTP et les activités marchandes, et les accompagner vers l''école.', true, 5),
  ('Sauvegarde de l''environnement', 'sauvegarde-de-l-environnement',
   'Sensibiliser et agir avec les communautés pour protéger l''environnement et préserver les ressources naturelles.', true, 6),
  ('Lutte contre le réchauffement climatique', 'lutte-contre-le-rechauffement-climatique',
   'Mobiliser les communautés face au réchauffement climatique par la sensibilisation et des pratiques plus durables.', true, 7)
on conflict (slug) do update
  set title = excluded.title, summary = excluded.summary, is_active = true, display_order = excluded.display_order;

-- Textes de la section de l'accueil qui parlaient encore de « huit piliers » : retour au texte d'origine.
delete from public.page_sections where id in ('accueil.piliers', 'projets.piliers');
