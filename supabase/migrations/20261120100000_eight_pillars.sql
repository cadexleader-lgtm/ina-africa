-- =====================================================================
-- INA-AFRICA — Les huit piliers stratégiques (transmis par l'ONG le
-- 20/11/2026) : nouveaux intitulés pour l'éducation et la santé, nouveau
-- domaine « Environnement et résilience climatique » (6e position).
-- Les textes de présentation restent dans le contenu officiel du site
-- (src/content/fr/ina-africa.ts) tant que l'administration ne les remplace pas.
-- =====================================================================
update public.action_areas set title = 'Éducation et soutien scolaire'
where slug = 'education' and title = 'Éducation';

update public.action_areas set title = 'Santé et droits sexuels et reproductifs (DSSR)'
where slug = 'sante-sexuelle-et-reproductive' and title = 'Santé et droits en santé sexuelle et reproductive';

-- Publié seulement si les autres domaines le sont déjà (rien n'est public par défaut).
insert into public.action_areas (title, slug, is_active, display_order)
select 'Environnement et résilience climatique', 'environnement-et-resilience-climatique',
       coalesce((select bool_and(is_active) from public.action_areas), false), 6
where not exists (select 1 from public.action_areas where slug = 'environnement-et-resilience-climatique');

update public.action_areas set display_order = 7 where slug = 'developpement-local-durable';
update public.action_areas set display_order = 8 where slug = 'innovation-sociale';
