"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

import { EMPTY_DOC, type RichTextDoc } from "@/lib/validation/rich-text";
import { createProject, updateProject } from "@/server/actions/admin/content";
import type { AdminActionArea, AdminProject } from "@/server/data/admin/types";

import { RichTextField } from "../../editor/RichTextField";
import { richTextProblems } from "../../editor/rich-text-filter";
import { ImageField } from "../../media/ImageField";
import { ContentForm } from "../ContentForm";
import { CheckField, FieldGroup, SelectField, TextAreaField, TextField, TitleSlugFields } from "../fields";
import { fieldError, unmatchedErrors } from "../form-utils";
import { PROJECT_STATUS_LABELS } from "../labels";
import { useActionForm, useFormValues } from "../useActionForm";
import { SeoFields } from "./ArticleEditor";

type ProjectValues = {
  title: string;
  slug: string;
  summary: string;
  content: RichTextDoc;
  location: string;
  startDate: string;
  endDate: string;
  status: AdminProject["status"];
  actionAreaId: string;
  isFeatured: boolean;
  coverImagePath: string;
  coverImageAlt: string;
  seoTitle: string;
  seoDescription: string;
};

const KEYS = [
  "id",
  "title",
  "slug",
  "summary",
  "content",
  "location",
  "startDate",
  "endDate",
  "status",
  "actionAreaId",
  "isFeatured",
  "coverImagePath",
  "coverImageAlt",
  "seoTitle",
  "seoDescription",
];

/** Création / modification d'un projet (admin). Un nouveau projet n'est pas publié. */
export function ProjectForm({ project, areas }: { project: AdminProject | null; areas: AdminActionArea[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { pending, errors, setErrors, feedback, setFeedback, feedbackRef, run } = useActionForm(formRef);
  const { values, set, patch, dirty, markSaved } = useFormValues<ProjectValues>({
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    summary: project?.summary ?? "",
    content: project?.content ?? EMPTY_DOC,
    location: project?.location ?? "",
    startDate: project?.startDate ?? "",
    endDate: project?.endDate ?? "",
    status: project?.status ?? "ongoing",
    actionAreaId: project?.actionAreaId ?? "",
    isFeatured: project?.isFeatured ?? false,
    coverImagePath: project?.coverImagePath ?? "",
    coverImageAlt: project?.coverImageAlt ?? "",
    seoTitle: project?.seoTitle ?? "",
    seoDescription: project?.seoDescription ?? "",
  });
  const e = (key: string) => fieldError(errors, key);

  function submit() {
    const problems = richTextProblems(values.content);
    if (problems.length) {
      setErrors({ content: problems });
      setFeedback({ tone: "error", message: "Certaines informations sont à corriger." });
      return;
    }
    const snapshot = values;
    run(() => (project ? updateProject({ id: project.id, ...snapshot }) : createProject(snapshot)), {
      success: project ? "Projet enregistré." : undefined,
      onSuccess: (data) => {
        markSaved(snapshot);
        if (!project) router.push(`/admin/projets/${data.id}?etat=cree`);
        else router.refresh();
      },
    });
  }

  return (
    <ContentForm
      formRef={formRef}
      onSubmit={submit}
      feedback={feedback}
      feedbackRef={feedbackRef}
      extraErrors={unmatchedErrors(errors, KEYS)}
      pending={pending}
      dirty={dirty}
      submitLabel={project ? "Enregistrer" : "Créer le projet"}
    >
      <FieldGroup legend="Projet">
        <TitleSlugFields
          idPrefix="projet"
          title={values.title}
          slug={values.slug}
          titleLabel="Titre du projet"
          titleMax={200}
          titleError={e("title")}
          slugError={e("slug")}
          locked={project?.isPublished ?? false}
          publicPrefix="/projets/"
          onChange={(next) => patch(next)}
        />
        <TextAreaField
          id="projet-summary"
          label="Résumé"
          hint="Affiché sur les cartes des projets. Un résumé ou une description est nécessaire pour publier."
          max={300}
          rows={3}
          value={values.summary}
          error={e("summary")}
          onChange={(value) => set("summary", value)}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            id="projet-status"
            label="État du projet"
            required
            options={Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
            value={values.status}
            error={e("status")}
            onChange={(value) => set("status", value as ProjectValues["status"])}
          />
          <SelectField
            id="projet-area"
            label="Domaine d'intervention"
            emptyLabel="Aucun domaine"
            options={areas.map((area) => ({ value: area.id, label: area.isActive ? area.title : `${area.title} (inactif)` }))}
            value={values.actionAreaId}
            error={e("actionAreaId")}
            onChange={(value) => set("actionAreaId", value)}
          />
        </div>
        <TextField
          id="projet-location"
          label="Lieu"
          hint="Ex. Porto-Novo, Bénin."
          max={200}
          value={values.location}
          error={e("location")}
          onChange={(value) => set("location", value)}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="projet-start"
            type="date"
            label="Date de début"
            value={values.startDate}
            error={e("startDate")}
            onChange={(value) => set("startDate", value)}
          />
          <TextField
            id="projet-end"
            type="date"
            label="Date de fin"
            value={values.endDate}
            error={e("endDate")}
            onChange={(value) => set("endDate", value)}
          />
        </div>
        <CheckField
          id="projet-featured"
          label="Mettre en avant sur la page d'accueil"
          checked={values.isFeatured}
          error={e("isFeatured")}
          onChange={(checked) => set("isFeatured", checked)}
        />
        <RichTextField
          label="Description du projet"
          hint="Objectifs, actions menées, résultats réels."
          value={values.content}
          error={e("content")}
          folder="projets"
          onChange={(doc) => set("content", doc)}
        />
      </FieldGroup>

      <FieldGroup legend="Image principale">
        <ImageField
          label="Image principale"
          hint="Uniquement une vraie photo du projet."
          folder="projets"
          path={values.coverImagePath}
          alt={values.coverImageAlt}
          pathError={e("coverImagePath")}
          altError={e("coverImageAlt")}
          onChange={(value) => patch({ coverImagePath: value.path, coverImageAlt: value.alt })}
        />
      </FieldGroup>

      <SeoFields
        idPrefix="projet"
        title={values.seoTitle}
        description={values.seoDescription}
        titleError={e("seoTitle")}
        descriptionError={e("seoDescription")}
        onChange={(next) => patch(next)}
      />
    </ContentForm>
  );
}
