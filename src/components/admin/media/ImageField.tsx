"use client";

import { useId, useState, type ReactNode } from "react";
import { ImagePlus, Images, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";

import { TextField } from "../contenus/fields";
import type { PublicMediaFolder } from "../contenus/labels";
import { ImageUploader } from "./ImageUploader";
import { MediaPicker } from "./MediaPicker";
import { MediaThumb } from "./MediaThumb";

export type ImageValue = { path: string; alt: string };

/**
 * Champ « image » d'un formulaire (couverture d'un article, photo d'un
 * domaine, logo…) : aperçu, texte alternatif, envoi d'une nouvelle photo ou
 * choix dans la médiathèque, retrait. Le chemin enregistré est celui de la
 * médiathèque (jamais une adresse externe).
 */
export function ImageField({
  label,
  hint,
  folder,
  path,
  alt,
  onChange,
  pathError,
  altError,
  withAlt = true,
  altLabel = "Texte alternatif de l'image",
  required = false,
}: {
  label: string;
  hint?: ReactNode;
  folder: PublicMediaFolder;
  path: string;
  alt: string;
  onChange: (value: ImageValue) => void;
  pathError?: string | null;
  altError?: string | null;
  /** Texte alternatif saisi ici (sinon : déduit du contenu, ex. nom du partenaire). */
  withAlt?: boolean;
  altLabel?: string;
  required?: boolean;
}) {
  const id = useId();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const labelId = `${id}-label`;
  const hintId = hint ? `${id}-aide` : undefined;
  const errorId = pathError ? `${id}-erreur` : undefined;

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined} className="flex flex-col gap-3">
      <p id={labelId} className="text-small font-semibold text-brand">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </p>
      {hint && (
        <p id={hintId} className="-mt-2 text-small text-muted">
          {hint}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-card border border-line bg-ivory sm:w-48">
          {path ? (
            <MediaThumb path={path} alt={alt ? `Image choisie : ${alt}` : "Image choisie (sans description)"} />
          ) : (
            <p className="flex size-full items-center justify-center p-4 text-center text-small text-muted">Aucune image</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" iconLeft={<ImagePlus />} onClick={() => setUploadOpen(true)}>
            Envoyer une photo
          </Button>
          <Button size="sm" variant="secondary" iconLeft={<Images />} onClick={() => setPickerOpen(true)}>
            Choisir dans la médiathèque
          </Button>
          {path && (
            <Button size="sm" variant="ghost" iconLeft={<X />} onClick={() => onChange({ path: "", alt: "" })}>
              Retirer l&apos;image
            </Button>
          )}
        </div>
      </div>
      {pathError && errorId && <FieldError id={errorId}>{pathError}</FieldError>}

      {withAlt && path && (
        <TextField
          id={`${id}-alt`}
          label={altLabel}
          hint="Décrivez ce que montre l'image (obligatoire pour publier)."
          required
          max={300}
          value={alt}
          error={altError}
          onChange={(value) => onChange({ path, alt: value })}
        />
      )}

      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Envoyer une photo" size="lg">
        <ImageUploader
          folder={folder}
          onUploaded={(media) => {
            onChange({ path: media.path, alt: media.altText });
            setUploadOpen(false);
          }}
        />
      </Modal>
      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(media) => {
          onChange({ path: media.path, alt: media.altText ?? "" });
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
