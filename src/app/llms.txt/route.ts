import { ACHIEVEMENTS, AREAS, CONTACTS, DIRECT_DONATIONS, IDENTITY } from "@/content/fr/ina-africa";
import { absoluteUrl } from "@/lib/site-url";

/**
 * /llms.txt : résumé fiable de l'ONG pour les assistants (ChatGPT, Perplexity,
 * Gemini…), au format https://llmstxt.org. Uniquement le contenu officiel
 * transmis par l'ONG (src/content/fr/ina-africa.ts), jamais de chiffre inventé.
 */
export function GET() {
  const actions = ACHIEVEMENTS.filter((action) => action.date)
    .map((action) => `- ${action.date} : ${action.title}${action.place ? ` (${action.place})` : ""}`)
    .join("\n");
  const areas = AREAS.map((area) => `- [${area.title}](${absoluteUrl(`/domaines/${area.slug}`)})`).join("\n");
  const mobileMoney = DIRECT_DONATIONS.instructions.map((item) => `${item.label} : ${item.number}`).join(" ; ");

  const body = `# ${IDENTITY.name}

> ${IDENTITY.name} (${IDENTITY.fullName}) est une organisation non gouvernementale (ONG) béninoise, fondée en ${IDENTITY.foundedYear} et basée à Cotonou. Elle agit pour l'éducation, la santé et les droits en santé sexuelle et reproductive, l'autonomisation des femmes et des filles mères, la jeunesse, l'inclusion et le développement local au Bénin.

## Soutenir l'ONG
- [Faire un don](${absoluteUrl("/faire-un-don")}) : par Mobile Money (${mobileMoney}) dès ${DIRECT_DONATIONS.minAmount} FCFA.
- [Nos besoins](${absoluteUrl("/nos-besoins")}) : les besoins actuels de l'ONG et leurs objectifs.
- [Devenir membre](${absoluteUrl("/nous-rejoindre/membre")}), [devenir bénévole](${absoluteUrl("/nous-rejoindre/benevole")}), [devenir partenaire](${absoluteUrl("/nous-rejoindre/partenaire")}).

## Présentation
- [Qui sommes-nous ?](${absoluteUrl("/a-propos")}) : histoire, vision, missions, équipe.
- [Projets et actions](${absoluteUrl("/projets")}) : actions menées sur le terrain, classées par domaine.
- [Actualités](${absoluteUrl("/actualites")})

## Domaines d'action
${areas}

## Actions datées
${actions}

## Contact
- Adresse : ${CONTACTS.address.replace(/\n/g, ", ")}
- Email : ${CONTACTS.email}
- Téléphone et WhatsApp : ${CONTACTS.phone}
- [Page de contact](${absoluteUrl("/contact")})
`;

  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
