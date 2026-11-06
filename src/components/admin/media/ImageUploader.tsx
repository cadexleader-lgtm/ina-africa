"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { ImageUp, Upload } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FormField";
import { uploadMedia, type UploadedMedia } from "@/server/actions/admin/media";

import { TextField } from "../contenus/fields";
import { fieldError, type FieldErrorsMap } from "../contenus/form-utils";
import { formatFileSize, type PublicMediaFolder } from "../contenus/labels";
import { ACCEPTED_IMAGE_TYPES, prepareImage, type PreparedImage } from "./image-convert";
import { MediaThumb } from "./MediaThumb";

export type UploadedImage = UploadedMedia & { altText: string };

/**
 * Envoi d'une photo vers la médiathèque (photos du site) :
 *  1. choix du fichier → conversion WebP dans le navigateur (deux tailles) ;
 *  2. aperçu + texte alternatif OBLIGATOIRE ;
 *  3. envoi (`file` + `small`) à la Server Action uploadMedia.
 */
export function ImageUploader({
  folder,
  onUploaded,
  initialAlt = "",
}: {
  folder: PublicMediaFolder;
  onUploaded: (media: UploadedImage) => void;
  initialAlt?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [prepared, setPrepared] = useState<PreparedImage | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [alt, setAlt] = useState(initialAlt);
  const [errors, setErrors] = useState<FieldErrorsMap>({});
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  // Libère l'aperçu local quand il change ou quand le composant disparaît.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function onFileChange(file: File | undefined) {
    setErrors({});
    setMessage(null);
    setPrepared(null);
    setPreview(null);
    if (!file) return;
    setPreparing(true);
    const result = await prepareImage(file);
    setPreparing(false);
    if (!result.ok) {
      setErrors({ file: [result.message] });
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setPrepared(result.image);
    setPreview(URL.createObjectURL(result.image.file));
    setMessage({
      tone: "info",
      text: result.image.converted
        ? `Photo prête : ${result.image.width} × ${result.image.height} px, ${formatFileSize(result.image.file.size + (result.image.small?.size ?? 0))} au total.`
        : "Photo prête (envoyée telle quelle : ce navigateur ne sait pas la convertir en WebP).",
    });
  }

  function send() {
    if (!prepared) {
      setErrors({ file: ["Choisissez d'abord une photo."] });
      return;
    }
    if (!alt.trim()) {
      setErrors({ altText: ["Décrivez la photo avant de l'envoyer (texte alternatif obligatoire)."] });
      document.getElementById(`${id}-alt`)?.focus();
      return;
    }
    setErrors({});
    startTransition(async () => {
      const data = new FormData();
      data.set("bucket", "public-media");
      data.set("folder", folder);
      data.set("altText", alt.trim());
      data.set("file", prepared.file);
      if (prepared.small) data.set("small", prepared.small);
      try {
        const result = await uploadMedia(data);
        if (!result.ok) {
          setErrors(result.error.fieldErrors ?? {});
          setMessage({ tone: "error", text: result.error.message });
          return;
        }
        setMessage(null);
        setPrepared(null);
        setPreview(null);
        if (inputRef.current) inputRef.current.value = "";
        onUploaded({ ...result.data, altText: alt.trim() });
        setAlt("");
      } catch {
        setMessage({ tone: "error", text: "L'envoi a échoué (connexion interrompue ou fichier trop lourd). Réessayez." });
      }
    });
  }

  const fileError = fieldError(errors, "file") ?? fieldError(errors, "small");
  const fileHintId = `${id}-file-aide`;
  const fileErrorId = `${id}-file-erreur`;

  return (
    <div
      className="flex flex-col gap-5"
      // Entrée dans un champ de cette fenêtre envoie la photo (et jamais le formulaire de la page).
      onKeyDown={(event) => {
        if (event.key === "Enter" && event.target instanceof HTMLInputElement && event.target.type !== "file") {
          event.preventDefault();
          event.stopPropagation();
          send();
        }
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-file`} className="text-small font-semibold text-brand">
          Photo
        </label>
        <p id={fileHintId} className="-mt-1 text-small text-muted">
          JPEG, PNG ou WebP. La photo est réduite et convertie automatiquement avant l&apos;envoi (4 Mo au plus après
          conversion). N&apos;envoyez que des photos de l&apos;ONG, jamais d&apos;image trouvée sur internet.
        </p>
        <input
          ref={inputRef}
          id={`${id}-file`}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          aria-describedby={[fileHintId, fileError ? fileErrorId : null].filter(Boolean).join(" ")}
          aria-invalid={fileError ? true : undefined}
          onChange={(event) => void onFileChange(event.target.files?.[0])}
          className="block w-full rounded-field border border-line-strong bg-white p-2 text-body text-ink file:mr-4 file:rounded-full file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-semibold file:text-brand hover:file:bg-brand-50 aria-invalid:border-danger"
        />
        {fileError && <FieldError id={fileErrorId}>{fileError}</FieldError>}
      </div>

      <div role="status" aria-live="polite">
        {preparing && <p className="text-small text-muted">Préparation de la photo…</p>}
        {message?.tone === "info" && <p className="text-small text-muted">{message.text}</p>}
      </div>

      {preview && (
        <div className="overflow-hidden rounded-card border border-line">
          <div className="aspect-[16/10] w-full">
            <MediaThumb src={preview} alt={alt.trim() ? `Aperçu : ${alt.trim()}` : "Aperçu de la photo choisie"} fit="contain" />
          </div>
        </div>
      )}

      <TextField
        id={`${id}-alt`}
        label="Texte alternatif (description de la photo)"
        hint="Décrivez ce que montre la photo, en une phrase : il est lu aux personnes malvoyantes et aide Google. Ex. « Distribution de kits scolaires à Porto-Novo »."
        required
        max={300}
        value={alt}
        onChange={(value) => setAlt(value)}
        error={fieldError(errors, "altText")}
      />

      <div role="alert">{message?.tone === "error" && <Alert tone="error" role="none">{message.text}</Alert>}</div>

      <div>
        <Button
          variant="primary"
          iconLeft={prepared ? <Upload /> : <ImageUp />}
          onClick={send}
          loading={pending}
          loadingLabel="Envoi en cours…"
          disabled={preparing}
        >
          Envoyer la photo
        </Button>
      </div>
    </div>
  );
}
