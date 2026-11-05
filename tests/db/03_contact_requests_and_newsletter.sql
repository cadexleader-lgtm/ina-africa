-- Formulaires publics : écriture par le serveur uniquement, données
-- personnelles réservées aux admins.
begin;

set local role anon;
select tests.fails(
  $$insert into public.contact_requests (request_type, full_name, email, consent_at) values ('contact', 'Robot', 'a@b.co', now())$$,
  'Un visiteur ne peut pas écrire directement dans la boîte de réception (passage obligé par le serveur)', '42501');
select tests.fails('select * from public.contact_requests', 'Un visiteur ne peut pas lire les demandes', '42501');
select tests.fails(
  $$insert into public.newsletter_subscribers (email, consent_at, unsubscribe_token_hash) values ('a@b.co', now(), 'h')$$,
  'Un visiteur ne peut pas s''inscrire à la newsletter sans passer par le serveur', '42501');
reset role;

-- Le serveur enregistre les demandes
set local role service_role;
insert into public.contact_requests (request_type, full_name, email, message, details, consent_at)
values ('volunteer', 'Awa', 'awa@example.org', 'Je veux aider', '{"skills": ["animation"], "city": "Abomey-Calavi"}', now());
insert into public.contact_requests (request_type, full_name, phone, organization, message, consent_at)
values ('sponsorship', 'Société X', '+22990000000', 'Société X', 'Nous souhaitons sponsoriser', now());
select tests.fails(
  $$insert into public.contact_requests (request_type, full_name, consent_at) values ('contact', 'Sans contact', now())$$,
  'Une demande sans email ni téléphone est refusée', '23514');
select tests.fails(
  $$insert into public.contact_requests (request_type, full_name, email, consent_at) values ('contact', 'Email faux', 'pas-un-email', now())$$,
  'Un email mal formé est refusé', '23514');
select tests.fails(
  $$insert into public.contact_requests (request_type, full_name, email) values ('membership', 'Sans consentement', 'x@y.org')$$,
  'Une demande sans consentement est refusée', '23502');

select tests.fails(
  $$insert into public.newsletter_subscribers (email, consent_at, unsubscribe_token_hash) values ('Lecteur@Example.org', now(), 'h0')$$,
  'Une adresse email non mise en minuscules par le serveur est refusée', '23514');
insert into public.newsletter_subscribers (email, consent_at, unsubscribe_token_hash, confirmation_token_hash)
values ('lecteur@example.org', now(), 'hash-desinscription', 'hash-confirmation');
select tests.fails(
  $$insert into public.newsletter_subscribers (email, consent_at, unsubscribe_token_hash) values ('lecteur@example.org', now(), 'autre')$$,
  'Une même adresse ne s''inscrit qu''une fois', '23505');
select tests.fails(
  $$update public.newsletter_subscribers set status = 'subscribed' where email = 'lecteur@example.org'$$,
  'Un abonné n''est confirmé qu''avec une date de confirmation (double confirmation)', '23514');
reset role;

set local role authenticated;
select tests.login_as('00000000-0000-0000-0000-00000000000c', 'aal1');
select tests.ok((select count(*) from public.contact_requests) = 0,
  'Un éditeur ne voit pas les demandes (données personnelles)');
select tests.ok((select count(*) from public.newsletter_subscribers) = 0, 'Un éditeur ne voit pas les abonnés');

select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal2');
select tests.ok((select count(*) from public.contact_requests) = 2, 'L''admin voit toutes les demandes');
select tests.ok(
  (public.admin_dashboard_stats() -> 'requests_unread' ->> 'volunteer')::int = 1
  and (public.admin_dashboard_stats() -> 'requests_unread' ->> 'sponsorship')::int = 1,
  'Le tableau de bord compte les demandes non lues par type');
select tests.ok(
  tests.affected($$update public.contact_requests set status = 'processed' where request_type = 'volunteer'$$) = 1,
  'L''admin change le statut d''une demande');
select tests.ok(
  (select handled_by = '00000000-0000-0000-0000-00000000000b' and handled_at is not null
     from public.contact_requests where request_type = 'volunteer'),
  'Qui a traité la demande, et quand, est enregistré');
select tests.fails($$update public.contact_requests set message = 'Modifié'$$,
  'Le contenu d''une demande ne peut pas être modifié', '42501');
select tests.ok((select count(*) from public.newsletter_subscribers) = 1, 'L''admin voit les abonnés (pour l''export)');
reset role;

rollback;
