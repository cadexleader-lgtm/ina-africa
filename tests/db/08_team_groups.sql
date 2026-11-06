-- Équipe : instances de l'ONG et composition de départ.
begin;

select tests.ok((select count(*) = 14 from public.team_members where is_active), '14 membres de l''équipe sont publiés');
select tests.ok((select count(*) = 3 from public.team_members where team_group = 'conseil_surveillance'), '3 membres au conseil de surveillance');
select tests.ok((select count(*) = 2 from public.team_members where team_group = 'adjoints'), '2 adjoints aux membres de l''administration');
select tests.fails($$ update public.team_members set team_group = 'bureau' where full_name = 'BESSAN Guy' $$,
  'Une instance inconnue est refusée', '23514');

set local role anon;
select tests.logout();
select tests.ok((select count(*) = 14 from public.team_members), 'Les visiteurs voient les 14 membres publiés');
reset role;

rollback;
