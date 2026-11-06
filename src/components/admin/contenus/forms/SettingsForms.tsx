"use client";

import { useRouter } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { isEmptyDoc, type RichTextDoc } from "@/lib/validation/rich-text";
import { SOCIAL_NETWORKS, type SocialNetwork } from "@/lib/validation/admin/settings";
import { updateSiteSettings } from "@/server/actions/admin/settings";
import type { AdminOfflineInstruction, AdminSiteSettings } from "@/server/data/admin/types";

import { RichTextField } from "../../editor/RichTextField";
import { richTextProblems } from "../../editor/rich-text-filter";
import { ImageField } from "../../media/ImageField";
import { ContentForm } from "../ContentForm";
import { FieldGroup, SelectField, TextAreaField, TextField } from "../fields";
import { amountsToText, fieldError, linesToPoints, unmatchedErrors } from "../form-utils";
import { useActionForm, useFormValues } from "../useActionForm";

/*
 * Paramètres du site : un formulaire par section, chacun n'envoie QUE ses
 * champs (mise à jour partielle de updateSiteSettings).
 */

function useSettingsSection<T extends Record<string, unknown>>(initial: T) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const form = useActionForm(formRef);
  const state = useFormValues(initial);
  const save = (input: Record<string, unknown>, success: string) => {
    const snapshot = state.values;
    form.run(() => updateSiteSettings(input), {
      success,
      onSuccess: () => {
        state.markSaved(snapshot);
        router.refresh();
      },
    });
  };
  const e = (key: string) => fieldError(form.errors, key);
  return { formRef, ...form, ...state, save, e };
}

function Section({ id, title, description, children }: { id: string; title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-titre`} className="flex flex-col gap-4 scroll-mt-6" id={id}>
      <div>
        <h2 id={`${id}-titre`} className="text-h3">
          {title}
        </h2>
        {description && <p className="mt-1 max-w-measure text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Aide d'un champ « une ligne = un point » : rappelle la règle et compte les points. */
function pointsHint(value: string, example: string) {
  const count = linesToPoints(value).length;
  return (
    <>
      Une ligne = un point (ex. « {example} »). {count > 0 ? `${count} point${count > 1 ? "s" : ""} actuellement.` : "Aucun point pour l'instant."}
    </>
  );
}

// ---------------------------------------------------------------------------
// Présentation (page À propos)
// ---------------------------------------------------------------------------

export function PresentationSettings({ settings }: { settings: AdminSiteSettings }) {
  const s = useSettingsSection({
    aboutHistory: settings.aboutHistory ?? "",
    vision: settings.vision ?? "",
    mission: settings.mission ?? "",
    objectives: settings.objectives ?? "",
    valuesText: settings.valuesText ?? "",
    approach: settings.approach ?? "",
  });
  const keys = Object.keys(s.values);
  return (
    <Section
      id="presentation"
      title="Présentation de l'ONG"
      description="Textes de la page « À propos », tels que validés par l'ONG (ne rien inventer)."
    >
      <ContentForm
        formRef={s.formRef}
        onSubmit={() => s.save(s.values, "Textes de présentation enregistrés.")}
        feedback={s.feedback}
        feedbackRef={s.feedbackRef}
        extraErrors={unmatchedErrors(s.errors, keys)}
        pending={s.pending}
        dirty={s.dirty}
        submitLabel="Enregistrer la présentation"
      >
        <FieldGroup legend="Textes">
          <TextAreaField
            id="reglages-history"
            label="Historique"
            hint="Laissez une ligne vide entre deux paragraphes."
            max={10000}
            rows={8}
            value={s.values.aboutHistory}
            error={s.e("aboutHistory")}
            onChange={(value) => s.set("aboutHistory", value)}
          />
          <TextAreaField
            id="reglages-vision"
            label="Vision"
            max={5000}
            rows={4}
            value={s.values.vision}
            error={s.e("vision")}
            onChange={(value) => s.set("vision", value)}
          />
          <TextAreaField
            id="reglages-mission"
            label="Missions"
            hint={pointsHint(s.values.mission, "Promouvoir l'éducation des filles")}
            max={5000}
            rows={6}
            value={s.values.mission}
            error={s.e("mission")}
            onChange={(value) => s.set("mission", value)}
          />
          <TextAreaField
            id="reglages-objectives"
            label="Objectifs"
            hint={pointsHint(s.values.objectives, "Former 100 femmes à un métier")}
            max={5000}
            rows={6}
            value={s.values.objectives}
            error={s.e("objectives")}
            onChange={(value) => s.set("objectives", value)}
          />
          <TextAreaField
            id="reglages-values"
            label="Valeurs"
            hint={pointsHint(s.values.valuesText, "Solidarité")}
            max={5000}
            rows={4}
            value={s.values.valuesText}
            error={s.e("valuesText")}
            onChange={(value) => s.set("valuesText", value)}
          />
          <TextAreaField
            id="reglages-approach"
            label="Approche"
            hint={pointsHint(s.values.approach, "Travailler avec les communautés locales")}
            max={5000}
            rows={6}
            value={s.values.approach}
            error={s.e("approach")}
            onChange={(value) => s.set("approach", value)}
          />
        </FieldGroup>
      </ContentForm>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Accueil et section impact
// ---------------------------------------------------------------------------

export function HomeSettings({ settings }: { settings: AdminSiteSettings }) {
  const s = useSettingsSection({
    heroKicker: settings.heroKicker ?? "",
    heroTitle: settings.heroTitle ?? "",
    heroText: settings.heroText ?? "",
    heroImagePath: settings.heroImagePath ?? "",
    heroImageAlt: settings.heroImageAlt ?? "",
    impactTitle: settings.impactTitle ?? "",
    impactText: settings.impactText ?? "",
    impactImagePath: settings.impactImagePath ?? "",
    impactImageAlt: settings.impactImageAlt ?? "",
  });
  return (
    <Section id="accueil" title="Page d'accueil" description="Haut de la page d'accueil et section « Impact ». Laissés vides, les textes par défaut du site sont affichés.">
      <ContentForm
        formRef={s.formRef}
        onSubmit={() => s.save(s.values, "Page d'accueil enregistrée.")}
        feedback={s.feedback}
        feedbackRef={s.feedbackRef}
        extraErrors={unmatchedErrors(s.errors, Object.keys(s.values))}
        pending={s.pending}
        dirty={s.dirty}
        submitLabel="Enregistrer l'accueil"
      >
        <FieldGroup legend="Haut de la page">
          <TextField
            id="reglages-hero-kicker"
            label="Surtitre"
            hint="Petite ligne au-dessus du titre."
            max={80}
            value={s.values.heroKicker}
            error={s.e("heroKicker")}
            onChange={(value) => s.set("heroKicker", value)}
          />
          <TextField
            id="reglages-hero-title"
            label="Titre"
            max={120}
            value={s.values.heroTitle}
            error={s.e("heroTitle")}
            onChange={(value) => s.set("heroTitle", value)}
          />
          <TextAreaField
            id="reglages-hero-text"
            label="Texte"
            max={400}
            rows={3}
            value={s.values.heroText}
            error={s.e("heroText")}
            onChange={(value) => s.set("heroText", value)}
          />
          <ImageField
            label="Photo du haut de la page"
            hint="Une vraie photo de l'ONG, au format paysage."
            folder="site"
            path={s.values.heroImagePath}
            alt={s.values.heroImageAlt}
            pathError={s.e("heroImagePath")}
            altError={s.e("heroImageAlt")}
            onChange={(value) => s.patch({ heroImagePath: value.path, heroImageAlt: value.alt })}
          />
        </FieldGroup>
        <FieldGroup legend="Section « Impact »">
          <TextField
            id="reglages-impact-title"
            label="Titre"
            max={120}
            value={s.values.impactTitle}
            error={s.e("impactTitle")}
            onChange={(value) => s.set("impactTitle", value)}
          />
          <TextAreaField
            id="reglages-impact-text"
            label="Texte"
            max={1500}
            rows={5}
            value={s.values.impactText}
            error={s.e("impactText")}
            onChange={(value) => s.set("impactText", value)}
          />
          <ImageField
            label="Photo de la section"
            folder="site"
            path={s.values.impactImagePath}
            alt={s.values.impactImageAlt}
            pathError={s.e("impactImagePath")}
            altError={s.e("impactImageAlt")}
            onChange={(value) => s.patch({ impactImagePath: value.path, impactImageAlt: value.alt })}
          />
        </FieldGroup>
      </ContentForm>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Coordonnées et réseaux sociaux
// ---------------------------------------------------------------------------

const NETWORK_LABELS: Record<SocialNetwork, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  x: "X (Twitter)",
  tiktok: "TikTok",
  whatsapp: "WhatsApp (lien de chaîne ou de groupe)",
};

export function ContactSettings({ settings }: { settings: AdminSiteSettings }) {
  const s = useSettingsSection({
    contactEmail: settings.contactEmail ?? "",
    contactPhone: settings.contactPhone ?? "",
    whatsappNumber: settings.whatsappNumber ?? "",
    address: settings.address ?? "",
    ...(Object.fromEntries(SOCIAL_NETWORKS.map((name) => [`social_${name}`, settings.socialLinks[name] ?? ""])) as Record<
      `social_${SocialNetwork}`,
      string
    >),
  });
  const keys = ["contactEmail", "contactPhone", "whatsappNumber", "address", ...SOCIAL_NETWORKS.map((name) => `socialLinks.${name}`)];

  function submit() {
    const socialLinks = Object.fromEntries(SOCIAL_NETWORKS.map((name) => [name, s.values[`social_${name}`]]));
    s.save(
      {
        contactEmail: s.values.contactEmail,
        contactPhone: s.values.contactPhone,
        whatsappNumber: s.values.whatsappNumber,
        address: s.values.address,
        socialLinks,
      },
      "Coordonnées enregistrées.",
    );
  }

  return (
    <Section id="coordonnees" title="Coordonnées et réseaux sociaux" description="Affichés en haut et en bas de chaque page, et sur la page Contact.">
      <ContentForm
        formRef={s.formRef}
        onSubmit={submit}
        feedback={s.feedback}
        feedbackRef={s.feedbackRef}
        extraErrors={unmatchedErrors(s.errors, keys)}
        pending={s.pending}
        dirty={s.dirty}
        submitLabel="Enregistrer les coordonnées"
      >
        <FieldGroup legend="Coordonnées">
          <TextField
            id="reglages-email"
            type="email"
            label="Adresse email"
            autoComplete="off"
            value={s.values.contactEmail}
            error={s.e("contactEmail")}
            onChange={(value) => s.set("contactEmail", value)}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="reglages-phone"
              type="tel"
              label="Téléphone"
              hint="Avec l'indicatif, ex. +229 01 00 00 00 00."
              max={30}
              value={s.values.contactPhone}
              error={s.e("contactPhone")}
              onChange={(value) => s.set("contactPhone", value)}
            />
            <TextField
              id="reglages-whatsapp"
              type="tel"
              label="Numéro WhatsApp"
              hint="Indicatif et numéro, sans espace obligatoire."
              value={s.values.whatsappNumber}
              error={s.e("whatsappNumber")}
              onChange={(value) => s.set("whatsappNumber", value)}
            />
          </div>
          <TextAreaField
            id="reglages-address"
            label="Adresse postale"
            max={500}
            rows={3}
            value={s.values.address}
            error={s.e("address")}
            onChange={(value) => s.set("address", value)}
          />
        </FieldGroup>
        <FieldGroup legend="Réseaux sociaux" description="Adresse complète de chaque page, commençant par https://. Laissez vide un réseau non utilisé.">
          <div className="grid gap-5 sm:grid-cols-2">
            {SOCIAL_NETWORKS.map((name) => (
              <TextField
                key={name}
                id={`reglages-social-${name}`}
                type="url"
                label={NETWORK_LABELS[name]}
                max={500}
                value={s.values[`social_${name}`]}
                error={s.e(`socialLinks.${name}`)}
                onChange={(value) => s.set(`social_${name}`, value)}
              />
            ))}
          </div>
        </FieldGroup>
      </ContentForm>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Dons
// ---------------------------------------------------------------------------

type InstructionValue = { method: AdminOfflineInstruction["method"]; label: string; holder: string; number: string; note: string };

const MAX_INSTRUCTIONS = 6;

export function DonationSettings({ settings }: { settings: AdminSiteSettings }) {
  const s = useSettingsSection({
    donationMinAmount: settings.donationMinAmount ? String(settings.donationMinAmount) : "",
    donationSuggestedAmounts: amountsToText(settings.donationSuggestedAmounts),
    offlineDonationInstructions: settings.offlineDonationInstructions.map(
      (item): InstructionValue => ({
        method: item.method,
        label: item.label ?? "",
        holder: item.holder ?? "",
        number: item.number ?? "",
        note: item.note ?? "",
      }),
    ),
  });
  const instructions = s.values.offlineDonationInstructions;
  const setInstruction = (index: number, next: Partial<InstructionValue>) =>
    s.set(
      "offlineDonationInstructions",
      instructions.map((item, current) => (current === index ? { ...item, ...next } : item)),
    );
  const keys = [
    "donationMinAmount",
    "donationSuggestedAmounts",
    ...instructions.flatMap((_, index) => ["method", "label", "holder", "number", "note"].map((key) => `offlineDonationInstructions.${index}.${key}`)),
  ];

  return (
    <Section id="dons" title="Dons" description="Montants proposés sur la page « Faire un don » et consignes pour donner sans paiement en ligne.">
      <ContentForm
        formRef={s.formRef}
        onSubmit={() => s.save(s.values, "Réglages des dons enregistrés.")}
        feedback={s.feedback}
        feedbackRef={s.feedbackRef}
        extraErrors={unmatchedErrors(s.errors, keys)}
        pending={s.pending}
        dirty={s.dirty}
        submitLabel="Enregistrer les dons"
      >
        <FieldGroup legend="Montants (en francs CFA)">
          <TextField
            id="reglages-min-amount"
            label="Montant minimum d'un don en ligne"
            hint="Nombre entier, ex. 500. Laissé vide : 100 FCFA."
            inputMode="numeric"
            value={s.values.donationMinAmount}
            error={s.e("donationMinAmount")}
            onChange={(value) => s.set("donationMinAmount", value)}
          />
          <TextField
            id="reglages-suggested"
            label="Montants suggérés"
            hint="Jusqu'à 8 montants séparés par un point-virgule, ex. 2000 ; 5000 ; 10000."
            value={s.values.donationSuggestedAmounts}
            error={s.e("donationSuggestedAmounts")}
            onChange={(value) => s.set("donationSuggestedAmounts", value)}
          />
        </FieldGroup>

        <FieldGroup
          legend="Dons hors ligne (Mobile Money, virement)"
          description="Ces consignes sont affichées sur la page de don. Vérifiez chaque numéro : une erreur enverrait l'argent à quelqu'un d'autre."
        >
          {instructions.length === 0 && <p className="text-muted">Aucun moyen de paiement hors ligne pour l&apos;instant.</p>}
          <ol className="flex flex-col gap-5">
            {instructions.map((item, index) => {
              const key = (field: string) => `offlineDonationInstructions.${index}.${field}`;
              return (
                <li key={index} className="flex flex-col gap-4 rounded-card border border-line bg-ivory p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-brand">Moyen n° {index + 1}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      iconLeft={<Trash2 />}
                      onClick={() => s.set("offlineDonationInstructions", instructions.filter((_, current) => current !== index))}
                    >
                      Retirer le moyen n° {index + 1}
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SelectField
                      id={`reglages-offline-${index}-method`}
                      label="Type"
                      required
                      options={[
                        { value: "mobile_money", label: "Mobile Money" },
                        { value: "bank_transfer", label: "Virement bancaire" },
                      ]}
                      value={item.method}
                      error={s.e(key("method"))}
                      onChange={(value) => setInstruction(index, { method: value as InstructionValue["method"] })}
                    />
                    <TextField
                      id={`reglages-offline-${index}-label`}
                      label="Intitulé"
                      hint="Ex. MTN Mobile Money, Banque…"
                      required
                      max={80}
                      value={item.label}
                      error={s.e(key("label"))}
                      onChange={(value) => setInstruction(index, { label: value })}
                    />
                    <TextField
                      id={`reglages-offline-${index}-holder`}
                      label="Titulaire du compte"
                      max={120}
                      value={item.holder}
                      error={s.e(key("holder"))}
                      onChange={(value) => setInstruction(index, { holder: value })}
                    />
                    <TextField
                      id={`reglages-offline-${index}-number`}
                      label={item.method === "bank_transfer" ? "IBAN ou numéro de compte" : "Numéro"}
                      max={60}
                      value={item.number}
                      error={s.e(key("number"))}
                      onChange={(value) => setInstruction(index, { number: value })}
                    />
                  </div>
                  <TextAreaField
                    id={`reglages-offline-${index}-note`}
                    label="Précision (facultative)"
                    hint="Ex. indiquer « Don » et votre nom en motif."
                    max={300}
                    rows={2}
                    value={item.note}
                    error={s.e(key("note"))}
                    onChange={(value) => setInstruction(index, { note: value })}
                  />
                </li>
              );
            })}
          </ol>
          {instructions.length < MAX_INSTRUCTIONS && (
            <div>
              <Button
                variant="secondary"
                size="sm"
                iconLeft={<Plus />}
                onClick={() =>
                  s.set("offlineDonationInstructions", [
                    ...instructions,
                    { method: "mobile_money", label: "", holder: "", number: "", note: "" },
                  ])
                }
              >
                Ajouter un moyen de paiement
              </Button>
            </div>
          )}
        </FieldGroup>
      </ContentForm>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Pages légales
// ---------------------------------------------------------------------------

export function LegalSettings({ settings }: { settings: AdminSiteSettings }) {
  const s = useSettingsSection<{ legalNotice: RichTextDoc | null; privacyPolicy: RichTextDoc | null }>({
    legalNotice: settings.legalNotice,
    privacyPolicy: settings.privacyPolicy,
  });

  function submit() {
    const problems = {
      legalNotice: s.values.legalNotice ? richTextProblems(s.values.legalNotice) : [],
      privacyPolicy: s.values.privacyPolicy ? richTextProblems(s.values.privacyPolicy) : [],
    };
    if (problems.legalNotice.length || problems.privacyPolicy.length) {
      s.setErrors(problems);
      s.setFeedback({ tone: "error", message: "Certaines informations sont à corriger." });
      return;
    }
    // Un texte vide est enregistré comme « non renseigné » (la page publique affiche un état propre).
    const clean = (doc: RichTextDoc | null) => (doc && !isEmptyDoc(doc) ? doc : null);
    s.save({ legalNotice: clean(s.values.legalNotice), privacyPolicy: clean(s.values.privacyPolicy) }, "Pages légales enregistrées.");
  }

  return (
    <Section
      id="legal"
      title="Mentions légales et confidentialité"
      description="Textes des pages /mentions-legales et /politique-de-confidentialite, à faire valider par l'ONG."
    >
      <ContentForm
        formRef={s.formRef}
        onSubmit={submit}
        feedback={s.feedback}
        feedbackRef={s.feedbackRef}
        extraErrors={unmatchedErrors(s.errors, ["legalNotice", "privacyPolicy"])}
        pending={s.pending}
        dirty={s.dirty}
        submitLabel="Enregistrer les pages légales"
      >
        <FieldGroup legend="Mentions légales">
          <RichTextField
            label="Texte des mentions légales"
            hint="Éditeur du site, responsable de la publication, hébergeur…"
            value={s.values.legalNotice}
            error={s.e("legalNotice")}
            folder="site"
            onChange={(doc) => s.set("legalNotice", doc)}
          />
        </FieldGroup>
        <FieldGroup legend="Politique de confidentialité">
          <RichTextField
            label="Texte de la politique de confidentialité"
            hint="Données collectées (formulaires, dons, newsletter), durée de conservation, droits des personnes."
            value={s.values.privacyPolicy}
            error={s.e("privacyPolicy")}
            folder="site"
            onChange={(doc) => s.set("privacyPolicy", doc)}
          />
        </FieldGroup>
      </ContentForm>
    </Section>
  );
}
