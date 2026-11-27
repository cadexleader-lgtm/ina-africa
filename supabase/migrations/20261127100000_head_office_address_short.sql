-- =====================================================================
-- INA-AFRICA : adresse du siège simplifiée (demande de l'ONG, 27/11/2026) :
-- « Agla Petit-Château, Cotonou, Bénin » uniquement.
-- =====================================================================
update public.site_settings
set address = E'Agla Petit-Château\nCotonou, Bénin'
where id = 1 and address like 'Agla Petit-Ch%teau, Maison Zetom%';
