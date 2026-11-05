-- =====================================================================
-- INA-AFRICA — 6/9 Formulaires publics
--   contact_requests       : boîte de réception unique (contact, bénévole,
--                            adhésion, sponsor / partenariat)
--   newsletter_subscribers : inscriptions avec double confirmation
-- Écriture UNIQUEMENT par le serveur (service_role), après validation,
-- anti-robot et limite d'envois. Aucun accès des visiteurs à ces tables.
-- =====================================================================

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  request_type public.request_type not null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email public.email_address,
  phone text check (phone is null or char_length(phone) between 6 and 30),
  organization text check (organization is null or char_length(organization) <= 200),
  subject text check (subject is null or char_length(subject) <= 200),
  message text check (message is null or char_length(message) <= 5000),
  -- Informations propres au type de demande (compétences, profession, ville…).
  details jsonb not null default '{}'::jsonb
    check (jsonb_typeof(details) = 'object' and octet_length(details::text) <= 10000),
  status public.request_status not null default 'unread',
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,
  consent_at timestamptz not null,
  ip_hash text check (ip_hash is null or char_length(ip_hash) <= 128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_requests_reachable check (email is not null or phone is not null)
);

create index contact_requests_status_created_idx on public.contact_requests (status, created_at desc);
create index contact_requests_type_created_idx on public.contact_requests (request_type, created_at desc);
create index contact_requests_ip_hash_created_idx on public.contact_requests (ip_hash, created_at desc)
  where ip_hash is not null;
create index contact_requests_handled_by_idx on public.contact_requests (handled_by);

create trigger set_updated_at before update on public.contact_requests
  for each row execute function private.set_updated_at();

-- Qui a traité la demande, et quand.
create or replace function private.stamp_request_handling()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.handled_by := (select p.id from public.profiles p where p.id = auth.uid());
    new.handled_at := now();
  end if;
  return new;
end;
$$;

create trigger stamp_request_handling before update on public.contact_requests
  for each row execute function private.stamp_request_handling();

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email public.email_address not null unique,
  status public.subscriber_status not null default 'pending',
  consent_at timestamptz not null,
  -- Les jetons ne sont stockés que sous forme d'empreinte : une fuite de la
  -- base ne permettrait ni de confirmer ni de désinscrire quelqu'un.
  confirmation_token_hash text unique,
  confirmation_sent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribe_token_hash text not null unique,
  unsubscribed_at timestamptz,
  source text check (source is null or char_length(source) <= 100),
  ip_hash text check (ip_hash is null or char_length(ip_hash) <= 128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint newsletter_subscribed_is_confirmed
    check (status <> 'subscribed' or confirmed_at is not null),
  constraint newsletter_unsubscribed_has_date
    check (status <> 'unsubscribed' or unsubscribed_at is not null)
);

create index newsletter_subscribers_status_idx on public.newsletter_subscribers (status, created_at desc);

create trigger set_updated_at before update on public.newsletter_subscribers
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Droits et règles RLS
-- ---------------------------------------------------------------------
alter table public.contact_requests enable row level security;
alter table public.newsletter_subscribers enable row level security;

revoke all on public.contact_requests, public.newsletter_subscribers from anon, authenticated;

-- Les admins lisent, changent le statut d'une demande, suppriment sur demande
-- de la personne. Le contenu d'une demande n'est jamais modifiable.
grant select, delete on public.contact_requests to authenticated;
grant update (status) on public.contact_requests to authenticated;
grant select, delete on public.newsletter_subscribers to authenticated;

grant all on public.contact_requests, public.newsletter_subscribers to service_role;

create policy "contact_requests : lecture admin"
  on public.contact_requests for select to authenticated
  using ((select private.has_role('admin')));
create policy "contact_requests : traitement admin"
  on public.contact_requests for update to authenticated
  using ((select private.has_role('admin')))
  with check ((select private.has_role('admin')));
create policy "contact_requests : suppression admin"
  on public.contact_requests for delete to authenticated
  using ((select private.has_role('admin')));

create policy "newsletter_subscribers : lecture admin"
  on public.newsletter_subscribers for select to authenticated
  using ((select private.has_role('admin')));
create policy "newsletter_subscribers : suppression admin"
  on public.newsletter_subscribers for delete to authenticated
  using ((select private.has_role('admin')));

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated, service_role;
