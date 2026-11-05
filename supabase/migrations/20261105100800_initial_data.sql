-- =====================================================================
-- INA-AFRICA — 9/9 Données initiales strictement nécessaires
-- Aucun contenu inventé : pas d'article, de projet, de partenaire, de
-- chiffre ni d'utilisateur fictif.
-- =====================================================================

-- La ligne unique des paramètres du site (vide, à compléter par l'admin).
insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

-- Les domaines d'intervention cités par l'ONG, en brouillon (inactifs) et
-- SANS description : les textes seront rédigés par l'ONG.
insert into public.action_areas (title, slug, display_order) values
  ('Éducation', 'education', 1),
  ('Santé et droits sexuels et reproductifs', 'sante-droits-sexuels-reproductifs', 2),
  ('Autonomisation des femmes', 'autonomisation-des-femmes', 3),
  ('Inclusion sociale', 'inclusion-sociale', 4),
  ('Bien-être des enfants et des jeunes', 'bien-etre-enfants-jeunes', 5),
  ('Développement communautaire', 'developpement-communautaire', 6)
on conflict (slug) do nothing;
