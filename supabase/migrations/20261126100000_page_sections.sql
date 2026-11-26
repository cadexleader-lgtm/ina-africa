-- =====================================================================
-- INA-AFRICA : textes et photos des pages, modifiables dans
-- l'administration (menu « Pages du site », demande du 26/11/2026).
--
-- Une ligne par section modifiée, identifiée par « page.section »
-- (ex. « a-propos.gouvernance »). `content` ne contient que ce que
-- l'administration a saisi : tout champ absent ou vide affiche le texte
-- d'origine du site (src/content/page-sections/). Supprimer une ligne =
-- revenir au texte d'origine.
--
-- Lisible par tous (textes publics du site), modifiable par les admins.
-- Le contenu est validé par le serveur du site avant l'enregistrement ;
-- la base vérifie la forme générale et la taille.
-- =====================================================================

create table public.page_sections (
  id text primary key
    check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*\.[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 120),
  content jsonb not null default '{}'::jsonb
    check (jsonb_typeof(content) = 'object' and pg_column_size(content) <= 100000),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

comment on table public.page_sections is
  'Textes et photos des pages du site saisis dans l''administration (« page.section » → champs). Champ absent = texte d''origine.';

create index page_sections_updated_by_idx on public.page_sections (updated_by);

create trigger set_updated_at before update on public.page_sections
  for each row execute function private.set_updated_at();

create trigger set_updated_by before insert or update on public.page_sections
  for each row execute function private.set_actor('updated_by');

-- Journal d'audit : qui a modifié quelle section, et quand.
create trigger audit_page_sections
  after insert or update or delete on public.page_sections
  for each row execute function private.audit_trigger('updated_at');

alter table public.page_sections enable row level security;

revoke all on public.page_sections from anon, authenticated;
grant select on public.page_sections to anon, authenticated;
grant insert, update, delete on public.page_sections to authenticated;
grant all on public.page_sections to service_role;

create policy "page_sections : lecture publique"
  on public.page_sections for select to anon, authenticated
  using (true);
create policy "page_sections : gestion admin"
  on public.page_sections for all to authenticated
  using ((select private.has_role('admin')))
  with check ((select private.has_role('admin')));

-- Reprise des textes déjà saisis dans Paramètres → Page d'accueil (haut de
-- l'accueil, section « Impact ») : ils se modifient désormais dans
-- Pages du site → Accueil. Seuls les champs remplis sont repris.
insert into public.page_sections (id, content)
select 'accueil.haut', c from (
  select jsonb_strip_nulls(jsonb_build_object(
    'kicker', hero_kicker, 'title', hero_title, 'text', hero_text,
    'image', case when hero_image_path is not null and hero_image_alt is not null
      then jsonb_build_object('path', hero_image_path, 'alt', hero_image_alt) end)) as c
  from public.site_settings where id = 1) s
where c <> '{}'::jsonb
on conflict (id) do nothing;

insert into public.page_sections (id, content)
select 'accueil.actions', c from (
  select jsonb_strip_nulls(jsonb_build_object(
    'title', impact_title, 'text', impact_text,
    'image', case when impact_image_path is not null and impact_image_alt is not null
      then jsonb_build_object('path', impact_image_path, 'alt', impact_image_alt) end)) as c
  from public.site_settings where id = 1) s
where c <> '{}'::jsonb
on conflict (id) do nothing;
