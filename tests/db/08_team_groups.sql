-- Équipe, coordonnées, dons directs et partenaires transmis par l'ONG.
begin;

select tests.ok((select count(*) = 17 from public.team_members where is_active), '17 membres de l''équipe sont publiés');
select tests.ok((select count(*) = 4 from public.team_members where team_group = 'conseil_surveillance'), '4 membres au conseil de surveillance');
select tests.ok((select count(*) = 3 from public.team_members where team_group = 'adjoints'), '3 adjoints aux membres de l''administration');
select tests.ok((select count(*) = 1 from public.team_members where team_group = 'conseillers'), '1 conseiller');
select tests.fails($$ update public.team_members set team_group = 'bureau' where full_name = 'BESSAN Guy' $$,
  'Une instance inconnue est refusée', '23514');
select tests.ok((select bio like '%(convocations, procès-verbaux, rapports)%' from public.team_members where full_name = 'TOFFA Clotilde Kinvemi'),
  'La fonction de la secrétaire générale est mise à jour');
select tests.ok((select contact_email = 'onginaafrica@gmail.com' and whatsapp_number = '+2290194340455'
  and donation_min_amount = 100 and donation_suggested_amounts = array[2000, 5000, 10000]::bigint[]
  and jsonb_array_length(offline_donation_instructions) = 2 and social_links ? 'tiktok'
  from public.site_settings where id = 1), 'Coordonnées et dons directs renseignés');
select tests.ok((select count(*) = 7 from public.partners where is_active), '7 partenaires et sponsors publiés');

set local role anon;
select tests.logout();
select tests.ok((select count(*) = 17 from public.team_members), 'Les visiteurs voient les 17 membres publiés');
select tests.ok((select count(*) = 7 from public.partners), 'Les visiteurs voient les 7 partenaires');
reset role;

rollback;
