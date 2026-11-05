-- Espaces de stockage et médiathèque.
begin;

select tests.ok(
  (select public and file_size_limit = 5242880
          and not ('image/svg+xml' = any (allowed_mime_types))
     from storage.buckets where id = 'public-media'),
  'L''espace public accepte JPEG / PNG / WebP jusqu''à 5 Mo, jamais le SVG');
select tests.ok((select not public from storage.buckets where id = 'private-documents'),
  'L''espace des justificatifs est privé');

insert into storage.objects (bucket_id, name) values
  ('public-media', 'articles/2026/11/photo-non-publiee.webp'),
  ('private-documents', 'justificatifs/2026/11/recu.pdf');

set local role anon;
select tests.ok((select count(*) from storage.objects) = 0,
  'Un visiteur ne peut pas lister les fichiers (une photo non publiée reste introuvable)');
select tests.fails($$insert into storage.objects (bucket_id, name) values ('public-media', 'x.webp')$$,
  'Un visiteur ne peut rien envoyer', '42501');
select tests.fails('select * from public.media', 'Un visiteur ne lit pas la médiathèque', '42501');
reset role;

set local role authenticated;
select tests.login_as('00000000-0000-0000-0000-00000000000c', 'aal1');
select tests.ok((select count(*) from storage.objects) = 1,
  'L''équipe liste les fichiers publics, pas les justificatifs');
select tests.ok(
  tests.affected($$insert into storage.objects (bucket_id, name) values ('public-media', 'articles/2026/11/nouvelle.webp')$$) = 1,
  'Un éditeur envoie une photo');
select tests.fails($$insert into storage.objects (bucket_id, name) values ('private-documents', 'justificatifs/faux.pdf')$$,
  'Un éditeur ne peut pas envoyer dans l''espace privé', '42501');
select tests.ok(
  tests.affected($$delete from storage.objects where name = 'articles/2026/11/photo-non-publiee.webp'$$) = 0,
  'Un éditeur ne supprime pas de fichier');

insert into public.media (bucket, storage_path, file_name, file_type, file_size, uploaded_by)
values ('public-media', 'articles/2026/11/nouvelle.webp', 'IMG_2041.webp', 'image/webp', 350000,
        '00000000-0000-0000-0000-00000000000a');
select tests.ok(
  (select uploaded_by from public.media where storage_path = 'articles/2026/11/nouvelle.webp') = '00000000-0000-0000-0000-00000000000c',
  'La médiathèque enregistre qui a vraiment envoyé le fichier');
select tests.fails(
  $$insert into public.media (bucket, storage_path, file_name, file_type, file_size) values ('public-media', 'logos/logo.svg', 'logo.svg', 'image/svg+xml', 1000)$$,
  'Un SVG est refusé dans la médiathèque', '23514');
select tests.fails(
  $$insert into public.media (bucket, storage_path, file_name, file_type, file_size) values ('public-media', 'articles/lourde.jpg', 'lourde.jpg', 'image/jpeg', 6000000)$$,
  'Une image de plus de 5 Mo est refusée', '23514');
select tests.fails(
  $$insert into public.media (bucket, storage_path, file_name, file_type, file_size) values ('private-documents', 'justificatifs/recu2.pdf', 'recu2.pdf', 'application/pdf', 1000)$$,
  'Un éditeur ne peut pas ajouter de justificatif', '42501');
select tests.ok(
  tests.affected($$update public.media set alt_text = 'Formation des femmes à Godomey' where storage_path = 'articles/2026/11/nouvelle.webp'$$) = 1,
  'Un éditeur renseigne le texte alternatif');
select tests.fails($$update public.media set file_size = 1 where storage_path = 'articles/2026/11/nouvelle.webp'$$,
  'Les informations techniques d''un fichier ne sont pas modifiables', '42501');
select tests.ok(tests.affected($$delete from public.media$$) = 0, 'Un éditeur ne supprime pas de média');

select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal2');
select tests.ok((select count(*) from storage.objects) = 3, 'L''admin voit aussi les justificatifs');
select tests.ok(
  tests.affected($$insert into public.media (bucket, storage_path, file_name, file_type, file_size) values ('private-documents', 'justificatifs/2026/11/recu.pdf', 'recu.pdf', 'application/pdf', 1000)$$) = 1,
  'L''admin ajoute un justificatif');
select tests.ok(tests.affected($$delete from public.media where bucket = 'public-media'$$) = 1,
  'L''admin supprime un média');
reset role;

rollback;
