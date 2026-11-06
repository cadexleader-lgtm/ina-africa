"use server";

import { FORM_KEYS } from "@/components/forms/ids";
import { FORM_TEXT } from "@/content/fr/forms";
import {
  contactSchema,
  membershipSchema,
  partnerSchema,
  volunteerSchema,
  type FormState,
} from "@/lib/validation/forms";
import { compactDetails, handleRequestForm } from "@/server/actions/public-form";

/*
 * Actions des formulaires « Contact » et « Nous rejoindre ». Chacune est un
 * point d'entrée PUBLIC (n'importe qui peut l'appeler) : tout est revalidé
 * ici, rien n'est déduit du navigateur. Écriture dans contact_requests avec
 * le client privilégié (les visiteurs n'ont aucun droit sur cette table).
 */

const F = FORM_TEXT.fields;

export async function submitContact(_previous: FormState, formData: FormData): Promise<FormState> {
  return handleRequestForm(formData, {
    formKey: FORM_KEYS.contact,
    fields: ["fullName", "email", "phone", "subject", "message", "consent"],
    schema: contactSchema,
    toRow: (data) => ({
      request_type: "contact",
      full_name: data.fullName,
      email: data.email,
      phone: data.phone ?? null,
      subject: data.subject,
      message: data.message,
      details: {},
    }),
    detailLabels: {},
    successMessage: FORM_TEXT.contact.success,
  });
}

export async function submitVolunteer(_previous: FormState, formData: FormData): Promise<FormState> {
  return handleRequestForm(formData, {
    formKey: FORM_KEYS.volunteer,
    fields: ["fullName", "email", "phone", "profession", "skills", "motivation", "consent"],
    schema: volunteerSchema,
    toRow: (data) => ({
      request_type: "volunteer",
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      message: data.motivation,
      details: compactDetails({ profession: data.profession, skills: data.skills }),
    }),
    detailLabels: { profession: F.profession, skills: FORM_TEXT.volunteer.skills },
    successMessage: FORM_TEXT.volunteer.success,
  });
}

export async function submitMembership(_previous: FormState, formData: FormData): Promise<FormState> {
  return handleRequestForm(formData, {
    formKey: FORM_KEYS.membership,
    fields: ["fullName", "email", "phone", "city", "profession", "motivation", "consent"],
    schema: membershipSchema,
    toRow: (data) => ({
      request_type: "membership",
      full_name: data.fullName,
      email: data.email,
      phone: data.phone,
      message: data.motivation ?? null,
      details: compactDetails({ city: data.city, profession: data.profession }),
    }),
    detailLabels: { city: F.city, profession: F.profession },
    successMessage: FORM_TEXT.member.success,
  });
}

export async function submitPartnership(_previous: FormState, formData: FormData): Promise<FormState> {
  return handleRequestForm(formData, {
    formKey: FORM_KEYS.partnership,
    fields: ["fullName", "organization", "email", "phone", "partnershipKind", "message", "consent"],
    schema: partnerSchema,
    toRow: (data) => ({
      request_type: "sponsorship",
      full_name: data.fullName,
      organization: data.organization,
      email: data.email,
      phone: data.phone,
      message: data.message,
      details: { kind: data.partnershipKind },
    }),
    detailLabels: { kind: FORM_TEXT.partner.kindLegend },
    detailValueLabels: {
      kind: {
        partnership: FORM_TEXT.partner.kinds.partnership.label,
        sponsorship: FORM_TEXT.partner.kinds.sponsorship.label,
      },
    },
    successMessage: FORM_TEXT.partner.success,
  });
}
