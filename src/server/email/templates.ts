import "server-only";

import { FORM_TEXT } from "@/content/fr/forms";
import { ORG } from "@/content/fr/site";
import { safeSubject } from "@/server/email";

/**
 * Contenu des emails, en TEXTE BRUT. Les saisies des visiteurs y sont
 * recopiées telles quelles (déjà nettoyées par la validation) : en texte
 * brut, elles ne peuvent pas être interprétées comme du HTML.
 */

export type RequestType = keyof typeof FORM_TEXT.emails.requestTypes;

export type RequestNotification = {
  type: RequestType;
  fullName: string;
  email: string | null;
  phone: string | null;
  organization?: string | null;
  subject?: string | null;
  message?: string | null;
  /** Champs propres au type (libellé → valeur), dans l'ordre d'affichage. */
  details: [label: string, value: string][];
  receivedAt: Date;
};

const DATE_TIME = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Africa/Porto-Novo",
});

function line(label: string, value: string | null | undefined): string | null {
  return value ? `${label} : ${value}` : null;
}

function block(label: string, value: string | null | undefined): string | null {
  return value ? `${label} :\n${value}` : null;
}

export function requestNotificationEmail(request: RequestNotification): { subject: string; text: string } {
  const typeLabel = FORM_TEXT.emails.requestTypes[request.type];
  const subject = safeSubject(`[${ORG.name}] ${typeLabel} — ${request.fullName}`);

  const sections = [
    `Nouvelle demande reçue sur le site ${ORG.name}.`,
    [line("Type", typeLabel), line("Reçue le", `${DATE_TIME.format(request.receivedAt)} (heure du Bénin)`)]
      .filter(Boolean)
      .join("\n"),
    [
      line("Nom", request.fullName),
      line("Email", request.email),
      line("Téléphone", request.phone),
      line("Organisation", request.organization),
      line("Sujet", request.subject),
      ...request.details.filter(([, value]) => !value.includes("\n")).map(([label, value]) => line(label, value)),
    ]
      .filter(Boolean)
      .join("\n"),
    ...request.details.filter(([, value]) => value.includes("\n")).map(([label, value]) => block(label, value)),
    block("Message", request.message),
    [
      "—",
      request.email
        ? "Répondre à cet email écrit directement à la personne."
        : "La personne n'a pas donné d'email : contactez-la par téléphone.",
      "La demande est aussi enregistrée dans la boîte de réception du site.",
    ].join("\n"),
  ].filter((section): section is string => Boolean(section));

  return { subject, text: sections.join("\n\n") };
}

export function newsletterConfirmationEmail(links: { confirmUrl: string; unsubscribeUrl: string }): {
  subject: string;
  text: string;
} {
  const text = [
    "Bonjour,",
    `Vous avez demandé à recevoir la lettre d'information d'${ORG.name} (${ORG.fullName}).`,
    `Pour confirmer votre inscription, ouvrez ce lien puis cliquez sur « ${FORM_TEXT.newsletter.confirmAction} » :\n${links.confirmUrl}`,
    "Ce lien est valable 7 jours.",
    "Vous n'êtes pas à l'origine de cette demande ? Ignorez simplement cet email : aucune inscription ne sera faite.",
    `Pour ne plus recevoir nos emails :\n${links.unsubscribeUrl}`,
    ORG.name,
  ].join("\n\n");
  return { subject: safeSubject(FORM_TEXT.emails.newsletterSubject), text };
}
