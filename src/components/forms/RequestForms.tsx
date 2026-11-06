"use client";

import type { ReactNode } from "react";
import { Send } from "lucide-react";

import { FieldError } from "@/components/ui/FormField";
import type { OrgContacts } from "@/components/forms/ContactAlternatives";
import { FORM_IDS } from "@/components/forms/ids";
import { EmailField, LineField, NameField, PhoneField, TextAreaField } from "@/components/forms/fields";
import { ConsentField, PublicForm, type FieldHelpers, type FormAction } from "@/components/forms/PublicForm";
import { FORM_TEXT } from "@/content/fr/forms";
import { cn } from "@/lib/cn";
import { LIMITS, PARTNERSHIP_KINDS } from "@/lib/validation/forms";

/**
 * Formulaires de demande (contact et « Nous rejoindre »). Composants client :
 * l'action serveur et la partie sécurité (FormGuard) sont fournies par la page.
 * Seules les données utiles sont demandées.
 */
type RequestFormProps = {
  action: FormAction;
  security: ReactNode;
  contacts: OrgContacts;
};

const F = FORM_TEXT.fields;
const ROW = "grid gap-6 sm:grid-cols-2";

const sendIcon = <Send aria-hidden="true" />;

export function ContactForm({ action, security, contacts }: RequestFormProps) {
  return (
    <PublicForm
      id={FORM_IDS.contact}
      action={action}
      security={security}
      contacts={contacts}
      submitLabel={FORM_TEXT.common.send}
      submitIcon={sendIcon}
      resetHref="/contact"
    >
      {(field) => (
        <>
          <div className={ROW}>
            <NameField field={field} />
            <EmailField field={field} />
          </div>
          <PhoneField field={field} />
          <LineField field={field} name="subject" label={F.subject} required maxLength={LIMITS.subject} />
          <TextAreaField field={field} name="message" label={F.message} required maxLength={LIMITS.message} rows={7} />
          <ConsentField field={field} />
        </>
      )}
    </PublicForm>
  );
}

export function VolunteerForm({ action, security, contacts }: RequestFormProps) {
  const V = FORM_TEXT.volunteer;
  return (
    <PublicForm
      id={FORM_IDS.volunteer}
      action={action}
      security={security}
      contacts={contacts}
      submitLabel={FORM_TEXT.common.send}
      submitIcon={sendIcon}
      resetHref="/nous-rejoindre/benevole"
    >
      {(field) => (
        <>
          <div className={ROW}>
            <NameField field={field} />
            <EmailField field={field} />
          </div>
          <PhoneField field={field} required label={V.phoneLabel} />
          <LineField field={field} name="profession" label={F.profession} maxLength={LIMITS.profession} autoComplete="organization-title" />
          <TextAreaField field={field} name="skills" label={V.skills} hint={V.skillsHint} required maxLength={LIMITS.skills} rows={4} />
          <TextAreaField
            field={field}
            name="motivation"
            label={V.motivation}
            hint={V.motivationHint}
            required
            maxLength={LIMITS.motivation}
            rows={5}
          />
          <ConsentField field={field} />
        </>
      )}
    </PublicForm>
  );
}

export function MembershipForm({ action, security, contacts }: RequestFormProps) {
  const M = FORM_TEXT.member;
  return (
    <PublicForm
      id={FORM_IDS.membership}
      action={action}
      security={security}
      contacts={contacts}
      submitLabel={FORM_TEXT.common.send}
      submitIcon={sendIcon}
      resetHref="/nous-rejoindre/membre"
    >
      {(field) => (
        <>
          <div className={ROW}>
            <NameField field={field} />
            <EmailField field={field} />
          </div>
          <PhoneField field={field} required />
          <div className={ROW}>
            <LineField field={field} name="city" label={F.city} required maxLength={LIMITS.city} autoComplete="address-level2" />
            <LineField field={field} name="profession" label={F.profession} maxLength={LIMITS.profession} autoComplete="organization-title" />
          </div>
          <TextAreaField field={field} name="motivation" label={M.motivation} maxLength={LIMITS.motivation} rows={4} />
          <ConsentField field={field} />
        </>
      )}
    </PublicForm>
  );
}

/** Choix « Partenariat » / « Sponsoring » : vrais boutons radio, présentés en cartes. */
function PartnershipKindField({ field }: { field: FieldHelpers }) {
  const P = FORM_TEXT.partner;
  const error = field.error("partnershipKind");
  const errorId = `${field.id("partnershipKind")}-erreur`;
  const current = field.value("partnershipKind");
  return (
    <fieldset
      role="radiogroup"
      aria-required="true"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className="flex flex-col gap-3"
    >
      <legend className="mb-1 text-small font-semibold text-brand">
        {P.kindLegend}
        <span className="text-danger" aria-hidden="true">
          {" "}
          *
        </span>
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {PARTNERSHIP_KINDS.map((kind) => {
          const id = `${field.id("partnershipKind")}-${kind}`;
          return (
            <label
              key={kind}
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-card border bg-white p-4 transition-colors duration-(--duration-fast)",
                "hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--focus-ring-color)",
                error ? "border-danger" : "border-line-strong",
              )}
            >
              <input
                id={id}
                type="radio"
                name="partnershipKind"
                value={kind}
                defaultChecked={current === kind}
                className="mt-1 size-5 shrink-0 cursor-pointer accent-brand focus-visible:outline-none"
              />
              <span className="flex flex-col">
                <span className="font-semibold text-brand">{P.kinds[kind].label}</span>
                <span className="text-small text-muted">{P.kinds[kind].hint}</span>
              </span>
            </label>
          );
        })}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  );
}

export function PartnerForm({ action, security, contacts }: RequestFormProps) {
  const P = FORM_TEXT.partner;
  return (
    <PublicForm
      id={FORM_IDS.partnership}
      action={action}
      security={security}
      contacts={contacts}
      submitLabel={FORM_TEXT.common.send}
      submitIcon={sendIcon}
      resetHref="/nous-rejoindre/partenaire"
    >
      {(field) => (
        <>
          <div className={ROW}>
            <NameField field={field} label={P.fullName} />
            <EmailField field={field} />
          </div>
          <LineField
            field={field}
            name="organization"
            label={F.organization}
            hint={F.organizationHint}
            required
            maxLength={LIMITS.organization}
            autoComplete="organization"
          />
          <PhoneField field={field} required />
          <PartnershipKindField field={field} />
          <TextAreaField field={field} name="message" label={P.message} hint={P.messageHint} required maxLength={LIMITS.message} rows={6} />
          <ConsentField field={field} />
        </>
      )}
    </PublicForm>
  );
}
