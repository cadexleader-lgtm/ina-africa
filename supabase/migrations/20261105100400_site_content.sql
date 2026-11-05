-- =====================================================================
-- INA-AFRICA — 5/9 Contenus du site
-- Blog, projets, domaines d'intervention, partenaires et sponsors, équipe,
-- galerie, paramètres du site.
-- Principe : rien n'est public par défaut. Un visiteur ne voit que ce qui est
-- publié ou activé par un administrateur.
-- Rôles : l'éditeur écrit et soumet des articles ; l'admin publie et gère
-- tout le reste.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Catégories du blog
-- ---------------------------------------------------------------------
create table public.article_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 80),
  slug text not null unique check (private.is_valid_slug(slug)),
  description text check (description is null or char_length(description) <= 500),
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.article_categories
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Articles (blog / actualités)
-- ---------------------------------------------------------------------
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  slug text not null unique check (private.is_valid_slug(slug)),
  excerpt text check (excerpt is null or char_length(excerpt) <= 500),
  content jsonb not null default '{"type": "doc", "content": []}'::jsonb
    check (private.is_rich_doc(content)),
  content_text text not null default '',
  cover_image_path text check (cover_image_path is null or private.is_valid_storage_path(cover_image_path)),
  cover_image_alt text check (cover_image_alt is null or char_length(cover_image_alt) <= 300),
  category_id uuid references public.article_categories (id) on delete set null,
  status public.article_status not null default 'draft',
  author_id uuid references public.profiles (id) on delete set null,
  submitted_at timestamptz,
  review_note text check (review_note is null or char_length(review_note) <= 2000),
  published_at timestamptz,
  published_by uuid references public.profiles (id) on delete set null,
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_published_has_date
    check (status <> 'published' or published_at is not null),
  -- Texte alternatif obligatoire pour publier une image (accessibilité, Google).
  constraint articles_published_cover_has_alt
    check (status <> 'published' or cover_image_path is null or cover_image_alt is not null)
);

create index articles_status_published_at_idx on public.articles (status, published_at desc);
create index articles_category_id_idx on public.articles (category_id);
create index articles_author_id_idx on public.articles (author_id);
create index articles_published_by_idx on public.articles (published_by);

create trigger set_updated_at before update on public.articles
  for each row execute function private.set_updated_at();

create trigger derive_content_text before insert or update on public.articles
  for each row execute function private.derive_content_text();

-- Circuit de publication :
--   brouillon → en validation (éditeur ou admin)
--   en validation → publié / renvoyé en brouillon (admin)
--   publié → archivé ou dépublié (admin)
-- L'éditeur ne peut ni publier, ni archiver, ni changer l'auteur, ni toucher
-- aux champs de publication. Les règles RLS l'empêchent en plus de modifier
-- un article publié ou archivé.
create or replace function private.articles_workflow()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  is_admin constant boolean := private.is_backend() or private.has_role('admin');
begin
  if tg_op = 'INSERT' then
    if not private.is_backend() then
      new.author_id := auth.uid();
    end if;
  elsif new.author_id is distinct from old.author_id and not is_admin then
    raise exception 'Seul un administrateur peut changer l''auteur d''un article.'
      using errcode = '42501', hint = 'ina-africa';
  end if;

  if new.status in ('published', 'archived')
     and (tg_op = 'INSERT' or new.status is distinct from old.status)
     and not is_admin then
    raise exception 'Seul un administrateur peut publier ou archiver un article.'
      using errcode = '42501', hint = 'ina-africa';
  end if;

  if not is_admin then
    if tg_op = 'INSERT' then
      new.published_at := null;
      new.published_by := null;
      new.review_note := null;
    else
      new.published_at := old.published_at;
      new.published_by := old.published_by;
      new.review_note := old.review_note;
    end if;
  end if;

  if new.status = 'in_review' and (tg_op = 'INSERT' or old.status <> 'in_review') then
    new.submitted_at := now();
  end if;

  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    -- La date de première publication est conservée en cas de republication.
    new.published_at := coalesce(new.published_at, now());
    new.published_by := (select p.id from public.profiles p where p.id = auth.uid());
    -- La remarque de relecture est interne : elle ne reste pas sur un article publié.
    new.review_note := null;
  end if;

  return new;
end;
$$;

create trigger articles_workflow before insert or update on public.articles
  for each row execute function private.articles_workflow();

create trigger audit_articles
  after insert or update or delete on public.articles
  for each row execute function private.audit_trigger('slug', 'status');

-- ---------------------------------------------------------------------
-- Projets et réalisations
-- ---------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 200),
  slug text not null unique check (private.is_valid_slug(slug)),
  summary text check (summary is null or char_length(summary) <= 300),
  content jsonb not null default '{"type": "doc", "content": []}'::jsonb
    check (private.is_rich_doc(content)),
  content_text text not null default '',
  location text check (location is null or char_length(location) <= 200),
  start_date date,
  end_date date,
  status public.project_status not null default 'planned',
  is_published boolean not null default false,
  published_at timestamptz,
  cover_image_path text check (cover_image_path is null or private.is_valid_storage_path(cover_image_path)),
  cover_image_alt text check (cover_image_alt is null or char_length(cover_image_alt) <= 300),
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_dates_order
    check (start_date is null or end_date is null or end_date >= start_date),
  constraint projects_published_has_date
    check (not is_published or published_at is not null),
  constraint projects_published_cover_has_alt
    check (not is_published or cover_image_path is null or cover_image_alt is not null)
);

create index projects_published_idx on public.projects (is_published, published_at desc);

create trigger set_updated_at before update on public.projects
  for each row execute function private.set_updated_at();

create trigger derive_content_text before insert or update on public.projects
  for each row execute function private.derive_content_text();

create or replace function private.stamp_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger stamp_published_at before insert or update on public.projects
  for each row execute function private.stamp_published_at();

create trigger audit_projects
  after insert or update or delete on public.projects
  for each row execute function private.audit_trigger('slug', 'is_published');

-- ---------------------------------------------------------------------
-- Domaines d'intervention
-- ---------------------------------------------------------------------
create table public.action_areas (
  id uuid primary key default gen_random_uuid(),
  title text not null unique check (char_length(title) between 2 and 120),
  slug text not null unique check (private.is_valid_slug(slug)),
  description text check (description is null or char_length(description) <= 5000),
  image_path text check (image_path is null or private.is_valid_storage_path(image_path)),
  image_alt text check (image_alt is null or char_length(image_alt) <= 300),
  is_active boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index action_areas_active_order_idx on public.action_areas (is_active, display_order);

create trigger set_updated_at before update on public.action_areas
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Partenaires et sponsors (aucun n'est pré-rempli : uniquement ceux dont
-- l'ONG a l'autorisation de publication)
-- ---------------------------------------------------------------------
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  kind public.partner_kind not null default 'partner',
  description text check (description is null or char_length(description) <= 2000),
  logo_path text check (logo_path is null or private.is_valid_storage_path(logo_path)),
  website_url text check (website_url is null or (website_url ~ '^https?://' and char_length(website_url) <= 500)),
  is_active boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index partners_active_order_idx on public.partners (is_active, kind, display_order);

create trigger set_updated_at before update on public.partners
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Équipe
-- ---------------------------------------------------------------------
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  position text not null check (char_length(position) between 2 and 120),
  bio text check (bio is null or char_length(bio) <= 2000),
  photo_path text check (photo_path is null or private.is_valid_storage_path(photo_path)),
  is_active boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index team_members_active_order_idx on public.team_members (is_active, display_order);

create trigger set_updated_at before update on public.team_members
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Galerie : vraies photos de l'ONG ou vidéos YouTube / Facebook
-- ---------------------------------------------------------------------
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  item_type public.gallery_item_type not null,
  image_path text check (image_path is null or private.is_valid_storage_path(image_path)),
  image_alt text check (image_alt is null or char_length(image_alt) <= 300),
  video_provider public.video_provider,
  video_url text check (video_url is null or char_length(video_url) <= 500),
  caption text check (caption is null or char_length(caption) <= 500),
  taken_on date,
  display_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gallery_items_photo_fields check (
    item_type <> 'photo'
    or (image_path is not null and video_url is null and video_provider is null)
  ),
  constraint gallery_items_video_fields check (
    item_type <> 'video'
    or (video_url is not null and video_provider is not null)
  ),
  -- Seules les adresses YouTube et Facebook sont acceptées.
  constraint gallery_items_video_url_allowed check (
    video_url is null
    or (video_provider = 'youtube'
        and video_url ~ '^https://(www\.|m\.)?(youtube\.com|youtu\.be)/')
    or (video_provider = 'facebook'
        and video_url ~ '^https://(www\.|m\.|web\.)?(facebook\.com|fb\.watch)/')
  ),
  constraint gallery_items_published_image_has_alt check (
    not is_published or image_path is null or image_alt is not null
  )
);

create index gallery_items_published_order_idx on public.gallery_items (is_published, display_order, taken_on desc);

create trigger set_updated_at before update on public.gallery_items
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Paramètres du site (une seule ligne, lisible par tous)
-- ---------------------------------------------------------------------
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  about_history text check (about_history is null or char_length(about_history) <= 10000),
  vision text check (vision is null or char_length(vision) <= 5000),
  mission text check (mission is null or char_length(mission) <= 5000),
  objectives text check (objectives is null or char_length(objectives) <= 5000),
  contact_email public.email_address,
  contact_phone text check (contact_phone is null or char_length(contact_phone) <= 30),
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^\+?[0-9]{8,15}$'),
  address text check (address is null or char_length(address) <= 500),
  social_links jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links) = 'object'),
  donation_min_amount bigint check (donation_min_amount is null or donation_min_amount > 0),
  donation_suggested_amounts bigint[] not null default '{}'
    check (0 < all (donation_suggested_amounts) and cardinality(donation_suggested_amounts) <= 8),
  -- Liste de { "method": "mobile_money" | "bank_transfer", "label", "holder", "number", "note" }
  offline_donation_instructions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(offline_donation_instructions) = 'array'),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.site_settings
  for each row execute function private.set_updated_at();

create trigger set_updated_by before update on public.site_settings
  for each row execute function private.set_actor('updated_by');

-- ---------------------------------------------------------------------
-- Droits et règles RLS
-- ---------------------------------------------------------------------
alter table public.article_categories enable row level security;
alter table public.articles enable row level security;
alter table public.projects enable row level security;
alter table public.action_areas enable row level security;
alter table public.partners enable row level security;
alter table public.team_members enable row level security;
alter table public.gallery_items enable row level security;
alter table public.site_settings enable row level security;

-- Lisibles par les visiteurs (filtrés par RLS), modifiables par l'équipe
-- selon les règles ci-dessous.
revoke all on public.article_categories, public.articles, public.projects,
  public.action_areas, public.partners, public.team_members,
  public.gallery_items, public.site_settings
  from anon, authenticated;

grant select on public.article_categories, public.articles, public.projects,
  public.action_areas, public.partners, public.team_members,
  public.gallery_items, public.site_settings
  to anon, authenticated;

grant insert, update, delete on public.article_categories, public.articles,
  public.projects, public.action_areas, public.partners, public.team_members,
  public.gallery_items
  to authenticated;

-- Une seule ligne de paramètres : ni ajout ni suppression depuis l'application.
grant update on public.site_settings to authenticated;

grant all on public.article_categories, public.articles, public.projects,
  public.action_areas, public.partners, public.team_members,
  public.gallery_items, public.site_settings
  to service_role;

-- Catégories : publiques, gérées par les admins.
create policy "article_categories : lecture publique"
  on public.article_categories for select to anon, authenticated
  using (true);
create policy "article_categories : gestion admin"
  on public.article_categories for all to authenticated
  using ((select private.has_role('admin')))
  with check ((select private.has_role('admin')));

-- Articles.
create policy "articles : les visiteurs lisent les articles publiés"
  on public.articles for select to anon, authenticated
  using (status = 'published');
create policy "articles : l'équipe lit tous les articles"
  on public.articles for select to authenticated
  using ((select private.has_role('editor')));
create policy "articles : création par l'équipe (sans publier)"
  on public.articles for insert to authenticated
  with check (
    (select private.has_role('admin'))
    or ((select private.has_role('editor')) and status in ('draft', 'in_review'))
  );
create policy "articles : l'admin modifie tous les articles"
  on public.articles for update to authenticated
  using ((select private.has_role('admin')))
  with check ((select private.has_role('admin')));
create policy "articles : l'éditeur modifie les articles non publiés"
  on public.articles for update to authenticated
  using ((select private.has_role('editor')) and status in ('draft', 'in_review'))
  with check ((select private.has_role('editor')) and status in ('draft', 'in_review'));
create policy "articles : l'admin supprime"
  on public.articles for delete to authenticated
  using ((select private.has_role('admin')));
create policy "articles : l'éditeur supprime ses propres brouillons"
  on public.articles for delete to authenticated
  using (
    (select private.has_role('editor'))
    and status = 'draft'
    and author_id = (select auth.uid())
  );

-- Projets et galerie : publics une fois publiés, gérés par les admins.
create policy "projects : les visiteurs lisent les projets publiés"
  on public.projects for select to anon, authenticated
  using (is_published);
create policy "projects : l'équipe lit tous les projets"
  on public.projects for select to authenticated
  using ((select private.has_role('editor')));
create policy "projects : gestion admin"
  on public.projects for all to authenticated
  using ((select private.has_role('admin')))
  with check ((select private.has_role('admin')));

create policy "gallery_items : les visiteurs voient la galerie publiée"
  on public.gallery_items for select to anon, authenticated
  using (is_published);
create policy "gallery_items : l'équipe voit toute la galerie"
  on public.gallery_items for select to authenticated
  using ((select private.has_role('editor')));
create policy "gallery_items : gestion admin"
  on public.gallery_items for all to authenticated
  using ((select private.has_role('admin')))
  with check ((select private.has_role('admin')));

-- Domaines, partenaires, équipe : publics une fois activés, gérés par les admins.
create policy "action_areas : les visiteurs voient les domaines actifs"
  on public.action_areas for select to anon, authenticated
  using (is_active);
create policy "action_areas : l'équipe voit tous les domaines"
  on public.action_areas for select to authenticated
  using ((select private.has_role('editor')));
create policy "action_areas : gestion admin"
  on public.action_areas for all to authenticated
  using ((select private.has_role('admin')))
  with check ((select private.has_role('admin')));

create policy "partners : les visiteurs voient les partenaires actifs"
  on public.partners for select to anon, authenticated
  using (is_active);
create policy "partners : l'équipe voit tous les partenaires"
  on public.partners for select to authenticated
  using ((select private.has_role('editor')));
create policy "partners : gestion admin"
  on public.partners for all to authenticated
  using ((select private.has_role('admin')))
  with check ((select private.has_role('admin')));

create policy "team_members : les visiteurs voient l'équipe active"
  on public.team_members for select to anon, authenticated
  using (is_active);
create policy "team_members : l'équipe voit tous les membres"
  on public.team_members for select to authenticated
  using ((select private.has_role('editor')));
create policy "team_members : gestion admin"
  on public.team_members for all to authenticated
  using ((select private.has_role('admin')))
  with check ((select private.has_role('admin')));

-- Paramètres : lisibles par tous, modifiables par les admins.
create policy "site_settings : lecture publique"
  on public.site_settings for select to anon, authenticated
  using (true);
create policy "site_settings : modification admin"
  on public.site_settings for update to authenticated
  using ((select private.has_role('admin')))
  with check ((select private.has_role('admin')));

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated, service_role;
