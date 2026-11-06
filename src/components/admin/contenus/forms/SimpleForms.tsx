"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

import {
  createActionArea,
  createPartner,
  createTeamMember,
  updateActionArea,
  updatePartner,
  updateTeamMember,
} from "@/server/actions/admin/content";
import { DEFAULT_TEAM_GROUP, TEAM_GROUPS, type TeamGroup } from "@/lib/team";
import type { AdminActionArea, AdminPartner, AdminTeamMember } from "@/server/data/admin/types";

import { ImageField } from "../../media/ImageField";
import { ContentForm } from "../ContentForm";
import { FieldGroup, SelectField, TextAreaField, TextField, TitleSlugFields } from "../fields";
import { fieldError, unmatchedErrors } from "../form-utils";
import { PARTNER_KIND_LABELS } from "../labels";
import { useActionForm, useFormValues } from "../useActionForm";

/*
 * Formulaires courts (admin) : domaines d'intervention, partenaires et
 * sponsors, membres de l'équipe. Tout nouvel élément est inactif : il
 * s'active ensuite depuis la liste ou la page d'édition.
 */

function useSaver<T extends Record<string, unknown>>(listHref: string, isNew: boolean, initial: T) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const form = useActionForm(formRef);
  const state = useFormValues(initial);
  const save = <O extends { id: string }>(action: (values: T) => Promise<import("@/server/errors").ActionResult<O>>, success: string) => {
    const snapshot = state.values;
    form.run(() => action(snapshot), {
      success: isNew ? undefined : success,
      onSuccess: (data) => {
        state.markSaved(snapshot);
        if (isNew) router.push(`${listHref}/${data.id}?etat=cree`);
        else router.refresh();
      },
    });
  };
  return { formRef, ...form, ...state, save };
}

// ---------------------------------------------------------------------------
// Domaines d'intervention
// ---------------------------------------------------------------------------

export function AreaForm({ area, nextOrder }: { area: AdminActionArea | null; nextOrder: number }) {
  const f = useSaver("/admin/domaines", area === null, {
    title: area?.title ?? "",
    slug: area?.slug ?? "",
    summary: area?.summary ?? "",
    description: area?.description ?? "",
    imagePath: area?.imagePath ?? "",
    imageAlt: area?.imageAlt ?? "",
    displayOrder: area?.displayOrder ?? nextOrder,
  });
  const e = (key: string) => fieldError(f.errors, key);
  return (
    <ContentForm
      formRef={f.formRef}
      onSubmit={() => f.save((values) => (area ? updateActionArea({ id: area.id, ...values }) : createActionArea(values)), "Domaine enregistré.")}
      feedback={f.feedback}
      feedbackRef={f.feedbackRef}
      extraErrors={unmatchedErrors(f.errors, ["id", "title", "slug", "summary", "description", "imagePath", "imageAlt", "displayOrder"])}
      pending={f.pending}
      dirty={f.dirty}
      submitLabel={area ? "Enregistrer" : "Créer le domaine"}
    >
      <FieldGroup legend="Domaine d'intervention">
        <TitleSlugFields
          idPrefix="domaine"
          title={f.values.title}
          slug={f.values.slug}
          titleLabel="Nom du domaine"
          titleMax={120}
          titleError={e("title")}
          slugError={e("slug")}
          locked={area?.isActive ?? false}
          publicPrefix="/domaines/"
          onChange={(next) => f.patch(next)}
        />
        <TextAreaField
          id="domaine-summary"
          label="Résumé"
          hint="Une ou deux phrases, affichées sur la carte du domaine."
          max={300}
          rows={3}
          value={f.values.summary}
          error={e("summary")}
          onChange={(value) => f.set("summary", value)}
        />
        <TextAreaField
          id="domaine-description"
          label="Description"
          hint="Texte de la page du domaine. Laissez une ligne vide entre deux paragraphes."
          max={5000}
          rows={8}
          value={f.values.description}
          error={e("description")}
          onChange={(value) => f.set("description", value)}
        />
      </FieldGroup>
      <FieldGroup legend="Image">
        <ImageField
          label="Image du domaine"
          hint="Une vraie photo d'une action de l'ONG dans ce domaine."
          folder="domaines"
          path={f.values.imagePath}
          alt={f.values.imageAlt}
          pathError={e("imagePath")}
          altError={e("imageAlt")}
          onChange={(value) => f.patch({ imagePath: value.path, imageAlt: value.alt })}
        />
      </FieldGroup>
    </ContentForm>
  );
}

// ---------------------------------------------------------------------------
// Partenaires et sponsors
// ---------------------------------------------------------------------------

export function PartnerForm({ partner, nextOrder }: { partner: AdminPartner | null; nextOrder: number }) {
  const f = useSaver("/admin/partenaires", partner === null, {
    name: partner?.name ?? "",
    kind: partner?.kind ?? "partner",
    description: partner?.description ?? "",
    logoPath: partner?.logoPath ?? "",
    websiteUrl: partner?.websiteUrl ?? "",
    displayOrder: partner?.displayOrder ?? nextOrder,
  });
  const e = (key: string) => fieldError(f.errors, key);
  return (
    <ContentForm
      formRef={f.formRef}
      onSubmit={() => f.save((values) => (partner ? updatePartner({ id: partner.id, ...values }) : createPartner(values)), "Partenaire enregistré.")}
      feedback={f.feedback}
      feedbackRef={f.feedbackRef}
      extraErrors={unmatchedErrors(f.errors, ["id", "name", "kind", "description", "logoPath", "websiteUrl", "displayOrder"])}
      pending={f.pending}
      dirty={f.dirty}
      submitLabel={partner ? "Enregistrer" : "Créer le partenaire"}
    >
      <FieldGroup
        legend="Partenaire ou sponsor"
        description="N'ajoutez un partenaire qu'avec son accord écrit pour afficher son nom et son logo."
      >
        <TextField
          id="partenaire-name"
          label="Nom"
          required
          max={160}
          value={f.values.name}
          error={e("name")}
          onChange={(value) => f.set("name", value)}
        />
        <SelectField
          id="partenaire-kind"
          label="Type"
          required
          options={Object.entries(PARTNER_KIND_LABELS).map(([value, label]) => ({ value, label }))}
          value={f.values.kind}
          error={e("kind")}
          onChange={(value) => f.set("kind", value as "partner" | "sponsor")}
        />
        <TextField
          id="partenaire-website"
          type="url"
          label="Site internet"
          hint="Adresse complète, ex. https://www.exemple.org"
          max={500}
          value={f.values.websiteUrl}
          error={e("websiteUrl")}
          onChange={(value) => f.set("websiteUrl", value)}
        />
        <TextAreaField
          id="partenaire-description"
          label="Description (facultative)"
          max={2000}
          rows={4}
          value={f.values.description}
          error={e("description")}
          onChange={(value) => f.set("description", value)}
        />
      </FieldGroup>
      <FieldGroup legend="Logo">
        <ImageField
          label="Logo"
          hint="Le nom du partenaire sert de texte alternatif. PNG ou WebP sur fond transparent de préférence."
          folder="partenaires"
          withAlt={false}
          path={f.values.logoPath}
          alt={f.values.name}
          pathError={e("logoPath")}
          onChange={(value) => f.set("logoPath", value.path)}
        />
      </FieldGroup>
    </ContentForm>
  );
}

// ---------------------------------------------------------------------------
// Équipe
// ---------------------------------------------------------------------------

export function TeamForm({ member, nextOrder }: { member: AdminTeamMember | null; nextOrder: number }) {
  const f = useSaver("/admin/equipe", member === null, {
    fullName: member?.fullName ?? "",
    position: member?.position ?? "",
    teamGroup: member?.teamGroup ?? DEFAULT_TEAM_GROUP,
    bio: member?.bio ?? "",
    photoPath: member?.photoPath ?? "",
    displayOrder: member?.displayOrder ?? nextOrder,
  });
  const e = (key: string) => fieldError(f.errors, key);
  return (
    <ContentForm
      formRef={f.formRef}
      onSubmit={() =>
        f.save((values) => (member ? updateTeamMember({ id: member.id, ...values }) : createTeamMember(values)), "Fiche enregistrée.")
      }
      feedback={f.feedback}
      feedbackRef={f.feedbackRef}
      extraErrors={unmatchedErrors(f.errors, ["id", "fullName", "position", "teamGroup", "bio", "photoPath", "displayOrder"])}
      pending={f.pending}
      dirty={f.dirty}
      submitLabel={member ? "Enregistrer" : "Créer la fiche"}
    >
      <FieldGroup legend="Membre de l'équipe" description="Avec l'accord de la personne pour publier son nom, sa fonction et sa photo.">
        <TextField
          id="equipe-name"
          label="Nom complet"
          required
          max={120}
          value={f.values.fullName}
          error={e("fullName")}
          onChange={(value) => f.set("fullName", value)}
        />
        <TextField
          id="equipe-position"
          label="Fonction"
          hint="Ex. Coordinatrice des projets."
          required
          max={120}
          value={f.values.position}
          error={e("position")}
          onChange={(value) => f.set("position", value)}
        />
        <SelectField
          id="equipe-group"
          label="Instance"
          required
          options={TEAM_GROUPS.map(({ value, label }) => ({ value, label }))}
          value={f.values.teamGroup}
          error={e("teamGroup")}
          onChange={(value) => f.set("teamGroup", value as TeamGroup)}
        />
        <TextAreaField
          id="equipe-bio"
          label="Présentation (facultative)"
          max={2000}
          rows={4}
          value={f.values.bio}
          error={e("bio")}
          onChange={(value) => f.set("bio", value)}
        />
      </FieldGroup>
      <FieldGroup legend="Photo">
        <ImageField
          label="Photo"
          hint="Le nom de la personne sert de texte alternatif."
          folder="equipe"
          withAlt={false}
          path={f.values.photoPath}
          alt={f.values.fullName}
          pathError={e("photoPath")}
          onChange={(value) => f.set("photoPath", value.path)}
        />
      </FieldGroup>
    </ContentForm>
  );
}
