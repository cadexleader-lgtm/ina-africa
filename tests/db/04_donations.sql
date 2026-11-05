-- Dons en ligne et hors ligne : qui peut écrire, double encaissement
-- impossible, notifications répétées sans effet, totaux justes.
-- Identifiants :
--   appel aux dons 1…01 · dons en ligne 2…01, 2…02 · transactions 3…0x
begin;

-- Un admin crée un appel aux dons
set local role authenticated;
select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal2');
insert into public.donation_campaigns (id, title, slug, is_active, show_progress, goal_amount, share_message)
values ('10000000-0000-0000-0000-000000000001', 'Rentrée scolaire', 'rentree-scolaire', true, true, 1000000,
        'Aidez-nous à équiper 100 élèves pour la rentrée');
select tests.ok(
  (select created_by from public.donation_campaigns where slug = 'rentree-scolaire') = '00000000-0000-0000-0000-00000000000b',
  'L''appel aux dons garde son créateur');
select tests.fails(
  $$insert into public.donations (channel, amount, donor_email, consent_at) values ('online', 5000, 'a@b.co', now())$$,
  'Même un admin ne peut pas créer un don directement', '42501');
reset role;

-- Visiteur
set local role anon;
select tests.fails(
  $$insert into public.donations (channel, amount, donor_email, consent_at) values ('online', 5000, 'a@b.co', now())$$,
  'Un visiteur ne peut pas créer de don directement', '42501');
select tests.fails('select * from public.donations', 'Un visiteur ne voit pas les dons', '42501');
select tests.fails($$select public.confirm_payment_transaction(gen_random_uuid(), 'x', 1, 'XOF')$$,
  'Un visiteur ne peut pas confirmer un paiement', '42501');
select tests.ok((select count(*) from public.donation_campaigns) = 1, 'Les visiteurs voient l''appel aux dons actif');
reset role;

-- Le serveur crée un don en ligne et une tentative de paiement
set local role service_role;
insert into public.donations (id, channel, amount, donor_name, donor_email, consent_at, campaign_id, utm_source, utm_medium)
values ('20000000-0000-0000-0000-000000000001', 'online', 10000, 'Koffi', 'koffi@example.org', now(),
        '10000000-0000-0000-0000-000000000001', 'whatsapp', 'partage');
select tests.ok(
  (select reference ~ '^DON-[0-9]{4}-[0-9]{6}$' from public.donations where id = '20000000-0000-0000-0000-000000000001'),
  'Chaque don reçoit une référence lisible (DON-AAAA-000001)');
select tests.ok(
  (select utm_source = 'whatsapp' from public.donations where id = '20000000-0000-0000-0000-000000000001'),
  'La provenance du don (lien WhatsApp, pub…) est conservée');
select tests.fails(
  $$insert into public.donations (channel, amount, donor_name, consent_at) values ('online', 5000, 'Sans contact', now())$$,
  'Un don en ligne sans email ni téléphone est refusé', '23514');
select tests.fails(
  $$insert into public.donations (channel, amount, donor_email, consent_at, currency) values ('online', 5000, 'a@b.co', now(), 'EUR')$$,
  'Seul le franc CFA (XOF) est accepté', '23514');
select tests.fails(
  $$insert into public.donations (channel, amount, donor_email, consent_at) values ('online', 0, 'a@b.co', now())$$,
  'Un montant nul est refusé', '23514');

insert into public.payment_transactions (id, donation_id, provider, merchant_reference, amount)
values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'kkiapay', 'INA-TX-0001', 10000);
select tests.fails(
  $$insert into public.payment_transactions (donation_id, provider, merchant_reference, amount) values ('20000000-0000-0000-0000-000000000001', 'kkiapay', 'INA-TX-9999', 999)$$,
  'Une transaction d''un autre montant que le don est refusée', '23514');
select tests.fails(
  $$update public.payment_transactions set status = 'succeeded' where id = '30000000-0000-0000-0000-000000000001'$$,
  'Une transaction ne peut pas réussir sans vérification', '23514');

select tests.fails(
  $$select public.confirm_payment_transaction('30000000-0000-0000-0000-000000000001', 'KKIA-123', 9000, 'XOF')$$,
  'Un montant confirmé différent de celui du don est refusé', 'P0001');
select tests.ok(
  public.confirm_payment_transaction('30000000-0000-0000-0000-000000000001', 'KKIA-123', 10000, 'XOF', 'mobile_money') = 'confirmed',
  'Le serveur confirme un paiement vérifié auprès du prestataire');
select tests.ok(
  (select payment_status = 'paid' and paid_at is not null and provider = 'kkiapay'
     from public.donations where id = '20000000-0000-0000-0000-000000000001'),
  'Le don passe à « payé »');
select tests.ok(
  public.confirm_payment_transaction('30000000-0000-0000-0000-000000000001', 'KKIA-123', 10000, 'XOF') = 'already_confirmed',
  'Une notification répétée ne change rien');
select tests.fails(
  $$select public.confirm_payment_transaction('30000000-0000-0000-0000-000000000001', 'KKIA-999', 10000, 'XOF')$$,
  'Une confirmation avec un autre identifiant prestataire est refusée', 'P0001');

insert into public.payment_transactions (id, donation_id, provider, merchant_reference, amount)
values ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'cinetpay', 'INA-TX-0002', 10000);
select tests.fails(
  $$select public.confirm_payment_transaction('30000000-0000-0000-0000-000000000002', 'CINET-1', 10000, 'XOF')$$,
  'Un don déjà payé ne peut pas être encaissé une seconde fois', 'P0001');

-- Deuxième don : réutilisation d'un identifiant, échec puis nouvel essai, remboursement
insert into public.donations (id, channel, amount, donor_phone, consent_at)
values ('20000000-0000-0000-0000-000000000002', 'online', 5000, '+22997000000', now());
insert into public.payment_transactions (id, donation_id, provider, merchant_reference, amount)
values ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'kkiapay', 'INA-TX-0003', 5000);
select tests.fails(
  $$select public.confirm_payment_transaction('30000000-0000-0000-0000-000000000003', 'KKIA-123', 5000, 'XOF')$$,
  'Un identifiant de transaction du prestataire ne sert qu''une fois', '23505');
select tests.ok(
  public.fail_payment_transaction('30000000-0000-0000-0000-000000000003', 'failed', 'Solde insuffisant') = 'closed',
  'Un paiement échoué est enregistré');
select tests.ok(
  (select payment_status from public.donations where id = '20000000-0000-0000-0000-000000000002') = 'failed',
  'Le don sans autre tentative passe en échec');
select tests.ok(
  public.fail_payment_transaction('30000000-0000-0000-0000-000000000003', 'failed') = 'already_closed',
  'Une notification d''échec répétée ne change rien');
insert into public.payment_transactions (id, donation_id, provider, merchant_reference, amount)
values ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'kkiapay', 'INA-TX-0004', 5000);
select public.confirm_payment_transaction('30000000-0000-0000-0000-000000000004', 'KKIA-456', 5000, 'XOF');
select tests.ok(
  (select payment_status from public.donations where id = '20000000-0000-0000-0000-000000000002') = 'paid',
  'Un nouvel essai réussi après un échec rend le don payé');
select tests.ok(
  public.refund_payment_transaction('30000000-0000-0000-0000-000000000004') = 'refunded',
  'Un remboursement vérifié est enregistré');
select tests.ok(
  (select payment_status from public.donations where id = '20000000-0000-0000-0000-000000000002') = 'refunded',
  'Le don remboursé passe à « remboursé »');
reset role;

-- Admin : lecture seule sur les dons en ligne, saisie des dons hors ligne
set local role authenticated;
select tests.login_as('00000000-0000-0000-0000-00000000000b', 'aal2');
select tests.fails(
  $$select public.confirm_payment_transaction('30000000-0000-0000-0000-000000000002', 'X', 10000, 'XOF')$$,
  'Même un admin ne peut pas confirmer un paiement lui-même', '42501');
select tests.fails($$update public.donations set payment_status = 'paid'$$,
  'Même un admin ne peut pas modifier un don', '42501');
select tests.fails($$delete from public.donations$$, 'Même un admin ne peut pas supprimer un don', '42501');

select tests.ok(
  (public.record_offline_donation(
     p_amount => 25000, p_received_on => current_date, p_payment_method => 'mobile_money',
     p_external_reference => 'MTN-777', p_operator_or_bank => 'MTN MoMo',
     p_donor_name => 'Association X', p_campaign_id => '10000000-0000-0000-0000-000000000001'
   )).payment_status = 'paid',
  'L''admin enregistre un don hors ligne, validé directement');
select tests.ok(
  (select recorded_by = '00000000-0000-0000-0000-00000000000b' and channel = 'offline'
     from public.donations where external_reference = 'MTN-777'),
  'Le don hors ligne garde le nom de la personne qui l''a saisi');
select tests.fails(
  $$select public.record_offline_donation(p_amount => 25000, p_received_on => current_date, p_payment_method => 'mobile_money', p_external_reference => 'mtn-777')$$,
  'La même opération Mobile Money ne peut pas être saisie deux fois', '23505');
select tests.fails(
  $$select public.record_offline_donation(p_amount => 1000, p_received_on => current_date + 1, p_payment_method => 'mobile_money')$$,
  'Une date de réception dans le futur est refusée', '22023');
select tests.ok(
  tests.error_hint($$select public.record_offline_donation(p_amount => 1000, p_received_on => current_date + 1, p_payment_method => 'mobile_money')$$) = 'ina-africa',
  'Nos messages d''erreur portent l''indice « ina-africa » (affichables tels quels)');
select tests.fails(
  $$select public.record_offline_donation(p_amount => 1000, p_received_on => current_date, p_payment_method => 'especes')$$,
  'Un mode de réception inconnu est refusé', '22023');
select tests.fails(
  $$select public.record_offline_donation(p_amount => 1000, p_received_on => current_date, p_payment_method => 'bank_transfer', p_proof_path => 'galerie/photo.webp')$$,
  'Le justificatif doit être un fichier de l''espace privé', '22023');

select public.record_offline_donation(p_amount => 3000, p_received_on => current_date, p_payment_method => 'bank_transfer',
  p_idempotency_key => '40000000-0000-0000-0000-000000000001');
select public.record_offline_donation(p_amount => 3000, p_received_on => current_date, p_payment_method => 'bank_transfer',
  p_idempotency_key => '40000000-0000-0000-0000-000000000001');
select tests.ok(
  (select count(*) from public.donations where idempotency_key = '40000000-0000-0000-0000-000000000001') = 1,
  'Un double clic n''enregistre le don hors ligne qu''une seule fois');

select tests.fails(
  $$select public.cancel_offline_donation((select id from public.donations where external_reference = 'MTN-777'), '')$$,
  'Annuler un don hors ligne exige un motif', '22023');
select public.cancel_offline_donation((select id from public.donations where external_reference = 'MTN-777'), 'Erreur de saisie');
select tests.ok(
  (select payment_status = 'cancelled' and cancellation_reason = 'Erreur de saisie'
     from public.donations where external_reference = 'MTN-777'),
  'Un don hors ligne saisi par erreur est annulé, jamais supprimé');
select tests.ok(
  (public.record_offline_donation(
     p_amount => 20000, p_received_on => current_date, p_payment_method => 'mobile_money',
     p_external_reference => 'MTN-777', p_campaign_id => '10000000-0000-0000-0000-000000000001'
   )).payment_status = 'paid',
  'Après annulation, la bonne saisie de la même opération est possible');

-- Tableau de bord : en ligne = transactions réussies ET vérifiées (le
-- remboursement est exclu) ; hors ligne = saisies non annulées.
select tests.ok((public.admin_dashboard_stats() -> 'donations' -> 'online' ->> 'amount')::bigint = 10000,
  'Le total en ligne ne compte que les paiements réussis et vérifiés (remboursement exclu)');
select tests.ok((public.admin_dashboard_stats() -> 'donations' -> 'offline' ->> 'amount')::bigint = 23000,
  'Le total hors ligne exclut les dons annulés');
select tests.ok((public.admin_dashboard_stats() -> 'donations' ->> 'total_amount')::bigint = 33000,
  'Le total général additionne les deux, toujours détaillés séparément');
select tests.ok(
  (select online_amount = 10000 and offline_amount = 20000 and total_amount = 30000 and goal_amount = 1000000
     from public.campaign_progress('10000000-0000-0000-0000-000000000001')),
  'La jauge de l''appel aux dons additionne en ligne et hors ligne');
select tests.fails($$delete from public.donation_campaigns where id = '10000000-0000-0000-0000-000000000001'$$,
  'Un appel aux dons qui a reçu des dons ne peut pas être supprimé (seulement désactivé)', '23503');

-- Éditeur : aucun accès aux dons
select tests.login_as('00000000-0000-0000-0000-00000000000c', 'aal1');
select tests.ok(not (public.admin_dashboard_stats() ? 'donations'), 'Un éditeur ne voit pas les chiffres des dons');
select tests.ok((select count(*) from public.donations) = 0, 'Un éditeur ne voit pas les dons');
select tests.fails(
  $$select public.record_offline_donation(p_amount => 1000, p_received_on => current_date, p_payment_method => 'mobile_money')$$,
  'Un éditeur ne peut pas enregistrer de don', '42501');
reset role;

-- Jauge cachée si l'admin ne l'affiche pas
update public.donation_campaigns set show_progress = false where id = '10000000-0000-0000-0000-000000000001';
set local role anon;
select tests.ok((select count(*) from public.campaign_progress('10000000-0000-0000-0000-000000000001')) = 0,
  'La jauge reste cachée tant que l''admin ne l''a pas activée');
reset role;

select tests.ok(
  (select count(*) from public.audit_logs
    where entity_type = 'donations' and details -> 'payment_status' ->> 'new' = 'paid') >= 2,
  'Chaque passage d''un don à « payé » est tracé');

rollback;
