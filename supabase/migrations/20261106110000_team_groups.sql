-- =====================================================================
-- INA-AFRICA — Équipe : instances de l'ONG + composition fournie par l'ONG
-- (06/11/2026). Les fonctions sont celles transmises par l'ONG ; seules
-- les fautes de frappe évidentes ont été corrigées.
-- =====================================================================

alter table public.team_members
  add column team_group text not null default 'conseil_administration'
    check (team_group in ('conseil_administration', 'conseil_surveillance', 'adjoints'));

drop index if exists public.team_members_active_order_idx;
create index team_members_active_order_idx on public.team_members (is_active, team_group, display_order);

-- Composition (ajoutée une seule fois : rien n'est inséré si la personne existe déjà).
insert into public.team_members (full_name, position, bio, team_group, display_order, is_active)
select v.full_name, v.position, v.bio, v.team_group, v.display_order, true
from (values
  ('DJOSSOU Wilfried', 'Président',
    'Premier responsable de l''ONG. Préside l''Assemblée générale et le Conseil d''administration, dirige l''ONG et répond devant toutes les institutions de l''État.',
    'conseil_administration', 10),
  ('DJOSSOU Milka Ruth Fifamè', 'Vice-présidente',
    'Assiste le président dans l''exercice de ses fonctions et le supplée en cas d''empêchement.',
    'conseil_administration', 20),
  ('TOFFA Clotilde Kinvemi', 'Secrétaire générale',
    'Assure le secrétariat de l''Assemblée générale et du Conseil d''administration : conçoit les actes administratifs, rédige les procès-verbaux, comptes rendus, rapports de séance et convocations. Traite, affecte et classe les courriers, met en œuvre le plan de communication de l''ONG, constitue et archive sa mémoire.',
    'conseil_administration', 30),
  ('DJOSSOU Odilon Serge', 'Secrétaire général adjoint',
    'Assiste la secrétaire générale dans ses actions.',
    'conseil_administration', 40),
  ('KOUASSI Mewemahuwon Chantal', 'Trésorière générale',
    'Responsable de la gestion des fonds et du patrimoine de l''organisation. Tient une comptabilité régulière, transparente et sincère.',
    'conseil_administration', 50),
  ('NICOUE Ginette Sylvana', 'Trésorière générale adjointe',
    'Assiste la trésorière générale dans ses actions et missions, et la remplace en cas d''empêchement.',
    'conseil_administration', 60),
  ('AKAKPOVI Bertille Lucresse Amélévi', 'Chargée des affaires féminines',
    'Conçoit, coordonne et met en œuvre des projets et activités au profit des femmes.',
    'conseil_administration', 70),
  ('KOUASSI Coffi Boris', 'Chargé des affaires juvéniles',
    'Conçoit, coordonne et met en œuvre des projets et activités au profit de la jeunesse.',
    'conseil_administration', 80),
  ('ABIOLA Christelle Gloria', 'Chargée des affaires culturelles',
    'Conçoit, met en œuvre et coordonne des projets et activités en faveur de la culture.',
    'conseil_administration', 90),
  ('CHETAN Biwegnon Raoul', 'Président du conseil de surveillance',
    'Dirige et préside les réunions du conseil de surveillance, coordonne les activités de contrôle et de suivi, veille au respect des statuts et à la bonne gouvernance de l''ONG.',
    'conseil_surveillance', 10),
  ('ALINDIN Donan Jaelle', 'Secrétaire du conseil de surveillance',
    'Garante de la bonne organisation administrative et de la traçabilité des travaux du conseil de surveillance.',
    'conseil_surveillance', 20),
  ('BESSAN Guy', 'Membre du conseil de surveillance',
    'Veille à la transparence et à la bonne gouvernance de l''ONG, sans intervenir dans sa gestion quotidienne.',
    'conseil_surveillance', 30),
  ('OLYMPIO Maxylle Emmanuella', 'Chargée des affaires féminines adjointe',
    'Assiste la chargée des affaires féminines dans ses actions et missions.',
    'adjoints', 10),
  ('WINIWANOU Beninda Silvana', 'Chargée des affaires culturelles adjointe',
    'Assiste la chargée des affaires culturelles dans ses actions et missions.',
    'adjoints', 20)
) as v(full_name, position, bio, team_group, display_order)
where not exists (select 1 from public.team_members t where t.full_name = v.full_name);
