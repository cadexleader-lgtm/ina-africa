"use client";

import { useId, useRef, useState } from "react";
import { FileCheck2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FormField";
import type { FinalizedProof } from "@/server/actions/admin/proof-upload";

import { formatFileSize, PROOF_ACCEPT } from "./labels";
import { uploadProof } from "./proof-upload-client";

export type ProofState =
  | { status: "idle" }
  | { status: "uploading"; fileName: string; progress: number }
  | { status: "done"; proof: FinalizedProof }
  | { status: "error"; message: string };

/**
 * Justificatif facultatif d'un don hors ligne (PDF ou image, 10 Mo au plus).
 * Le fichier est envoyé dès qu'il est choisi (envoi signé direct), puis
 * vérifié par le serveur ; le formulaire n'enregistre que son chemin.
 */
export function ProofUploadField({
  state,
  onChange,
  serverError,
  disabled = false,
}: {
  state: ProofState;
  onChange: (state: ProofState) => void;
  /** Erreur renvoyée par l'enregistrement du don (champ proofPath). */
  serverError?: string;
  disabled?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [announce, setAnnounce] = useState("");
  const hintId = `${id}-aide`;
  const errorId = `${id}-erreur`;
  const error = state.status === "error" ? state.message : serverError;

  async function onFile(file: File | undefined) {
    if (!file) return;
    onChange({ status: "uploading", fileName: file.name, progress: 0 });
    setAnnounce(`Envoi du fichier ${file.name} en cours.`);
    let lastStep = 0;
    const result = await uploadProof(file, (fraction) => {
      const percent = Math.round(fraction * 100);
      onChange({ status: "uploading", fileName: file.name, progress: percent });
      // Annonce tous les 25 % seulement (pas de bavardage pour les lecteurs d'écran).
      const step = Math.floor(percent / 25);
      if (step > lastStep && percent < 100) {
        lastStep = step;
        setAnnounce(`Envoi : ${percent} %.`);
      }
    });
    if (inputRef.current) inputRef.current.value = "";
    if (result.ok) {
      onChange({ status: "done", proof: result.proof });
      setAnnounce(`Justificatif ${result.proof.fileName} envoyé et vérifié.`);
    } else {
      onChange({ status: "error", message: result.message });
      setAnnounce(`Justificatif refusé : ${result.message}`);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-small font-semibold text-brand">
        Justificatif (facultatif)
      </label>
      <p id={hintId} className="-mt-1 text-small text-muted">
        Capture du SMS Mobile Money, avis de virement… PDF ou image JPEG, PNG ou WebP, 10 Mo au plus. Le fichier reste
        privé : seuls les administrateurs peuvent l&apos;ouvrir.
      </p>

      {state.status === "done" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-field border border-success/30 bg-success-50 px-4 py-3">
          <FileCheck2 aria-hidden="true" className="size-5 shrink-0 text-success" />
          <p className="min-w-0 flex-1 text-body break-words text-ink">
            <span className="font-semibold">{state.proof.fileName}</span>{" "}
            <span className="text-small text-muted">({formatFileSize(state.proof.fileSize)}) — envoyé et vérifié</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<X />}
            disabled={disabled}
            onClick={() => {
              onChange({ status: "idle" });
              setAnnounce("Justificatif retiré du formulaire.");
            }}
          >
            Retirer
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={PROOF_ACCEPT}
            disabled={disabled || state.status === "uploading"}
            aria-describedby={[hintId, error ? errorId : null].filter(Boolean).join(" ")}
            aria-invalid={error ? true : undefined}
            onChange={(event) => void onFile(event.currentTarget.files?.[0])}
            className="block w-full max-w-xl rounded-field border border-line-strong bg-white p-2 text-body text-ink file:mr-4 file:inline-flex file:min-h-9 file:cursor-pointer file:rounded-full file:border-[1.5px] file:border-brand file:bg-white file:px-4 file:py-1.5 file:text-small file:font-semibold file:text-brand hover:file:bg-brand-50 aria-invalid:border-danger disabled:cursor-not-allowed disabled:bg-ivory"
          />
          {state.status === "uploading" && (
            <div className="flex max-w-xl items-center gap-3">
              <Upload aria-hidden="true" className="size-4 shrink-0 text-brand" />
              <progress
                max={100}
                value={state.progress}
                aria-label={`Envoi de ${state.fileName}`}
                className="h-2 flex-1 overflow-hidden rounded-full accent-brand"
              />
              <span className="text-small text-muted tabular-nums">{state.progress} %</span>
            </div>
          )}
        </div>
      )}

      {error && <FieldError id={errorId}>{error}</FieldError>}
      <p role="status" aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  );
}
