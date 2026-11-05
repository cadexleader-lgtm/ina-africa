-- =====================================================================
-- INA-AFRICA — 10 Champs nécessaires au site (plan frontend validé le
-- 05/11/2026). Tout reste modifiable par l'ONG depuis l'administration.
-- =====================================================================

-- Domaines : courte description pour les cartes.
alter table public.action_areas
  add column summary text check (summary is null or char_length(summary) <= 300);

-- Projets : domaine du projet (filtre, cartes, « actions associées » d'un
-- domaine) et projet mis en avant sur l'accueil.
alter table public.projects
  add column action_area_id uuid references public.action_areas (id) on delete set null,
  add column is_featured boolean not null default false;

create index projects_action_area_id_idx on public.projects (action_area_id);
create index projects_featured_idx on public.projects (is_featured, published_at desc) where is_published;

-- Galerie : photos d'un projet (réutilise la galerie, pas de nouvelle table).
alter table public.gallery_items
  add column project_id uuid references public.projects (id) on delete set null;

create index gallery_items_project_id_idx on public.gallery_items (project_id);

-- Paramètres : textes de l'accueil et de la page À propos, pages légales.
alter table public.site_settings
  add column values_text text check (values_text is null or char_length(values_text) <= 5000),
  add column approach text check (approach is null or char_length(approach) <= 5000),
  add column hero_kicker text check (hero_kicker is null or char_length(hero_kicker) <= 80),
  add column hero_title text check (hero_title is null or char_length(hero_title) <= 120),
  add column hero_text text check (hero_text is null or char_length(hero_text) <= 400),
  add column hero_image_path text check (hero_image_path is null or private.is_valid_storage_path(hero_image_path)),
  add column hero_image_alt text check (hero_image_alt is null or char_length(hero_image_alt) <= 300),
  add column impact_title text check (impact_title is null or char_length(impact_title) <= 120),
  add column impact_text text check (impact_text is null or char_length(impact_text) <= 1500),
  add column impact_image_path text check (impact_image_path is null or private.is_valid_storage_path(impact_image_path)),
  add column impact_image_alt text check (impact_image_alt is null or char_length(impact_image_alt) <= 300),
  add column legal_notice jsonb check (legal_notice is null or private.is_rich_doc(legal_notice)),
  add column privacy_policy jsonb check (privacy_policy is null or private.is_rich_doc(privacy_policy)),
  -- Les paramètres sont publics : une image n'y entre qu'avec son texte alternatif.
  add constraint site_settings_hero_image_has_alt
    check (hero_image_path is null or hero_image_alt is not null),
  add constraint site_settings_impact_image_has_alt
    check (impact_image_path is null or impact_image_alt is not null);
