-- =====================================================================
-- INA-AFRICA — Corrections transmises par l'ONG (07/11/2026)
--  * numéro Moov Money : 01 94 34 04 55 (et non 01 94 84 04 55) ;
--  * pas d'élision devant « INA-AFRICA » : « de INA-AFRICA », « que INA-AFRICA ».
-- =====================================================================
update public.site_settings
set offline_donation_instructions = (
  select jsonb_agg(
    case when item->>'number' = '01 94 84 04 55'
         then jsonb_set(item, '{number}', '"01 94 34 04 55"')
         else item end
    order by ord)
  from jsonb_array_elements(offline_donation_instructions) with ordinality as t(item, ord)
)
where id = 1
  and offline_donation_instructions @> '[{"number": "01 94 84 04 55"}]'::jsonb;

update public.site_settings
set about_history = regexp_replace(regexp_replace(about_history, '\m([Dd])[''’]INA', '\1e INA', 'g'), '\m([Qq]u)[''’]INA', '\1e INA', 'g')
where id = 1 and about_history ~ '\m([Dd]|[Qq]u)[''’]INA';
