-- =====================================================================
-- INA-AFRICA — 7/9 Appels aux dons, dons et paiements
--
-- Règles d'intégrité (garanties par la base, pas seulement par le code) :
--  * Personne ne modifie un don depuis un navigateur : aucune écriture
--    directe n'est autorisée aux rôles de l'API.
--  * Un don EN LIGNE n'est payé que lorsqu'une transaction a été confirmée
--    par le serveur après vérification auprès du prestataire
--    (confirm_payment_transaction, réservée au service_role).
--  * Au plus une transaction réussie par don ; un identifiant de
--    transaction du prestataire ne sert qu'une fois ; une notification
--    répétée ne change rien (fonctions idempotentes).
--  * Un don HORS LIGNE n'existe que s'il a été saisi par un admin
--    (record_offline_donation) ; la même opération Mobile Money / virement
--    ne peut pas être saisie deux fois.
--  * Montants en francs CFA entiers (XOF).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Appels aux dons (campagnes) : une page et un lien à partager chacun
-- ---------------------------------------------------------------------
create table public.donation_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  slug text not null unique check (private.is_valid_slug(slug)),
  summary text check (summary is null or char_length(summary) <= 300),
  content jsonb not null default '{"type": "doc", "content": []}'::jsonb
    check (private.is_rich_doc(content)),
  content_text text not null default '',
  cover_image_path text check (cover_image_path is null or private.is_valid_storage_path(cover_image_path)),
  cover_image_alt text check (cover_image_alt is null or char_length(cover_image_alt) <= 300),
  goal_amount bigint check (goal_amount is null or goal_amount > 0),
  currency char(3) not null default 'XOF' check (currency = 'XOF'),
  starts_on date,
  ends_on date,
  is_active boolean not null default false,
  show_progress boolean not null default false,
  -- Message prêt à envoyer sur WhatsApp / Facebook avec le lien de la page.
  share_message text check (share_message is null or char_length(share_message) <= 1000),
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 160),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint donation_campaigns_dates_order
    check (starts_on is null or ends_on is null or ends_on >= starts_on),
  constraint donation_campaigns_active_cover_has_alt
    check (not is_active or cover_image_path is null or cover_image_alt is not null)
);

create index donation_campaigns_active_idx on public.donation_campaigns (is_active, starts_on desc);

create trigger set_updated_at before update on public.donation_campaigns
  for each row execute function private.set_updated_at();

create trigger derive_content_text before insert or update on public.donation_campaigns
  for each row execute function private.derive_content_text();

create trigger set_created_by before insert on public.donation_campaigns
  for each row execute function private.set_actor('created_by');

create trigger audit_donation_campaigns
  after insert or update or delete on public.donation_campaigns
  for each row execute function private.audit_trigger('slug', 'is_active', 'goal_amount');

-- ---------------------------------------------------------------------
-- Dons : en ligne ET hors ligne, toujours distingués par `channel`
-- ---------------------------------------------------------------------
create sequence public.donation_reference_seq;

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  -- Référence lisible, utile pour le support : DON-2026-000123
  reference text not null unique default (
    'DON-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.donation_reference_seq')::text, 6, '0')
  ),
  campaign_id uuid references public.donation_campaigns (id) on delete restrict,
  channel public.donation_channel not null,
  donor_name text check (donor_name is null or char_length(donor_name) between 1 and 120),
  donor_email public.email_address,
  donor_phone text check (donor_phone is null or char_length(donor_phone) between 6 and 30),
  is_anonymous boolean not null default false,
  donor_message text check (donor_message is null or char_length(donor_message) <= 1000),
  amount bigint not null check (amount > 0 and amount <= 1000000000),
  currency char(3) not null default 'XOF' check (currency = 'XOF'),
  payment_status public.donation_status not null default 'pending',
  -- En ligne : renseigné par le prestataire. Hors ligne : mobile_money ou bank_transfer.
  payment_method text check (payment_method is null or char_length(payment_method) <= 50),
  provider public.payment_provider,
  paid_at timestamptz,
  -- Champs propres aux dons hors ligne
  received_on date,
  operator_or_bank text check (operator_or_bank is null or char_length(operator_or_bank) <= 100),
  external_reference text check (external_reference is null or char_length(external_reference) between 3 and 100),
  proof_path text check (proof_path is null or private.is_valid_storage_path(proof_path)),
  recorded_by uuid references public.profiles (id) on delete set null,
  cancelled_at timestamptz,
  cancellation_reason text check (cancellation_reason is null or char_length(cancellation_reason) between 3 and 500),
  -- Anti double-soumission (même clé = même don)
  idempotency_key uuid unique,
  -- Provenance, pour savoir quelle publicité ou quel partage rapporte
  utm_source text check (utm_source is null or char_length(utm_source) <= 100),
  utm_medium text check (utm_medium is null or char_length(utm_medium) <= 100),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 100),
  consent_at timestamptz,
  ip_hash text check (ip_hash is null or char_length(ip_hash) <= 128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint donations_online_fields check (
    channel <> 'online' or (
      consent_at is not null
      and (donor_email is not null or donor_phone is not null)
      and received_on is null
      and operator_or_bank is null
      and external_reference is null
      and proof_path is null
      and recorded_by is null
    )
  ),
  constraint donations_offline_fields check (
    channel <> 'offline' or (
      received_on is not null
      and provider is null
      and payment_method in ('mobile_money', 'bank_transfer')
      and payment_status in ('paid', 'cancelled')
    )
  ),
  constraint donations_paid_has_date check (payment_status <> 'paid' or paid_at is not null),
  constraint donations_cancelled_offline_has_reason check (
    channel <> 'offline' or payment_status <> 'cancelled'
    or (cancelled_at is not null and cancellation_reason is not null)
  )
);

-- La même opération (même mode + même référence) ne peut être saisie deux fois,
-- sauf si la saisie précédente a été annulée.
create unique index donations_offline_reference_uidx
  on public.donations (payment_method, lower(external_reference))
  where channel = 'offline' and external_reference is not null and payment_status <> 'cancelled';

create index donations_channel_status_created_idx on public.donations (channel, payment_status, created_at desc);
create index donations_campaign_id_idx on public.donations (campaign_id);
create index donations_utm_source_idx on public.donations (utm_source) where utm_source is not null;
create index donations_recorded_by_idx on public.donations (recorded_by);
create index donations_ip_hash_created_idx on public.donations (ip_hash, created_at desc) where ip_hash is not null;

create trigger set_updated_at before update on public.donations
  for each row execute function private.set_updated_at();

create trigger audit_donations
  after insert or update or delete on public.donations
  for each row execute function private.audit_trigger('reference', 'channel', 'amount', 'payment_status', 'campaign_id');

-- ---------------------------------------------------------------------
-- Tentatives de paiement en ligne (une par passage chez le prestataire)
-- ---------------------------------------------------------------------
create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations (id) on delete restrict,
  provider public.payment_provider not null,
  -- Notre référence, envoyée au prestataire
  merchant_reference text not null unique check (char_length(merchant_reference) between 8 and 100),
  provider_transaction_id text check (provider_transaction_id is null or char_length(provider_transaction_id) <= 200),
  amount bigint not null check (amount > 0),
  currency char(3) not null default 'XOF' check (currency = 'XOF'),
  status public.transaction_status not null default 'pending',
  payment_url text check (payment_url is null or (payment_url ~ '^https://' and char_length(payment_url) <= 2000)),
  provider_response jsonb,
  failure_reason text check (failure_reason is null or char_length(failure_reason) <= 500),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_transactions_confirmed_is_verified
    check (status not in ('succeeded', 'refunded') or verified_at is not null)
);

-- Un identifiant de transaction du prestataire ne sert qu'une fois.
create unique index payment_transactions_provider_tx_uidx
  on public.payment_transactions (provider, provider_transaction_id)
  where provider_transaction_id is not null;

-- Au plus UNE transaction ayant réellement encaissé de l'argent par don.
create unique index payment_transactions_one_success_per_donation_uidx
  on public.payment_transactions (donation_id)
  where status in ('succeeded', 'refunded');

create index payment_transactions_donation_id_idx on public.payment_transactions (donation_id);
create index payment_transactions_status_created_idx on public.payment_transactions (status, created_at desc);

create trigger set_updated_at before update on public.payment_transactions
  for each row execute function private.set_updated_at();

create trigger audit_payment_transactions
  after insert or update on public.payment_transactions
  for each row execute function private.audit_trigger('donation_id', 'provider', 'amount', 'status');

-- Une transaction ne concerne qu'un don en ligne, au même montant.
create or replace function private.check_transaction_matches_donation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  d public.donations;
begin
  select * into d from public.donations where id = new.donation_id;
  if d.channel <> 'online' then
    raise exception 'Un paiement en ligne ne peut concerner qu''un don en ligne.'
      using errcode = '23514', hint = 'ina-africa';
  end if;
  if new.amount <> d.amount or new.currency <> d.currency then
    raise exception 'Le montant de la transaction doit être celui du don.'
      using errcode = '23514', hint = 'ina-africa';
  end if;
  return new;
end;
$$;

create trigger check_transaction_matches_donation
  before insert or update of donation_id, amount, currency on public.payment_transactions
  for each row execute function private.check_transaction_matches_donation();

-- ---------------------------------------------------------------------
-- Droits et règles RLS
-- ---------------------------------------------------------------------
alter table public.donation_campaigns enable row level security;
alter table public.donations enable row level security;
alter table public.payment_transactions enable row level security;

revoke all on public.donation_campaigns, public.donations, public.payment_transactions
  from anon, authenticated;

grant select on public.donation_campaigns to anon, authenticated;
grant insert, update, delete on public.donation_campaigns to authenticated;

-- Dons et transactions : LECTURE SEULE pour les admins. Toute écriture passe
-- par le serveur ou par les fonctions ci-dessous.
grant select on public.donations, public.payment_transactions to authenticated;

grant all on public.donation_campaigns, public.donations, public.payment_transactions to service_role;
grant usage, select on sequence public.donation_reference_seq to service_role;

create policy "donation_campaigns : les visiteurs voient les appels actifs"
  on public.donation_campaigns for select to anon, authenticated
  using (is_active);
create policy "donation_campaigns : l'équipe voit tous les appels"
  on public.donation_campaigns for select to authenticated
  using ((select private.has_role('editor')));
create policy "donation_campaigns : gestion admin"
  on public.donation_campaigns for all to authenticated
  using ((select private.has_role('admin')))
  with check ((select private.has_role('admin')));

create policy "donations : lecture admin"
  on public.donations for select to authenticated
  using ((select private.has_role('admin')));

create policy "payment_transactions : lecture admin"
  on public.payment_transactions for select to authenticated
  using ((select private.has_role('admin')));

-- =====================================================================
-- Fonctions des dons EN LIGNE — réservées au serveur (service_role).
-- Appelées uniquement APRÈS vérification du paiement auprès du prestataire
-- (jamais sur la seule foi d'une page de retour ou d'une notification).
-- =====================================================================

-- Confirme une transaction. Idempotente : une notification répétée renvoie
-- 'already_confirmed' sans rien changer.
create or replace function public.confirm_payment_transaction(
  p_transaction_id uuid,
  p_provider_transaction_id text,
  p_amount bigint,
  p_currency text,
  p_payment_method text default null,
  p_provider_response jsonb default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  tx public.payment_transactions;
  d public.donations;
begin
  if coalesce(trim(p_provider_transaction_id), '') = '' then
    raise exception 'Identifiant de transaction du prestataire manquant.' using errcode = '22023', hint = 'ina-africa';
  end if;

  select * into tx from public.payment_transactions where id = p_transaction_id for update;
  if not found then
    raise exception 'Transaction introuvable.' using errcode = 'P0002', hint = 'ina-africa';
  end if;

  if tx.status = 'succeeded' then
    if tx.provider_transaction_id is distinct from p_provider_transaction_id then
      raise exception 'Transaction déjà confirmée avec un autre identifiant prestataire.'
        using errcode = 'P0001', hint = 'ina-africa';
    end if;
    return 'already_confirmed';
  end if;

  if tx.status <> 'pending' then
    raise exception 'Transaction au statut « % » : confirmation impossible.', tx.status
      using errcode = 'P0001', hint = 'ina-africa';
  end if;

  if p_amount is distinct from tx.amount or upper(p_currency) is distinct from tx.currency::text then
    raise exception 'Montant ou devise confirmés par le prestataire différents de la transaction.'
      using errcode = 'P0001', hint = 'ina-africa';
  end if;

  select * into d from public.donations where id = tx.donation_id for update;
  if d.payment_status not in ('pending', 'failed', 'cancelled') then
    raise exception 'Ce don est déjà au statut « % ».', d.payment_status using errcode = 'P0001', hint = 'ina-africa';
  end if;

  update public.payment_transactions
     set status = 'succeeded',
         provider_transaction_id = p_provider_transaction_id,
         verified_at = now(),
         failure_reason = null,
         provider_response = coalesce(p_provider_response, provider_response)
   where id = tx.id;

  update public.donations
     set payment_status = 'paid',
         paid_at = now(),
         provider = tx.provider,
         payment_method = coalesce(p_payment_method, payment_method)
   where id = d.id;

  return 'confirmed';
end;
$$;

-- Marque une tentative comme échouée ou annulée. Idempotente.
-- Le don ne passe en échec / annulé que s'il n'a aucune autre tentative en
-- cours ou réussie.
create or replace function public.fail_payment_transaction(
  p_transaction_id uuid,
  p_status public.transaction_status,
  p_reason text default null,
  p_provider_response jsonb default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  tx public.payment_transactions;
begin
  if p_status not in ('failed', 'cancelled') then
    raise exception 'Statut attendu : failed ou cancelled.' using errcode = '22023', hint = 'ina-africa';
  end if;

  select * into tx from public.payment_transactions where id = p_transaction_id for update;
  if not found then
    raise exception 'Transaction introuvable.' using errcode = 'P0002', hint = 'ina-africa';
  end if;

  if tx.status in ('failed', 'cancelled') then
    return 'already_closed';
  end if;
  if tx.status <> 'pending' then
    raise exception 'Transaction au statut « % » : elle ne peut plus échouer.', tx.status
      using errcode = 'P0001', hint = 'ina-africa';
  end if;

  update public.payment_transactions
     set status = p_status,
         failure_reason = left(p_reason, 500),
         provider_response = coalesce(p_provider_response, provider_response)
   where id = tx.id;

  update public.donations d
     set payment_status = case when p_status = 'failed' then 'failed'::public.donation_status
                               else 'cancelled'::public.donation_status end
   where d.id = tx.donation_id
     and d.payment_status = 'pending'
     and not exists (
       select 1 from public.payment_transactions t
        where t.donation_id = d.id and t.status in ('pending', 'succeeded', 'refunded')
     );

  return 'closed';
end;
$$;

-- Enregistre un remboursement fait chez le prestataire (après vérification).
create or replace function public.refund_payment_transaction(
  p_transaction_id uuid,
  p_provider_response jsonb default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  tx public.payment_transactions;
begin
  select * into tx from public.payment_transactions where id = p_transaction_id for update;
  if not found then
    raise exception 'Transaction introuvable.' using errcode = 'P0002', hint = 'ina-africa';
  end if;
  if tx.status = 'refunded' then
    return 'already_refunded';
  end if;
  if tx.status <> 'succeeded' then
    raise exception 'Seule une transaction réussie peut être remboursée.' using errcode = 'P0001', hint = 'ina-africa';
  end if;

  update public.payment_transactions
     set status = 'refunded',
         provider_response = coalesce(p_provider_response, provider_response)
   where id = tx.id;

  update public.donations set payment_status = 'refunded' where id = tx.donation_id;
  return 'refunded';
end;
$$;

revoke all on function public.confirm_payment_transaction(uuid, text, bigint, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.fail_payment_transaction(uuid, public.transaction_status, text, jsonb) from public, anon, authenticated;
revoke all on function public.refund_payment_transaction(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.confirm_payment_transaction(uuid, text, bigint, text, text, jsonb) to service_role;
grant execute on function public.fail_payment_transaction(uuid, public.transaction_status, text, jsonb) to service_role;
grant execute on function public.refund_payment_transaction(uuid, jsonb) to service_role;

-- =====================================================================
-- Fonctions des dons HORS LIGNE — réservées aux admins.
-- Un don saisi par un admin est validé directement : son nom et la date de
-- saisie sont conservés (recorded_by, created_at, journal d'audit).
-- =====================================================================
create or replace function public.record_offline_donation(
  p_amount bigint,
  p_received_on date,
  p_payment_method text,
  p_external_reference text default null,
  p_operator_or_bank text default null,
  p_donor_name text default null,
  p_donor_email text default null,
  p_donor_phone text default null,
  p_is_anonymous boolean default false,
  p_campaign_id uuid default null,
  p_proof_path text default null,
  p_donor_message text default null,
  p_idempotency_key uuid default null
)
returns public.donations
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.donations;
  ref text := nullif(trim(p_external_reference), '');
begin
  if not private.has_role('admin') then
    raise exception 'Accès refusé : réservé aux administrateurs.' using errcode = '42501', hint = 'ina-africa';
  end if;

  if p_idempotency_key is not null then
    select * into result from public.donations where idempotency_key = p_idempotency_key;
    if found then
      return result;
    end if;
  end if;

  if p_payment_method is null or p_payment_method not in ('mobile_money', 'bank_transfer') then
    raise exception 'Mode de réception attendu : Mobile Money ou virement.' using errcode = '22023', hint = 'ina-africa';
  end if;
  if p_received_on is null or p_received_on > current_date then
    raise exception 'La date de réception est obligatoire et ne peut pas être dans le futur.'
      using errcode = '22023', hint = 'ina-africa';
  end if;
  if p_campaign_id is not null
     and not exists (select 1 from public.donation_campaigns where id = p_campaign_id) then
    raise exception 'Appel aux dons introuvable.' using errcode = 'P0002', hint = 'ina-africa';
  end if;
  if p_proof_path is not null and not exists (
    select 1 from public.media
     where bucket = 'private-documents' and storage_path = p_proof_path
  ) then
    raise exception 'Le justificatif doit être un fichier de l''espace privé.' using errcode = '22023', hint = 'ina-africa';
  end if;
  if ref is not null and exists (
    select 1 from public.donations
     where channel = 'offline'
       and payment_method = p_payment_method
       and lower(external_reference) = lower(ref)
       and payment_status <> 'cancelled'
  ) then
    raise exception 'Cette opération (même mode de réception et même référence) est déjà enregistrée.'
      using errcode = '23505', hint = 'ina-africa';
  end if;

  insert into public.donations (
    channel, amount, received_on, payment_method, operator_or_bank, external_reference,
    donor_name, donor_email, donor_phone, is_anonymous, campaign_id, proof_path,
    donor_message, payment_status, paid_at, recorded_by, idempotency_key
  )
  values (
    'offline', p_amount, p_received_on, p_payment_method, nullif(trim(p_operator_or_bank), ''), ref,
    nullif(trim(p_donor_name), ''), lower(nullif(trim(p_donor_email), '')), nullif(trim(p_donor_phone), ''),
    coalesce(p_is_anonymous, false), p_campaign_id, p_proof_path,
    nullif(trim(p_donor_message), ''), 'paid', now(), auth.uid(), p_idempotency_key
  )
  returning * into result;

  return result;
exception
  when unique_violation then
    -- Double clic : même clé d'idempotence déjà enregistrée entre-temps.
    if p_idempotency_key is not null then
      select * into result from public.donations where idempotency_key = p_idempotency_key;
      if found then
        return result;
      end if;
    end if;
    raise exception 'Cette opération (même mode de réception et même référence) est déjà enregistrée.'
      using errcode = '23505', hint = 'ina-africa';
end;
$$;

-- Annule un don hors ligne saisi par erreur (jamais de suppression).
create or replace function public.cancel_offline_donation(
  p_donation_id uuid,
  p_reason text
)
returns public.donations
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.donations;
begin
  if not private.has_role('admin') then
    raise exception 'Accès refusé : réservé aux administrateurs.' using errcode = '42501', hint = 'ina-africa';
  end if;
  if char_length(coalesce(trim(p_reason), '')) < 3 then
    raise exception 'Le motif d''annulation est obligatoire.' using errcode = '22023', hint = 'ina-africa';
  end if;

  select * into result from public.donations where id = p_donation_id for update;
  if not found or result.channel <> 'offline' then
    raise exception 'Don hors ligne introuvable.' using errcode = 'P0002', hint = 'ina-africa';
  end if;
  if result.payment_status = 'cancelled' then
    return result;
  end if;

  update public.donations
     set payment_status = 'cancelled',
         cancelled_at = now(),
         cancellation_reason = trim(p_reason)
   where id = p_donation_id
  returning * into result;

  return result;
end;
$$;

revoke all on function public.record_offline_donation(bigint, date, text, text, text, text, text, text, boolean, uuid, text, text, uuid) from public, anon;
revoke all on function public.cancel_offline_donation(uuid, text) from public, anon;
grant execute on function public.record_offline_donation(bigint, date, text, text, text, text, text, text, boolean, uuid, text, text, uuid) to authenticated, service_role;
grant execute on function public.cancel_offline_donation(uuid, text) to authenticated, service_role;

-- =====================================================================
-- Jauge publique d'un appel aux dons : uniquement des totaux, et seulement
-- si l'appel est actif et que l'admin a choisi d'afficher la jauge.
-- En ligne = transactions réussies ET vérifiées ; hors ligne = saisies admin
-- non annulées.
-- =====================================================================
create or replace function public.campaign_progress(p_campaign_id uuid)
returns table (
  online_amount bigint,
  offline_amount bigint,
  total_amount bigint,
  goal_amount bigint,
  donations_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with c as (
    select id, goal_amount from public.donation_campaigns
     where id = p_campaign_id and is_active and show_progress
  ),
  online as (
    select coalesce(sum(t.amount), 0)::bigint as amount, count(*)::bigint as n
      from public.payment_transactions t
      join public.donations d on d.id = t.donation_id
     where d.campaign_id = (select id from c)
       and t.status = 'succeeded' and t.verified_at is not null
  ),
  offline as (
    select coalesce(sum(d.amount), 0)::bigint as amount, count(*)::bigint as n
      from public.donations d
     where d.campaign_id = (select id from c)
       and d.channel = 'offline' and d.payment_status = 'paid'
  )
  select online.amount, offline.amount, online.amount + offline.amount,
         (select goal_amount from c), online.n + offline.n
    from online, offline
   where exists (select 1 from c);
$$;

revoke all on function public.campaign_progress(uuid) from public;
grant execute on function public.campaign_progress(uuid) to anon, authenticated, service_role;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated, service_role;
