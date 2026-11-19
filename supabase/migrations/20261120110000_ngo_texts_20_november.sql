-- =====================================================================
-- INA-AFRICA — Textes transmis par l'ONG les 19-20/11/2026 (saisis en base
-- car ils remplacent des valeurs de l'administration) :
--  * texte du haut de l'accueil ;
--  * texte « Impact » (accroche sur la première ligne) ;
--  * titre de l'appel aux dons (l'adresse de la page ne change pas).
-- Chaque mise à jour ne s'applique qu'à l'ancienne valeur.
-- =====================================================================
update public.site_settings
set hero_text = 'INA-AFRICA : agir au cœur des communautés pour libérer les potentiels et bâtir un avenir juste, inclusif et durable en Afrique.'
where id = 1 and hero_text = 'INA-AFRICA, une organisation engagée pour l''autonomisation des communautés en Afrique.';

update public.site_settings
set impact_text = E'Une approche participative, un impact durable sur le terrain.\nDepuis sa création, INA-AFRICA place la dignité humaine et l''inclusion au cœur de ses priorités. Nous accompagnons les enfants vulnérables et les orphelins vers un avenir meilleur par le soutien scolaire et matériel. Nous œuvrons également à la formation et à l''insertion professionnelle des jeunes, tout en autonomisant les femmes rurales, les veuves, les filles-mères et les personnes en situation de handicap. Engagée pour le développement rural et la sensibilisation aux droits et à la santé sexuels et reproductifs, notre organisation co-construit chaque projet avec les communautés locales pour garantir des changements profonds et pérennes.'
where id = 1 and impact_text like E'Une approche participative, un impact durable sur le terrain.\nDepuis sa création, INA-AFRICA agit pour la dignité%';

update public.donation_campaigns
set title = 'Ensemble, offrons un avenir meilleur aux enfants du monde entier'
where title = 'Ensemble, offrons un avenir meilleur aux enfants de Cotonou';
