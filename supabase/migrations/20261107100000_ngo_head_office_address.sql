-- =====================================================================
-- INA-AFRICA — Adresse du siège transmise par l'ONG le 07/11/2026.
-- Ne remplace pas une adresse déjà saisie dans l'administration.
-- =====================================================================

update public.site_settings
set address = coalesce(address, E'Agla Petit-Château, Maison Zetomè, lot 272\nCotonou, Bénin')
where id = 1;
