-- =====================================================================
-- INA-AFRICA — 1/9 Fondations
-- Extensions, schéma privé, types énumérés, fonctions utilitaires sans
-- dépendance aux tables.
-- =====================================================================

-- Adresse email : toujours en minuscules (Awa@x.com et awa@x.com sont la même
-- adresse). Le serveur met en minuscules avant d'écrire ; la base refuse le
-- reste. Plus sûr que l'extension citext, dont les comparaisons dépendent du
-- chemin de recherche des schémas de la connexion.
create domain public.email_address as text
  check (
    value = lower(value)
    and char_length(value) <= 254
    and value ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  );

-- Schéma privé : fonctions internes, jamais exposées par l'API Supabase
-- (seuls les schémas configurés, ici `public`, le sont).
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- Types énumérés
-- L'ordre de `app_role` compte : editor < admin < super_admin.
-- ---------------------------------------------------------------------
create type public.app_role as enum ('editor', 'admin', 'super_admin');
create type public.article_status as enum ('draft', 'in_review', 'published', 'archived');
create type public.project_status as enum ('planned', 'ongoing', 'completed', 'archived');
create type public.partner_kind as enum ('partner', 'sponsor');
create type public.gallery_item_type as enum ('photo', 'video');
create type public.video_provider as enum ('youtube', 'facebook');
create type public.request_type as enum ('contact', 'volunteer', 'membership', 'sponsorship');
create type public.request_status as enum ('unread', 'read', 'processed', 'archived');
create type public.subscriber_status as enum ('pending', 'subscribed', 'unsubscribed');
create type public.donation_channel as enum ('online', 'offline');
create type public.donation_status as enum ('pending', 'paid', 'failed', 'cancelled', 'refunded');
create type public.transaction_status as enum ('pending', 'succeeded', 'failed', 'cancelled', 'refunded');
create type public.payment_provider as enum ('kkiapay', 'cinetpay');

-- ---------------------------------------------------------------------
-- Fonctions utilitaires
-- ---------------------------------------------------------------------

-- Tient `updated_at` à jour.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Vrai quand l'opération vient du serveur (service_role) ou d'une migration,
-- faux quand elle vient d'un navigateur (anon / authenticated).
create or replace function private.is_backend()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user not in ('anon', 'authenticated');
$$;

-- Adresse lisible : minuscules, chiffres et tirets simples.
create or replace function private.is_valid_slug(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(value) <= 120;
$$;

-- Chemin d'un fichier dans le stockage Supabase (jamais une URL externe).
create or replace function private.is_valid_storage_path(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value ~ '^[A-Za-z0-9][A-Za-z0-9/_.-]*$'
     and position('..' in value) = 0
     and char_length(value) <= 300;
$$;

-- Document de l'éditeur visuel (Tiptap / ProseMirror) : un objet
-- { "type": "doc", ... } de taille raisonnable. La validation fine des
-- éléments autorisés est faite côté serveur (Zod) avant l'enregistrement.
create or replace function private.is_rich_doc(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'object'
     and value ->> 'type' = 'doc'
     and octet_length(value::text) <= 500000;
$$;

-- Extrait le texte brut d'un document de l'éditeur (recherche admin,
-- extraits, temps de lecture). Calculé par la base, jamais fourni par le client.
create or replace function private.rich_doc_text(value jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select coalesce(string_agg(node #>> '{}', ' '), '')
  from jsonb_path_query(value, 'strict $.**.text') as node
  where jsonb_typeof(node) = 'string';
$$;

-- Trigger : recalcule `content_text` depuis `content`.
create or replace function private.derive_content_text()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.content_text := private.rich_doc_text(new.content);
  return new;
end;
$$;

-- Droits d'exécution : explicites, jamais hérités de PUBLIC.
-- Ces fonctions servent dans les contraintes, les triggers et les règles RLS :
-- les rôles de l'API doivent pouvoir les exécuter. Aucune n'est sensible, et le
-- schéma `private` n'est pas exposé par l'API.
revoke all on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated, service_role;
