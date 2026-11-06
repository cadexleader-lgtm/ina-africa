"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { deleteMedia, updateMedia } from "@/server/actions/admin/media";
import type { AdminMedia } from "@/server/data/admin/types";

import { SelectField, TextField } from "../contenus/fields";
import { MEDIA_FOLDER_LABELS, formatFileSize, type PublicMediaFolder } from "../contenus/labels";
import { announce, DeleteButton } from "../contenus/RowActions";
import { ImageUploader } from "./ImageUploader";
import { MediaThumb } from "./MediaThumb";

/** Envoi d'une photo depuis la médiathèque (dossier au choix). */
export function MediaUploadPanel() {
  const router = useRouter();
  const [folder, setFolder] = useState<PublicMediaFolder>("divers");
  return (
    <div className="flex flex-col gap-5">
      <SelectField
        id="medias-dossier"
        label="Ranger dans"
        hint="Le dossier sert seulement au rangement de la médiathèque."
        options={Object.entries(MEDIA_FOLDER_LABELS).map(([value, label]) => ({ value, label }))}
        value={folder}
        onChange={(value) => setFolder(value as PublicMediaFolder)}
      />
      <ImageUploader
        folder={folder}
        onUploaded={(media) => {
          announce(`Photo envoyée : ${media.altText}`);
          router.refresh();
        }}
      />
    </div>
  );
}

function MediaCard({ media, canDelete }: { media: AdminMedia; canDelete: boolean }) {
  const router = useRouter();
  const id = useId();
  const [alt, setAlt] = useState(media.altText ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const changed = alt.trim() !== (media.altText ?? "");
  const name = media.altText || media.fileName;

  function save() {
    startTransition(async () => {
      try {
        const result = await updateMedia({ id: media.id, altText: alt });
        if (!result.ok) {
          setError(result.error.fieldErrors?.altText?.[0] ?? result.error.message);
          return;
        }
        setError(null);
        announce(`Description enregistrée : ${media.fileName}`);
        router.refresh();
      } catch {
        setError("La connexion au serveur a échoué. Réessayez.");
      }
    });
  }

  return (
    <li className="flex flex-col overflow-hidden rounded-card border border-line bg-white">
      <div className="aspect-[4/3] w-full border-b border-line">
        <MediaThumb path={media.path} alt={media.altText ?? ""} />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="text-small break-all text-muted">
          <span className="font-semibold text-ink">{media.fileName}</span>
          <br />
          {formatFileSize(media.fileSize)} · {formatDate(media.createdAt)}
          {media.uploadedByName ? ` · ${media.uploadedByName}` : ""}
        </p>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <TextField
            id={`${id}-alt`}
            label="Texte alternatif"
            hint={media.altText ? undefined : "Manquant : obligatoire pour publier cette photo."}
            max={300}
            value={alt}
            error={error}
            onChange={(value) => {
              setAlt(value);
              setError(null);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              iconLeft={<Save />}
              loading={pending}
              disabled={!changed}
              aria-label={`Enregistrer la description : ${media.fileName}`}
            >
              Enregistrer
            </Button>
            {canDelete && (
              <DeleteButton
                name={name}
                action={() => deleteMedia({ id: media.id })}
                warning="Refusé si la photo est encore utilisée par un contenu. Vérifiez aussi qu'elle n'est pas insérée dans le texte d'un article (non détecté)."
              />
            )}
          </div>
        </form>
      </div>
    </li>
  );
}

/** Grille de la médiathèque : description modifiable, suppression (admin). */
export function MediaGrid({ items, canDelete }: { items: AdminMedia[]; canDelete: boolean }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((media) => (
        <MediaCard key={media.id} media={media} canDelete={canDelete} />
      ))}
    </ul>
  );
}
