-- =====================================================================
-- INA-AFRICA — Nouvel email de contact de l'ONG (demande du 07/11/2026) :
-- onginaafrica@gmail.com remplace inaafrica1@gmail.com. Ne change rien si
-- l'administration a déjà saisi une autre adresse.
-- =====================================================================

update public.site_settings
set contact_email = 'onginaafrica@gmail.com'
where id = 1
  and contact_email = 'inaafrica1@gmail.com';
