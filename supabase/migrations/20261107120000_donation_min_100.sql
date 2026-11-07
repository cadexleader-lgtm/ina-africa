-- =====================================================================
-- INA-AFRICA — Don minimum ramené à 100 FCFA (demande de l'ONG, 07/11/2026) :
-- tout montant est accepté. Les montants suggérés (2 000, 5 000, 10 000) restent.
-- Ne change la valeur que si elle est encore celle fixée le 06/11/2026.
-- =====================================================================
update public.site_settings
set donation_min_amount = 100
where id = 1 and donation_min_amount = 2000;
