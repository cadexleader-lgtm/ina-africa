-- =====================================================================
-- INA-AFRICA — Index des clés étrangères signalées par l'outil de
-- performance de Supabase (suppression d'un profil plus rapide).
-- =====================================================================

create index donation_campaigns_created_by_idx on public.donation_campaigns (created_by);
create index site_settings_updated_by_idx on public.site_settings (updated_by);
create index user_roles_granted_by_idx on public.user_roles (granted_by);
