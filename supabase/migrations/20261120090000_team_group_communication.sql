-- =====================================================================
-- INA-AFRICA — Nouvelle instance « Conseil de communication » (demande de
-- l'ONG, 20/11/2026) : HOUNDO Koffi Zacharie (information et porte-parole)
-- quitte le conseil de surveillance pour cette instance.
-- =====================================================================
alter table public.team_members drop constraint team_members_team_group_check;
alter table public.team_members add constraint team_members_team_group_check
  check (team_group in ('conseil_administration', 'conseil_surveillance', 'conseil_communication', 'adjoints', 'conseillers'));

update public.team_members
set team_group = 'conseil_communication'
where full_name = 'HOUNDO Koffi Zacharie' and team_group = 'conseil_surveillance';
