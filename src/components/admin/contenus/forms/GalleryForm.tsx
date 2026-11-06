"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Film, ImageIcon } from "lucide-react";

import { checkVideoUrl } from "@/components/admin/editor/editor-config";
import { createGalleryItem, updateGalleryItem } from "@/server/actions/admin/content";
import type { AdminGalleryItem } from "@/server/data/admin/types";

import { ImageField } from "../../media/ImageField";
import { ContentForm } from "../ContentForm";
import { FieldGroup, SelectField, TextAreaField, TextField } from "../fields";
import { fieldError, unmatchedErrors } from "../form-utils";
import { useActionForm, useFormValues } from "../useActionForm";

type GalleryValues = {
  itemType: "photo" | "video";
  imagePath: string;
  imageAlt: string;
  videoUrl: string;
  caption: string;
  takenOn: string;
  projectId: string;
  displayOrder: number;
};

const KEYS = ["id", "itemType", "imagePath", "imageAlt", "videoUrl", "caption", "takenOn", "projectId", "displayOrder"];

/** Élément de la galerie : photo de la médiathèque OU vidéo YouTube / Facebook. */
export function GalleryForm({
  item,
  projects,
  nextOrder,
}: {
  item: AdminGalleryItem | null;
  projects: { id: string; title: string }[];
  nextOrder: number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { pending, errors, setErrors, feedback, setFeedback, feedbackRef, run } = useActionForm(formRef);
  const { values, set, patch, dirty, markSaved } = useFormValues<GalleryValues>({
    itemType: item?.itemType ?? "photo",
    imagePath: item?.imagePath ?? "",
    imageAlt: item?.imageAlt ?? "",
    videoUrl: item?.videoUrl ?? "",
    caption: item?.caption ?? "",
    takenOn: item?.takenOn ?? "",
    projectId: item?.projectId ?? "",
    displayOrder: item?.displayOrder ?? nextOrder,
  });
  const e = (key: string) => fieldError(errors, key);
  const isVideo = values.itemType === "video";

  function submit() {
    if (isVideo) {
      const check = checkVideoUrl(values.videoUrl);
      if (!check.ok) {
        setErrors({ videoUrl: [check.message] });
        setFeedback({ tone: "error", message: "Certaines informations sont à corriger." });
        return;
      }
    }
    // Seuls les champs du type choisi sont envoyés (photo : pas d'adresse de vidéo).
    const snapshot = values;
    const input = isVideo ? snapshot : { ...snapshot, videoUrl: undefined };
    run(() => (item ? updateGalleryItem({ id: item.id, ...input }) : createGalleryItem(input)), {
      success: item ? "Élément de la galerie enregistré." : undefined,
      onSuccess: (data) => {
        markSaved(snapshot);
        if (!item) router.push(`/admin/galerie/${data.id}?etat=cree`);
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
      submitLabel={item ? "Enregistrer" : "Ajouter à la galerie"}
    >
      <FieldGroup legend="Type d'élément">
        <div role="radiogroup" aria-label="Type d'élément" className="flex flex-wrap gap-3">
          {(
            [
              { value: "photo", label: "Photo", Icon: ImageIcon },
              { value: "video", label: "Vidéo YouTube ou Facebook", Icon: Film },
            ] as const
          ).map(({ value, label, Icon }) => (
            <label
              key={value}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-field border border-line-strong bg-white px-4 has-checked:border-brand has-checked:bg-brand-50"
            >
              <input
                type="radio"
                name="gallery-type"
                value={value}
                checked={values.itemType === value}
                disabled={item !== null}
                onChange={() => set("itemType", value)}
                className="size-5 accent-brand"
              />
              <Icon aria-hidden="true" className="size-5 text-brand" />
              <span className="text-body text-ink">{label}</span>
            </label>
          ))}
        </div>
        {item && <p className="text-small text-muted">Le type ne peut plus changer : créez un nouvel élément si besoin.</p>}
      </FieldGroup>

      {isVideo ? (
        <FieldGroup legend="Vidéo">
          <TextField
            id="galerie-video"
            type="url"
            label="Adresse de la vidéo"
            hint="Lien de partage YouTube ou Facebook (https://…)."
            required
            max={500}
            value={values.videoUrl}
            error={e("videoUrl")}
            onChange={(value) => set("videoUrl", value)}
          />
          <ImageField
            label="Image d'aperçu (facultative)"
            folder="galerie"
            path={values.imagePath}
            alt={values.imageAlt}
            pathError={e("imagePath")}
            altError={e("imageAlt")}
            onChange={(value) => patch({ imagePath: value.path, imageAlt: value.alt })}
          />
        </FieldGroup>
      ) : (
        <FieldGroup legend="Photo">
          <ImageField
            label="Photo"
            hint="Uniquement une vraie photo d'une action de l'ONG."
            required
            folder="galerie"
            path={values.imagePath}
            alt={values.imageAlt}
            pathError={e("imagePath")}
            altError={e("imageAlt")}
            onChange={(value) => patch({ imagePath: value.path, imageAlt: value.alt })}
          />
        </FieldGroup>
      )}

      <FieldGroup legend="Informations">
        <TextAreaField
          id="galerie-caption"
          label="Légende (facultative)"
          max={500}
          rows={3}
          value={values.caption}
          error={e("caption")}
          onChange={(value) => set("caption", value)}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="galerie-date"
            type="date"
            label="Date de la prise de vue"
            value={values.takenOn}
            error={e("takenOn")}
            onChange={(value) => set("takenOn", value)}
          />
          <SelectField
            id="galerie-project"
            label="Projet lié"
            hint="La photo apparaît aussi sur la page du projet."
            emptyLabel="Aucun projet"
            options={projects.map((project) => ({ value: project.id, label: project.title }))}
            value={values.projectId}
            error={e("projectId")}
            onChange={(value) => set("projectId", value)}
          />
        </div>
      </FieldGroup>
    </ContentForm>
  );
}
