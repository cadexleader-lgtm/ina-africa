"use client";

import dynamic from "next/dynamic";
import { useId, type ReactNode } from "react";

import { FieldError } from "@/components/ui/FormField";
import type { RichTextDoc } from "@/lib/validation/rich-text";

import type { PublicMediaFolder } from "../contenus/labels";
import { EditorPlaceholder } from "./EditorPlaceholder";

/**
 * L'éditeur (Tiptap + ProseMirror) n'est chargé qu'à l'ouverture d'un
 * formulaire qui en a besoin : rien sur le site public, rien sur les listes.
 */
const RichTextEditor = dynamic(() => import("./RichTextEditor"), {
  ssr: false,
  loading: () => <EditorPlaceholder />,
});

/** Champ « texte riche » d'un formulaire : libellé, aide, erreur, éditeur. */
export function RichTextField({
  label,
  hint,
  error,
  value,
  onChange,
  folder,
  required = false,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  value: RichTextDoc | null;
  onChange: (doc: RichTextDoc) => void;
  folder: PublicMediaFolder;
  required?: boolean;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = hint ? `${id}-aide` : undefined;
  const errorId = error ? `${id}-erreur` : undefined;
  return (
    <div className="flex flex-col gap-2">
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
        <p id={hintId} className="-mt-1 text-small text-muted">
          {hint}
        </p>
      )}
      <RichTextEditor
        id={`${id}-editeur`}
        labelId={labelId}
        describedBy={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        invalid={Boolean(error)}
        value={value}
        onChange={onChange}
        folder={folder}
      />
      {error && errorId && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
