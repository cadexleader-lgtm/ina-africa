-- =====================================================================
-- INA-AFRICA : jusqu'à 3 images par domaine d'intervention (demande du
-- 28/11/2026) : l'image principale (image_path) + 2 images en plus.
-- Liste de { "path", "alt" } (chemins de la médiathèque public-media).
-- =====================================================================
alter table public.action_areas
  add column extra_images jsonb not null default '[]'::jsonb
    check (jsonb_typeof(extra_images) = 'array' and jsonb_array_length(extra_images) <= 2);
