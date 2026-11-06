"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

import { EMPTY_DOC, type RichTextDoc } from "@/lib/validation/rich-text";
import { createCampaign, updateCampaign } from "@/server/actions/admin/campaigns";
import type { AdminCampaign } from "@/server/data/admin/types";

import { RichTextField } from "../../editor/RichTextField";
import { richTextProblems } from "../../editor/rich-text-filter";
import { ImageField } from "../../media/ImageField";
import { ContentForm } from "../ContentForm";
import { CheckField, FieldGroup, TextAreaField, TextField, TitleSlugFields } from "../fields";
import { fieldError, unmatchedErrors } from "../form-utils";
import { useActionForm, useFormValues } from "../useActionForm";
import { SeoFields } from "./ArticleEditor";

type CampaignValues = {
  title: string;
  slug: string;
  summary: string;
  content: RichTextDoc;
  coverImagePath: string;
  coverImageAlt: string;
  goalAmount: string;
  startsOn: string;
  endsOn: string;
  showProgress: boolean;
  shareMessage: string;
  seoTitle: string;
  seoDescription: string;
};

const KEYS = [
  "id",
  "title",
  "slug",
  "summary",
  "content",
  "coverImagePath",
  "coverImageAlt",
  "goalAmount",
  "startsOn",
  "endsOn",
  "showProgress",
  "shareMessage",
  "seoTitle",
  "seoDescription",
];

/** Appel aux dons (admin) : sa page publique et le lien à partager. */
export function CampaignForm({ campaign }: { campaign: AdminCampaign | null }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { pending, errors, setErrors, feedback, setFeedback, feedbackRef, run } = useActionForm(formRef);
  const { values, set, patch, dirty, markSaved } = useFormValues<CampaignValues>({
    title: campaign?.title ?? "",
    slug: campaign?.slug ?? "",
    summary: campaign?.summary ?? "",
    content: campaign?.content ?? EMPTY_DOC,
    coverImagePath: campaign?.coverImagePath ?? "",
    coverImageAlt: campaign?.coverImageAlt ?? "",
    goalAmount: campaign?.goalAmount ? String(campaign.goalAmount) : "",
    startsOn: campaign?.startsOn ?? "",
    endsOn: campaign?.endsOn ?? "",
    showProgress: campaign?.showProgress ?? false,
    shareMessage: campaign?.shareMessage ?? "",
    seoTitle: campaign?.seoTitle ?? "",
    seoDescription: campaign?.seoDescription ?? "",
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
    run(() => (campaign ? updateCampaign({ id: campaign.id, ...snapshot }) : createCampaign(snapshot)), {
      success: campaign ? "Appel aux dons enregistré." : undefined,
      onSuccess: (data) => {
        markSaved(snapshot);
        if (!campaign) router.push(`/admin/appels-aux-dons/${data.id}?etat=cree`);
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
      submitLabel={campaign ? "Enregistrer" : "Créer l'appel aux dons"}
    >
      <FieldGroup legend="Appel aux dons">
        <TitleSlugFields
          idPrefix="appel"
          title={values.title}
          slug={values.slug}
          titleLabel="Titre de l'appel"
          titleMax={200}
          titleError={e("title")}
          slugError={e("slug")}
          locked={campaign?.isActive ?? false}
          publicPrefix="/faire-un-don/"
          onChange={(next) => patch(next)}
        />
        <TextAreaField
          id="appel-summary"
          label="Résumé"
          hint="Une ou deux phrases. Un résumé ou un texte est nécessaire pour activer l'appel."
          max={300}
          rows={3}
          value={values.summary}
          error={e("summary")}
          onChange={(value) => set("summary", value)}
        />
        <RichTextField
          label="Texte de l'appel"
          hint="Pourquoi cet appel, à quoi serviront les dons."
          value={values.content}
          error={e("content")}
          folder="appels"
          onChange={(doc) => set("content", doc)}
        />
      </FieldGroup>

      <FieldGroup legend="Objectif et dates">
        <TextField
          id="appel-goal"
          label="Objectif (en francs CFA, facultatif)"
          hint="Nombre entier, ex. 500000."
          inputMode="numeric"
          value={values.goalAmount}
          error={e("goalAmount")}
          onChange={(value) => set("goalAmount", value)}
        />
        <CheckField
          id="appel-progress"
          label="Afficher la jauge de progression sur la page publique"
          hint="Le total affiché additionne les dons en ligne vérifiés et les dons hors ligne enregistrés."
          checked={values.showProgress}
          error={e("showProgress")}
          onChange={(checked) => set("showProgress", checked)}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="appel-start"
            type="date"
            label="Date de début"
            value={values.startsOn}
            error={e("startsOn")}
            onChange={(value) => set("startsOn", value)}
          />
          <TextField
            id="appel-end"
            type="date"
            label="Date de fin"
            value={values.endsOn}
            error={e("endsOn")}
            onChange={(value) => set("endsOn", value)}
          />
        </div>
      </FieldGroup>

      <FieldGroup legend="Partage">
        <ImageField
          label="Image (aperçu WhatsApp et Facebook)"
          folder="appels"
          path={values.coverImagePath}
          alt={values.coverImageAlt}
          pathError={e("coverImagePath")}
          altError={e("coverImageAlt")}
          onChange={(value) => patch({ coverImagePath: value.path, coverImageAlt: value.alt })}
        />
        <TextAreaField
          id="appel-share"
          label="Message de partage (facultatif)"
          hint="Texte proposé avec le lien lors d'un partage sur WhatsApp."
          max={1000}
          rows={3}
          value={values.shareMessage}
          error={e("shareMessage")}
          onChange={(value) => set("shareMessage", value)}
        />
      </FieldGroup>

      <SeoFields
        idPrefix="appel"
        title={values.seoTitle}
        description={values.seoDescription}
        titleError={e("seoTitle")}
        descriptionError={e("seoDescription")}
        onChange={(next) => patch(next)}
      />
    </ContentForm>
  );
}
