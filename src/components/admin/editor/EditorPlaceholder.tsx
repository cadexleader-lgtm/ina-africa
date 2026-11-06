/** Emplacement de l'éditeur pendant son chargement. */
export function EditorPlaceholder() {
  return (
    <div
      role="status"
      className="flex min-h-72 items-center justify-center rounded-field border border-line-strong bg-ivory p-4 text-small text-muted"
    >
      Chargement de l&apos;éditeur…
    </div>
  );
}
