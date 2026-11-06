-- =====================================================================
-- INA-AFRICA — Informations transmises par l'ONG le 06/11/2026 :
-- instance « conseillers », nouveaux membres, coordonnées publiques, dons
-- directs (Mobile Money), partenaires et sponsors.
-- Ne remplace JAMAIS une valeur déjà saisie dans l'administration.
-- =====================================================================

alter table public.team_members drop constraint team_members_team_group_check;
alter table public.team_members add constraint team_members_team_group_check
  check (team_group in ('conseil_administration', 'conseil_surveillance', 'adjoints', 'conseillers'));

update public.team_members
set bio = 'Assure le secrétariat de l''Assemblée générale et du conseil d''administration (convocations, procès-verbaux, rapports). Gère le courrier, archive la mémoire de l''ONG et met en œuvre son plan de communication.'
where full_name = 'TOFFA Clotilde Kinvemi'
  and bio like 'Assure le secrétariat de l''Assemblée générale et du Conseil d''administration : conçoit%';

insert into public.team_members (full_name, position, bio, team_group, display_order, is_active)
select v.full_name, v.position, v.bio, v.team_group, v.display_order, true
from (values
  ('HOUNDO Koffi Zacharie', 'Information et porte-parole',
    'Pilote la stratégie d''information de l''ONG, conçoit les contenus d''impact et incarne officiellement sa voix auprès des médias, des institutions et du public.',
    'conseil_surveillance', 40),
  ('SENOU Fréjus', 'Chargé des affaires juvéniles adjoint',
    'Assiste le chargé des affaires juvéniles dans ses actions et missions.',
    'adjoints', 15),
  ('QUENUM Eric Brunnel', 'Conseiller technique et stratégique',
    'Apporte à l''ONG un appui technique et stratégique.',
    'conseillers', 10)
) as v(full_name, position, bio, team_group, display_order)
where not exists (select 1 from public.team_members t where t.full_name = v.full_name);

update public.site_settings
set
  contact_email = coalesce(contact_email, 'inaafrica1@gmail.com'),
  contact_phone = coalesce(contact_phone, '+229 01 94 34 04 55'),
  whatsapp_number = coalesce(whatsapp_number, '+2290194340455'),
  social_links = case when social_links = '{}'::jsonb then jsonb_build_object(
    'facebook', 'https://www.facebook.com/ong.ina.africa.2025',
    'tiktok', 'https://www.tiktok.com/@ina_africa'
  ) else social_links end,
  donation_min_amount = coalesce(donation_min_amount, 2000),
  donation_suggested_amounts = case when cardinality(donation_suggested_amounts) = 0
    then array[2000, 5000, 10000]::bigint[] else donation_suggested_amounts end,
  offline_donation_instructions = case when offline_donation_instructions = '[]'::jsonb then jsonb_build_array(
    jsonb_build_object('method', 'mobile_money', 'label', 'Moov Money', 'number', '01 94 84 04 55'),
    jsonb_build_object('method', 'mobile_money', 'label', 'MTN Mobile Money', 'number', '01 90 00 32 74')
  ) else offline_donation_instructions end
where id = 1;

insert into public.partners (name, kind, is_active, display_order)
select v.name, 'partner', true, v.display_order
from (values
  ('EREVAN', 10),
  ('DOS COMPANY', 20),
  ('RACINES SYNERGIE', 30),
  ('L''ENVOL DE L''AIGLE CORPORATE', 40),
  ('SIGNATURE DIVINE', 50),
  ('LE VRAI BONHEUR', 60),
  ('CHG INTER SARL', 70)
) as v(name, display_order)
where not exists (select 1 from public.partners p where p.name = v.name);
