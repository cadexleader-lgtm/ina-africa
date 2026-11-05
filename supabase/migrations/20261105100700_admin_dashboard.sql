-- =====================================================================
-- INA-AFRICA — 8/9 Chiffres du tableau de bord
-- Les montants des dons en ligne viennent UNIQUEMENT des transactions
-- réussies et vérifiées (jamais des simples demandes de paiement).
-- Dons en ligne et hors ligne sont toujours comptés séparément.
-- =====================================================================

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
  online_count bigint;
  online_amount bigint;
  offline_count bigint;
  offline_amount bigint;
begin
  if not private.has_role('editor') then
    raise exception 'Accès refusé.' using errcode = '42501', hint = 'ina-africa';
  end if;

  -- Chiffres de contenu : visibles par toute l'équipe.
  select jsonb_build_object(
    'articles', jsonb_build_object(
      'published', count(*) filter (where status = 'published'),
      'in_review', count(*) filter (where status = 'in_review'),
      'draft', count(*) filter (where status = 'draft')
    )
  ) into result
  from public.articles;

  result := result || jsonb_build_object(
    'projects_published', (select count(*) from public.projects where is_published)
  );

  -- Dons, demandes, newsletter : réservés aux admins.
  if private.has_role('admin') then
    select count(*), coalesce(sum(amount), 0)
      into online_count, online_amount
      from public.payment_transactions
     where status = 'succeeded' and verified_at is not null;

    select count(*), coalesce(sum(amount), 0)
      into offline_count, offline_amount
      from public.donations
     where channel = 'offline' and payment_status = 'paid';

    result := result || jsonb_build_object(
      'donations', jsonb_build_object(
        'online', jsonb_build_object('count', online_count, 'amount', online_amount),
        'offline', jsonb_build_object('count', offline_count, 'amount', offline_amount),
        'total_amount', online_amount + offline_amount,
        'currency', 'XOF'
      ),
      'campaigns_active', (select count(*) from public.donation_campaigns where is_active),
      'requests_unread', (
        select jsonb_build_object(
          'contact', count(*) filter (where request_type = 'contact'),
          'volunteer', count(*) filter (where request_type = 'volunteer'),
          'membership', count(*) filter (where request_type = 'membership'),
          'sponsorship', count(*) filter (where request_type = 'sponsorship')
        )
        from public.contact_requests
        where status = 'unread'
      ),
      'newsletter_subscribed', (
        select count(*) from public.newsletter_subscribers where status = 'subscribed'
      )
    );
  end if;

  return result;
end;
$$;

revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated, service_role;
