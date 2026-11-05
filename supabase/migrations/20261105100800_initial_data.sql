-- =====================================================================
-- INA-AFRICA — 9/9 Données initiales strictement nécessaires
-- Aucun contenu inventé : pas d'article, de projet, de partenaire, de
-- chiffre ni d'utilisateur fictif.
-- =====================================================================

-- La ligne unique des paramètres du site (vide, à compléter par l'admin).
insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

-- Les 7 domaines d'intervention confirmés par l'organisation (cahier des
-- charges frontend du 05/11/2026), en brouillon (inactifs) et SANS
-- description : les textes seront rédigés par l'ONG.
insert into public.action_areas (title, slug, display_order) values
  ('Éducation', 'education', 1),
  ('Santé et droits en santé sexuelle et reproductive', 'sante-sexuelle-et-reproductive', 2),
  ('Autonomisation des femmes', 'autonomisation-des-femmes', 3),
  ('Jeunesse et adolescents', 'jeunesse-et-adolescents', 4),
  ('Inclusion et égalité de genre', 'inclusion-et-egalite-de-genre', 5),
  ('Développement local durable et inclusif', 'developpement-local-durable', 6),
  ('Innovation sociale', 'innovation-sociale', 7)
on conflict (slug) do nothing;
