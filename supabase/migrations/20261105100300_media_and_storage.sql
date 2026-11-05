-- =====================================================================
-- INA-AFRICA — 4/9 Médiathèque et espaces de stockage
--   public-media      : photos et logos du site (servis publiquement,
--                       liste non consultable par les visiteurs)
--   private-documents : justificatifs des dons hors ligne (admin seulement)
-- Les contenus du site référencent un fichier par son chemin dans
-- public-media ; la table `media` est la bibliothèque côté administration.
-- =====================================================================

create table public.media (
  id uuid primary key default gen_random_uuid(),
  bucket text not null check (bucket in ('public-media', 'private-documents')),
  storage_path text not null check (private.is_valid_storage_path(storage_path)),
  file_name text not null check (char_length(file_name) between 1 and 255),
  file_type text not null,
  file_size bigint not null check (file_size > 0),
  alt_text text check (alt_text is null or char_length(alt_text) <= 300),
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_bucket_path_key unique (bucket, storage_path),
  -- SVG refusé : il peut contenir du script (le logo officiel est servi par le code du site).
  constraint media_type_and_size_allowed check (
    (bucket = 'public-media'
      and file_type in ('image/jpeg', 'image/png', 'image/webp')
      and file_size <= 5242880)
    or
    (bucket = 'private-documents'
      and file_type in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')
      and file_size <= 10485760)
  )
);

create index media_bucket_created_at_idx on public.media (bucket, created_at desc);
create index media_uploaded_by_idx on public.media (uploaded_by);

create trigger set_updated_at before update on public.media
  for each row execute function private.set_updated_at();

create trigger set_uploaded_by before insert on public.media
  for each row execute function private.set_actor('uploaded_by');

alter table public.media enable row level security;

revoke all on public.media from anon, authenticated;
grant select, insert, delete on public.media to authenticated;
grant update (alt_text, file_name) on public.media to authenticated;
grant all on public.media to service_role;

create policy "media : lecture (public : équipe, privé : admin)"
  on public.media for select to authenticated
  using (
    (bucket = 'public-media' and (select private.has_role('editor')))
    or (bucket = 'private-documents' and (select private.has_role('admin')))
  );

create policy "media : ajout (public : équipe, privé : admin)"
  on public.media for insert to authenticated
  with check (
    (bucket = 'public-media' and (select private.has_role('editor')))
    or (bucket = 'private-documents' and (select private.has_role('admin')))
  );

create policy "media : modification (public : équipe, privé : admin)"
  on public.media for update to authenticated
  using (
    (bucket = 'public-media' and (select private.has_role('editor')))
    or (bucket = 'private-documents' and (select private.has_role('admin')))
  )
  with check (
    (bucket = 'public-media' and (select private.has_role('editor')))
    or (bucket = 'private-documents' and (select private.has_role('admin')))
  );

create policy "media : suppression réservée aux admins"
  on public.media for delete to authenticated
  using ((select private.has_role('admin')));

-- ---------------------------------------------------------------------
-- Espaces de stockage (types et tailles contrôlés par Supabase lui-même)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-media', 'public-media', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('private-documents', 'private-documents', false, 10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- public-media : les fichiers sont servis par leur adresse publique, mais la
-- LISTE n'est visible que de l'équipe (une photo pas encore publiée ne peut
-- pas être découverte : les noms de fichiers sont aléatoires).
create policy "public-media : l'équipe liste les fichiers"
  on storage.objects for select to authenticated
  using (bucket_id = 'public-media' and (select private.has_role('editor')));

create policy "public-media : l'équipe envoie des fichiers"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'public-media' and (select private.has_role('editor')));

create policy "public-media : l'équipe remplace des fichiers"
  on storage.objects for update to authenticated
  using (bucket_id = 'public-media' and (select private.has_role('editor')))
  with check (bucket_id = 'public-media' and (select private.has_role('editor')));

create policy "public-media : suppression réservée aux admins"
  on storage.objects for delete to authenticated
  using (bucket_id = 'public-media' and (select private.has_role('admin')));

create policy "private-documents : accès réservé aux admins"
  on storage.objects for all to authenticated
  using (bucket_id = 'private-documents' and (select private.has_role('admin')))
  with check (bucket_id = 'private-documents' and (select private.has_role('admin')));
